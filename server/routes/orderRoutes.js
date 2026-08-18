import express from 'express';
import { runQuery, getQuery, allQuery } from '../db.js';
import { verifyToken, requireRole } from '../auth.js';

const router = express.Router();

// Helper: Get IST Date (Asia/Kolkata UTC+5:30)
const getISTDate = (dateObj = new Date()) => {
  const utcMs = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
  return new Date(utcMs + (5.5 * 60 * 60 * 1000));
};

const getISTDateTimeString = (dateObj = new Date()) => {
  const d = getISTDate(dateObj);
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yr}-${mo}-${dy} ${hh}:${mm}:${ss}`;
};

// Helper: Generate unique order number (using IST date string)
const generateOrderNumber = () => {
  const d = getISTDate();
  const yr = String(d.getFullYear()).slice(2);
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  const dateStr = `${yr}${mo}${dy}`;
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${dateStr}-${randomNum}`;
};

// Customer: Submit Order
router.post('/', async (req, res) => {
  try {
    const { table_number, customer_phone, payment_mode, items, coupon_code } = req.body;
    if (!table_number || !items || !items.length) {
      return res.status(400).json({ error: 'Table number and order items are required.' });
    }

    // 1. Fetch settings for tax rate
    const settings = await getQuery('SELECT tax_rate FROM restaurant_settings LIMIT 1');
    const taxRate = settings ? settings.tax_rate : 5.0;

    // 2. Validate & deduct stock for each item atomically
    let subtotal = 0;
    const validatedItems = [];

    for (const cartItem of items) {
      const targetItemId = cartItem.item_id || cartItem.id;
      const dbItem = await getQuery('SELECT * FROM menu_items WHERE id = ?', [targetItemId]);
      if (!dbItem) {
        return res.status(400).json({ error: `Item '${cartItem.item_name || cartItem.name || 'ID ' + targetItemId}' not found.` });
      }
      if (dbItem.is_active === 0) {
        return res.status(400).json({ error: `Item '${dbItem.name}' is currently unavailable.` });
      }
      if (dbItem.stock_quantity < cartItem.quantity) {
        return res.status(400).json({ error: `Insufficient stock for '${dbItem.name}'. Available: ${dbItem.stock_quantity}` });
      }

      let unitPrice = dbItem.price;
      if (cartItem.variant_price_modifier) {
        unitPrice += cartItem.variant_price_modifier;
      }
      if (cartItem.toppings_price) {
        unitPrice += cartItem.toppings_price;
      }

      const itemTotal = unitPrice * cartItem.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        item_id: dbItem.id,
        item_name: dbItem.name,
        variant_name: cartItem.variant_name || null,
        toppings_summary: cartItem.toppings_summary || null,
        spice_level: cartItem.spice_level || dbItem.spice_level,
        quantity: cartItem.quantity,
        unit_price: unitPrice,
        total_price: itemTotal,
        fulfillment_type: cartItem.fulfillment_type || 'dine_in',
        current_stock: dbItem.stock_quantity,
        low_threshold: dbItem.low_stock_threshold || 5
      });
    }

    // 3. Apply Coupon Discount if provided
    let discountAmount = 0;
    if (coupon_code) {
      const coupon = await getQuery('SELECT * FROM coupons WHERE code = ? AND is_active = 1', [coupon_code.toUpperCase()]);
      if (coupon) {
        const now = new Date();
        const start = new Date(coupon.valid_from);
        const until = new Date(coupon.valid_until);
        if (now >= start && now <= until) {
          if (coupon.discount_type === 'percentage') {
            discountAmount = (subtotal * coupon.discount_value) / 100;
          } else {
            discountAmount = coupon.discount_value;
          }
          await runQuery('UPDATE coupons SET times_used = times_used + 1 WHERE id = ?', [coupon.id]);
        }
      }
    }

    const netBeforeTax = Math.max(0, subtotal - discountAmount);
    const taxAmount = (netBeforeTax * taxRate) / 100;
    const finalTotal = netBeforeTax + taxAmount;

    // 4. Check if there is an existing active session order for this table to append items onto
    const existingActiveOrder = (table_number && table_number !== 'None') ? await getQuery(`
      SELECT * FROM orders 
      WHERE table_number = ? 
      AND status NOT IN ('completed', 'delivered', 'cancelled', 'refunded')
      ORDER BY id DESC LIMIT 1
    `, [table_number]) : null;

    const { scheduled_time, order_source = 'customer', placed_by_name = '', placed_by_role = '' } = req.body;
    const defaultPrepMins = 15;
    const nowLocalStr = getISTDateTimeString();
    const initialEstimatedReadyAt = new Date(Date.now() + defaultPrepMins * 60 * 1000).toISOString();

    let orderId;
    let orderNumber;
    let isAppended = false;

    if (existingActiveOrder) {
      // APPEND ITEMS TO EXISTING ACTIVE TABLE ORDER (Same Order Number, Combined Session Bill)
      isAppended = true;
      orderId = existingActiveOrder.id;
      orderNumber = existingActiveOrder.order_number;

      const accumulatedTotalAmount = Number(existingActiveOrder.total_amount || 0) + subtotal;
      const accumulatedDiscountAmount = Number(existingActiveOrder.discount_amount || 0) + discountAmount;
      const accumulatedNetBeforeTax = Math.max(0, accumulatedTotalAmount - accumulatedDiscountAmount);
      const accumulatedTaxAmount = (accumulatedNetBeforeTax * taxRate) / 100;
      const accumulatedFinalTotal = accumulatedNetBeforeTax + accumulatedTaxAmount;
      const updatedPhone = customer_phone || existingActiveOrder.customer_phone;

      // Track online vs cash payment split
      let existingOnlinePaid = Number(existingActiveOrder.online_paid || 0);
      let existingCashPaid = Number(existingActiveOrder.cash_paid || 0);

      if (existingActiveOrder.payment_status === 'completed' && existingOnlinePaid === 0 && existingCashPaid === 0) {
        if (existingActiveOrder.payment_mode === 'online') {
          existingOnlinePaid = Number(existingActiveOrder.net_amount || 0);
        } else {
          existingCashPaid = Number(existingActiveOrder.net_amount || 0);
        }
      }

      if (payment_mode === 'online') {
        existingOnlinePaid += finalTotal;
      }

      let newPaymentMode = existingActiveOrder.payment_mode;
      if ((existingOnlinePaid > 0 && payment_mode === 'cash') || (existingCashPaid > 0 && payment_mode === 'online') || existingActiveOrder.payment_mode === 'cash_and_online') {
        newPaymentMode = 'cash_and_online';
      } else if (payment_mode) {
        newPaymentMode = payment_mode;
      }

      const totalPaidSoFar = existingOnlinePaid + existingCashPaid;
      const newPaymentStatus = totalPaidSoFar >= (accumulatedFinalTotal - 1) ? 'completed' : 'pending';

      await runQuery(`
        UPDATE orders SET
        total_amount = ?,
        tax_amount = ?,
        discount_amount = ?,
        net_amount = ?,
        customer_phone = ?,
        status = 'active',
        payment_mode = ?,
        payment_status = ?,
        online_paid = ?,
        cash_paid = ?
        WHERE id = ?
      `, [
        accumulatedTotalAmount,
        accumulatedTaxAmount,
        accumulatedDiscountAmount,
        accumulatedFinalTotal,
        updatedPhone || null,
        newPaymentMode,
        newPaymentStatus,
        existingOnlinePaid,
        existingCashPaid,
        orderId
      ]);
    } else {
      // CREATE BRAND NEW ORDER
      orderNumber = generateOrderNumber();
      const initialOnlinePaid = payment_mode === 'online' ? finalTotal : 0;
      const initialCashPaid = (payment_mode === 'cash' && req.body.payment_status === 'completed') ? finalTotal : 0;

      const orderRes = await runQuery(`
        INSERT INTO orders
        (order_number, table_number, customer_phone, payment_mode, payment_status, total_amount, tax_amount, discount_amount, net_amount, online_paid, cash_paid, status, order_source, placed_by_name, placed_by_role, scheduled_time, prep_time_minutes, estimated_ready_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?)
      `, [orderNumber, table_number, customer_phone || null, payment_mode || 'cash', payment_mode === 'online' ? 'completed' : (req.body.payment_status || 'pending'), subtotal, taxAmount, discountAmount, finalTotal, initialOnlinePaid, initialCashPaid, order_source, placed_by_name || '', placed_by_role || '', scheduled_time || 'ASAP (~15 mins)', defaultPrepMins, initialEstimatedReadyAt, nowLocalStr]);

      orderId = orderRes.lastID;
    }

    // 5. Insert new order items & update stock
    const createdItems = [];
    const stockAlerts = [];

    for (const vItem of validatedItems) {
      const itemRes = await runQuery(`
        INSERT INTO order_items
        (order_id, item_id, item_name, variant_name, toppings_summary, spice_level, quantity, unit_price, total_price, fulfillment_type, status, prep_time_minutes, estimated_ready_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
      `, [orderId, vItem.item_id, vItem.item_name, vItem.variant_name, vItem.toppings_summary, vItem.spice_level, vItem.quantity, vItem.unit_price, vItem.total_price, vItem.fulfillment_type, defaultPrepMins, initialEstimatedReadyAt]);

      // Atomic stock decrement
      const newStock = vItem.current_stock - vItem.quantity;
      await runQuery('UPDATE menu_items SET stock_quantity = ? WHERE id = ?', [newStock, vItem.item_id]);

      if (newStock <= vItem.low_threshold) {
        stockAlerts.push({ itemId: vItem.item_id, itemName: vItem.item_name, newStock });
      }

      createdItems.push({
        id: itemRes.lastID,
        order_id: orderId,
        item_id: vItem.item_id,
        item_name: vItem.item_name,
        variant_name: vItem.variant_name,
        toppings_summary: vItem.toppings_summary,
        spice_level: vItem.spice_level,
        quantity: vItem.quantity,
        unit_price: vItem.unit_price,
        total_price: vItem.total_price,
        fulfillment_type: vItem.fulfillment_type,
        status: 'pending'
      });
    }

    const fetchedOrder = await getQuery('SELECT * FROM orders WHERE id = ?', [orderId]);
    const allOrderItems = await allQuery('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC', [orderId]);

    const completeOrder = {
      ...fetchedOrder,
      items: allOrderItems,
      isAppended
    };

    // Emit Socket.io event to kitchen, admin, and all connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('new_order', completeOrder);
      io.to('kitchen').emit('new_order', completeOrder);
      io.to('admin').emit('new_order', completeOrder);
      if (stockAlerts.length > 0) {
        io.emit('stock_alert', stockAlerts);
        io.to('kitchen').emit('stock_alert', stockAlerts);
        io.to('admin').emit('stock_alert', stockAlerts);
      }
    }

    res.json(completeOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customer: Live track single order
router.get('/track/:id', async (req, res) => {
  try {
    const order = await getQuery('SELECT * FROM orders WHERE id = ? OR order_number = ?', [req.params.id, req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const items = await allQuery('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC', [order.id]);
    const review = await getQuery('SELECT * FROM reviews WHERE order_id = ?', [order.id]);

    res.json({ ...order, items, review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kitchen / Admin: Get active kitchen orders
router.get('/active', async (req, res) => {
  try {
    const orders = await allQuery(`
      SELECT * FROM orders 
      WHERE status = 'active'
      ORDER BY id DESC
    `);
    const allItems = await allQuery(`SELECT * FROM order_items ORDER BY id ASC`);

    const result = orders.map(ord => ({
      ...ord,
      items: allItems.filter(it => it.order_id === ord.id)
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kitchen: Update individual line item status (Accept, Preparing, Ready, Served, Reject) + Prep Time
router.patch('/items/:itemId/status', verifyToken, requireRole(['chef', 'admin', 'cashier']), async (req, res) => {
  try {
    const { status, rejection_reason, prep_time_minutes } = req.body;
    if (!['accepted', 'preparing', 'cooling', 'ready', 'served', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    const item = await getQuery('SELECT * FROM order_items WHERE id = ?', [req.params.itemId]);
    if (!item) return res.status(404).json({ error: 'Order item not found.' });

    const prepMins = prep_time_minutes ? parseInt(prep_time_minutes) : (item.prep_time_minutes || 15);
    const estimatedReadyAt = new Date(Date.now() + prepMins * 60 * 1000).toISOString();

    await runQuery(
      'UPDATE order_items SET status = ?, rejection_reason = ?, prep_time_minutes = ?, estimated_ready_at = ? WHERE id = ?',
      [status, rejection_reason || null, prepMins, estimatedReadyAt, req.params.itemId]
    );

    // Also update parent order's estimated ready time if not set or if higher
    await runQuery(
      'UPDATE orders SET prep_time_minutes = ?, estimated_ready_at = ? WHERE id = ?',
      [prepMins, estimatedReadyAt, item.order_id]
    );

    // If item was rejected, replenish stock
    if (status === 'rejected') {
      await runQuery('UPDATE menu_items SET stock_quantity = stock_quantity + ? WHERE id = ?', [item.quantity, item.item_id]);
    }

    const updatedItem = await getQuery('SELECT * FROM order_items WHERE id = ?', [req.params.itemId]);
    const parentOrder = await getQuery('SELECT * FROM orders WHERE id = ?', [item.order_id]);

    // Check if all items in this order are served or rejected -> mark order completed
    const siblingItems = await allQuery('SELECT status FROM order_items WHERE order_id = ?', [item.order_id]);
    const allDone = siblingItems.every(i => ['served', 'rejected'].includes(i.status));

    if (allDone) {
      await runQuery("UPDATE orders SET status = 'completed' WHERE id = ?", [item.order_id]);
    }

    // Broadcast live event via Socket.io
    const io = req.app.get('io');
    if (io) {
      const payload = {
        orderId: item.order_id,
        tableNumber: parentOrder.table_number,
        item: updatedItem,
        estimated_ready_at: estimatedReadyAt,
        prep_time_minutes: prepMins
      };
      io.to(`table_${parentOrder.table_number}`).emit('item_status_updated', payload);
      io.to('kitchen').emit('item_status_updated', payload);
      io.to('admin').emit('item_status_updated', payload);
    }

    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin / Cashier / Waiter: Update table number for an order (e.g. Assign table to Takeaway order)
router.patch('/:id/table', verifyToken, requireRole(['admin', 'cashier', 'waiter']), async (req, res) => {
  try {
    const { table_number } = req.body;
    if (!table_number) return res.status(400).json({ error: 'Table number is required.' });

    await runQuery('UPDATE orders SET table_number = ? WHERE id = ?', [table_number.toUpperCase(), req.params.id]);
    const updatedOrder = await getQuery('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    const items = await allQuery('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);

    const complete = { ...updatedOrder, items };
    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('order_updated', complete);
      io.to('kitchen').emit('order_updated', complete);
    }

    res.json(complete);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin / Cashier: Update full order status or payment status (e.g. Settle / Complete / Cancel / Refund)
router.patch('/:id/status', verifyToken, requireRole(['admin', 'cashier']), async (req, res) => {
  try {
    let { status, payment_status, payment_mode, refund_reason } = req.body;
    const order = await getQuery('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    // Normalize payment_status values ('paid' -> 'completed')
    if (payment_status === 'paid') payment_status = 'completed';

    const newStatus = status || order.status;
    const newPaymentStatus = payment_status || order.payment_status;
    const newPaymentMode = payment_mode || order.payment_mode;

    await runQuery(
      'UPDATE orders SET status = ?, payment_status = ?, payment_mode = ?, refund_reason = ? WHERE id = ?',
      [newStatus, newPaymentStatus, newPaymentMode, refund_reason || order.refund_reason || null, req.params.id]
    );

    const updatedOrder = await getQuery('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customer: Submit Ratings & Review
router.post('/review', async (req, res) => {
  try {
    const { order_id, rating, comment, redirected_to_google } = req.body;
    if (!order_id || !rating) return res.status(400).json({ error: 'Order ID and rating are required.' });

    await runQuery(`
      INSERT INTO reviews (order_id, rating, comment, redirected_to_google)
      VALUES (?, ?, ?, ?)
    `, [order_id, rating, comment || '', redirected_to_google ? 1 : 0]);

    res.json({ message: 'Thank you for your feedback!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customer: Get order history by phone number (C11)
router.get('/customer-history', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: 'Phone number is required.' });

    const orders = await allQuery(`
      SELECT * FROM orders 
      WHERE customer_phone = ? 
      ORDER BY id DESC
    `, [phone]);

    const allItems = await allQuery(`SELECT * FROM order_items ORDER BY id ASC`);

    const result = orders.map(ord => ({
      ...ord,
      items: allItems.filter(it => it.order_id === ord.id)
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Customer Database with order history and repeat-visit tracking (A9)
router.get('/customers', verifyToken, requireRole(['admin', 'cashier']), async (req, res) => {
  try {
    const customers = await allQuery(`
      SELECT 
        customer_phone,
        COUNT(id) as total_orders,
        SUM(net_amount) as total_spent,
        MAX(created_at) as last_visit
      FROM orders
      WHERE customer_phone IS NOT NULL AND customer_phone != ''
      GROUP BY customer_phone
      ORDER BY last_visit DESC
    `);
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kitchen alias route — mirrors /orders/active for kitchen display
router.get('/kitchen', async (req, res) => {
  try {
    const { date } = req.query;
    let orders;
    if (date && date !== 'all') {
      const yrShort = date.slice(2, 4);
      const moShort = date.slice(5, 7);
      const dyShort = date.slice(8, 10);
      const orderPrefix = `%ORD-${yrShort}${moShort}${dyShort}%`;

      orders = await allQuery(`
        SELECT * FROM orders 
        WHERE status = 'active' OR SUBSTR(created_at, 1, 10) = ? OR created_at LIKE ? OR order_number LIKE ?
        ORDER BY id ASC
      `, [date, `${date}%`, orderPrefix]);
    } else {
      orders = await allQuery(`
        SELECT * FROM orders 
        WHERE status = 'active' OR status = 'pending'
        ORDER BY id ASC
      `);
    }
    const allItems = await allQuery(`SELECT * FROM order_items ORDER BY id ASC`);
    const result = orders.map(ord => ({
      ...ord,
      items: allItems.filter(it => it.order_id === ord.id)
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get ALL orders (optionally filtered by date) for dashboard day-by-day view
router.get('/all', verifyToken, requireRole(['admin', 'cashier']), async (req, res) => {
  try {
    const { date, status, payment_status } = req.query;
    let conditions = [];
    let params = [];

    if (date && date !== 'all') {
      const yrShort = date.slice(2, 4);
      const moShort = date.slice(5, 7);
      const dyShort = date.slice(8, 10);
      const orderPrefix = `%ORD-${yrShort}${moShort}${dyShort}%`;

      const matchClause = `(SUBSTR(created_at, 1, 10) = ? OR created_at LIKE ? OR order_number LIKE ? OR status IN ('active', 'pending', 'pending_verification'))`;
      conditions.push(matchClause);
      params.push(date, `${date}%`, orderPrefix);
    }
    if (status) {
      conditions.push(`status = ?`);
      params.push(status);
    }
    if (payment_status) {
      conditions.push(`payment_status = ?`);
      params.push(payment_status);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orders = await allQuery(`SELECT * FROM orders ${where} ORDER BY id DESC`, params);

    const allItems = await allQuery(`SELECT * FROM order_items ORDER BY id ASC`);

    const result = orders.map(ord => ({
      ...ord,
      items: allItems.filter(it => it.order_id === ord.id)
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin/Cashier: Verify payment and mark as completed (Cash, Card/Online, or Dual Split Payment)
router.patch('/:id/payment-verify', verifyToken, requireRole(['admin', 'cashier']), async (req, res) => {
  try {
    const { payment_status = 'completed', payment_mode, cash_paid, online_paid, utr_reference } = req.body;
    const order = await getQuery('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    let newPaymentMode = payment_mode || order.payment_mode;
    let cashVal = Number(cash_paid) || 0;
    let onlineVal = Number(online_paid) || 0;

    if (cashVal > 0 && onlineVal > 0) {
      newPaymentMode = 'cash_and_online';
    } else if (payment_mode === 'cash') {
      newPaymentMode = 'cash';
      cashVal = Number(order.net_amount || order.total_amount || 0);
    } else if (payment_mode === 'online' || payment_mode === 'card') {
      newPaymentMode = payment_mode;
      onlineVal = Number(order.net_amount || order.total_amount || 0);
    }

    await runQuery(
      'UPDATE orders SET payment_status = ?, payment_mode = ?, cash_paid = ?, online_paid = ?, utr_reference = ? WHERE id = ?',
      [payment_status, newPaymentMode, cashVal, onlineVal, utr_reference || order.utr_reference || null, req.params.id]
    );

    const updatedOrder = await getQuery('SELECT * FROM orders WHERE id = ?', [req.params.id]);

    const io = req.app.get('io');
    if (io) {
      io.emit('order_updated', updatedOrder);
      io.to('admin').emit('order_updated', updatedOrder);
      io.to('kitchen').emit('order_updated', updatedOrder);
    }

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customer/Staff: Change fulfillment type (dine_in ↔ packing) on an order item
router.patch('/items/:itemId/fulfillment', async (req, res) => {
  try {
    const { fulfillment_type } = req.body;
    if (!['dine_in', 'packing'].includes(fulfillment_type)) {
      return res.status(400).json({ error: 'fulfillment_type must be dine_in or packing.' });
    }
    const item = await getQuery('SELECT * FROM order_items WHERE id = ?', [req.params.itemId]);
    if (!item) return res.status(404).json({ error: 'Order item not found.' });

    await runQuery('UPDATE order_items SET fulfillment_type = ? WHERE id = ?', [fulfillment_type, req.params.itemId]);
    const updated = await getQuery('SELECT * FROM order_items WHERE id = ?', [req.params.itemId]);

    const io = req.app.get('io');
    if (io) {
      const parentOrder = await getQuery('SELECT * FROM orders WHERE id = ?', [item.order_id]);
      const allItems = await allQuery('SELECT * FROM order_items WHERE order_id = ?', [item.order_id]);
      const payload = { ...parentOrder, items: allItems };
      io.to('kitchen').emit('order_updated', payload);
      io.to('admin').emit('order_updated', payload);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customer: Save UTR reference after UPI payment
router.patch('/:id/utr', async (req, res) => {
  try {
    const { utr_reference } = req.body;
    if (!utr_reference || !utr_reference.trim()) {
      return res.status(400).json({ error: 'UTR reference is required.' });
    }
    const order = await getQuery('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    await runQuery(
      'UPDATE orders SET utr_reference = ?, payment_status = ? WHERE id = ?',
      [utr_reference.trim(), 'pending_verification', req.params.id]
    );
    res.json({ message: 'UTR reference saved. Payment pending admin verification.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customer: Submit order review (overall + item-level feedback)
router.post('/review', async (req, res) => {
  try {
    const { order_id, rating, comment, redirected_to_google, item_reviews } = req.body;
    if (!order_id || !rating) {
      return res.status(400).json({ error: 'order_id and rating are required.' });
    }

    const reviewRes = await runQuery(
      `INSERT INTO reviews (order_id, rating, comment, redirected_to_google) VALUES (?, ?, ?, ?)`,
      [order_id, rating, comment || '', redirected_to_google ? 1 : 0]
    );

    if (Array.isArray(item_reviews) && item_reviews.length > 0) {
      for (const ir of item_reviews) {
        if (ir.item_name && ir.rating) {
          try {
            await runQuery(
              `INSERT INTO item_reviews (order_id, item_name, rating, comment) VALUES (?, ?, ?, ?)`,
              [order_id, ir.item_name, ir.rating, ir.comment || '']
            );
          } catch (e) {}
        }
      }
    }

    const settings = await getQuery('SELECT google_maps_review_url FROM restaurant_settings LIMIT 1');

    res.json({
      message: 'Review submitted successfully!',
      review_id: reviewRes.lastID,
      google_maps_review_url: settings?.google_maps_review_url || 'https://maps.google.com/?q=Aamantran+Bistro'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin/Cashier: Process refund on an order (Supports Full, Partial, Cash, Online & Split Refunds)
router.patch('/:id/refund', verifyToken, requireRole(['admin', 'cashier']), async (req, res) => {
  try {
    const { refund_reason, refund_amount, refund_cash_amount, refund_online_amount, refund_mode = 'cash' } = req.body;
    const order = await getQuery('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const totalAmt = Number(order.net_amount || order.total_amount) || 0;
    let rCash = Number(refund_cash_amount) || 0;
    let rOnline = Number(refund_online_amount) || 0;
    let actualRefund = 0;

    if (refund_mode === 'split' || (rCash > 0 && rOnline > 0)) {
      actualRefund = rCash + rOnline;
    } else {
      actualRefund = refund_amount !== undefined && refund_amount !== null && !isNaN(Number(refund_amount))
        ? Number(refund_amount)
        : totalAmt;
      if (refund_mode === 'cash') rCash = actualRefund;
      if (refund_mode === 'online' || refund_mode === 'card') rOnline = actualRefund;
    }

    if (actualRefund < 0) actualRefund = 0;
    if (actualRefund > totalAmt) actualRefund = totalAmt;

    const isFull = actualRefund >= (totalAmt - 0.01);
    const newPaymentStatus = 'refunded';
    const newOrderStatus = isFull ? 'refunded' : (order.status || 'active');

    await runQuery(
      `UPDATE orders SET payment_status = ?, status = ?, refund_reason = ?, refunded_amount = ?, refund_cash_amount = ?, refund_online_amount = ?, refund_mode = ? WHERE id = ?`,
      [newPaymentStatus, newOrderStatus, refund_reason || 'Customer Requested Refund', actualRefund, rCash, rOnline, refund_mode, req.params.id]
    );

    const updatedOrder = await getQuery('SELECT * FROM orders WHERE id = ?', [req.params.id]);

    const io = req.app.get('io');
    if (io) {
      io.emit('order_updated', updatedOrder);
      io.to('admin').emit('order_updated', updatedOrder);
      io.to('kitchen').emit('order_updated', updatedOrder);
    }

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

