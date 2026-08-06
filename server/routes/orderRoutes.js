import express from 'express';
import { runQuery, getQuery, allQuery } from '../db.js';
import { verifyToken, requireRole } from '../auth.js';

const router = express.Router();

// Helper: Generate unique order number
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
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
      const dbItem = await getQuery('SELECT * FROM menu_items WHERE id = ?', [cartItem.item_id]);
      if (!dbItem) {
        return res.status(400).json({ error: `Item ID ${cartItem.item_id} not found.` });
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
        fulfillment_type: cartItem.fulfillment_type || 'dine_in', // 'dine_in' or 'packing'
        current_stock: dbItem.stock_quantity,
        low_threshold: dbItem.low_stock_threshold
      });
    }

    // 3. Coupon validation
    let discountAmount = 0;
    if (coupon_code) {
      const coupon = await getQuery('SELECT * FROM coupons WHERE code = ? AND is_active = 1', [coupon_code.toUpperCase()]);
      if (coupon) {
        if (subtotal >= coupon.min_order_amount) {
          if (coupon.discount_type === 'percentage') {
            discountAmount = (subtotal * coupon.discount_value) / 100;
            if (coupon.max_discount > 0 && discountAmount > coupon.max_discount) {
              discountAmount = coupon.max_discount;
            }
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

    // 4. Create Order
    const { scheduled_time, order_source = 'customer', placed_by_name = '', placed_by_role = '' } = req.body;
    const orderNumber = generateOrderNumber();
    const defaultPrepMins = 15;
    const initialEstimatedReadyAt = new Date(Date.now() + defaultPrepMins * 60 * 1000).toISOString();

    const orderRes = await runQuery(`
      INSERT INTO orders
      (order_number, table_number, customer_phone, payment_mode, payment_status, total_amount, tax_amount, discount_amount, net_amount, status, order_source, placed_by_name, placed_by_role, scheduled_time, prep_time_minutes, estimated_ready_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?)
    `, [orderNumber, table_number, customer_phone || null, payment_mode || 'cash', payment_mode === 'online' ? 'completed' : 'pending', subtotal, taxAmount, discountAmount, finalTotal, order_source, placed_by_name || '', placed_by_role || '', scheduled_time || 'ASAP (~15 mins)', defaultPrepMins, initialEstimatedReadyAt]);

    const orderId = orderRes.lastID;

    // 5. Insert order items & update stock
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

    const completeOrder = {
      id: orderId,
      order_number: orderNumber,
      table_number,
      customer_phone,
      payment_mode,
      payment_status: payment_mode === 'online' ? 'completed' : 'pending',
      total_amount: subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      net_amount: finalTotal,
      status: 'active',
      order_source,
      created_at: new Date().toISOString(),
      items: createdItems
    };

    // Emit Socket.io event to kitchen & admin
    const io = req.app.get('io');
    if (io) {
      io.to('kitchen').emit('new_order', completeOrder);
      io.to('admin').emit('new_order', completeOrder);
      if (stockAlerts.length > 0) {
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
    if (!['accepted', 'preparing', 'ready', 'served', 'rejected'].includes(status)) {
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

// Admin / Cashier: Update full order status or payment status (e.g. Settle / Complete / Cancel / Refund)
router.patch('/:id/status', verifyToken, requireRole(['admin', 'cashier']), async (req, res) => {
  try {
    let { status, payment_status, refund_reason } = req.body;
    const order = await getQuery('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    // Normalize payment_status values ('paid' -> 'completed')
    if (payment_status === 'paid') payment_status = 'completed';

    const newStatus = status || order.status;
    const newPaymentStatus = payment_status || order.payment_status;

    await runQuery(
      'UPDATE orders SET status = ?, payment_status = ?, refund_reason = ? WHERE id = ?',
      [newStatus, newPaymentStatus, refund_reason || order.refund_reason || null, req.params.id]
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
    if (date) {
      // Query specific past date orders
      orders = await allQuery(`SELECT * FROM orders WHERE DATE(created_at) = ? OR DATE(created_at, 'localtime') = ? ORDER BY id ASC`, [date, date]);
    } else {
      // Default to current active orders (plus today's active/completed orders)
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      orders = await allQuery(`
        SELECT * FROM orders 
        WHERE status = 'active' OR DATE(created_at) = ? OR DATE(created_at, 'localtime') = ?
        ORDER BY id ASC
      `, [todayStr, todayStr]);
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

    if (date) {
      conditions.push(`DATE(created_at) = ?`);
      params.push(date);
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

// Admin/Cashier: Verify cash payment and mark as completed
router.patch('/:id/payment-verify', verifyToken, requireRole(['admin', 'cashier']), async (req, res) => {
  try {
    const { payment_status = 'completed', utr_reference } = req.body;
    const order = await getQuery('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    await runQuery(
      'UPDATE orders SET payment_status = ?, utr_reference = ? WHERE id = ?',
      [payment_status, utr_reference || order.utr_reference || null, req.params.id]
    );

    const updatedOrder = await getQuery('SELECT * FROM orders WHERE id = ?', [req.params.id]);

    // Emit to admin/cashier rooms
    const io = req.app.get('io');
    if (io) {
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

// Admin/Cashier: Process refund on an order (A10)
router.patch('/:id/refund', verifyToken, requireRole(['admin', 'cashier']), async (req, res) => {
  try {
    const { refund_reason } = req.body;
    const order = await getQuery('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    await runQuery(
      "UPDATE orders SET payment_status = 'refunded', status = 'refunded', refund_reason = ? WHERE id = ?",
      [refund_reason || 'N/A', req.params.id]
    );

    const updatedOrder = await getQuery('SELECT * FROM orders WHERE id = ?', [req.params.id]);

    const io = req.app.get('io');
    if (io) {
      io.to('admin').emit('order_updated', updatedOrder);
      io.to('kitchen').emit('order_updated', updatedOrder);
    }

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

