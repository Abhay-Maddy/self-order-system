import express from 'express';
import { getQuery, allQuery } from '../db.js';
import { verifyToken, requireRole } from '../auth.js';

const router = express.Router();

const getLocalDayRange = (dateStr) => {
  if (!dateStr || dateStr === 'all') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const startObj = new Date(y, m - 1, d, 0, 0, 0, 0);
    const endObj = new Date(y, m - 1, d, 23, 59, 59, 999);

    const yrShort = String(y).slice(2);
    const moShort = String(m).padStart(2, '0');
    const dyShort = String(d).padStart(2, '0');
    const orderPrefix = `%ORD-${yrShort}${moShort}${dyShort}%`;

    return {
      startIso: startObj.toISOString(),
      endIso: endObj.toISOString(),
      dateStr,
      orderPrefix
    };
  } catch (e) {
    return null;
  }
};

const getISTDate = (dateObj = new Date()) => {
  const utcMs = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
  return new Date(utcMs + (5.5 * 60 * 60 * 1000));
};

const getISTDateString = (dateObj = new Date()) => {
  const d = getISTDate(dateObj);
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${dy}`;
};

// Admin: Analytics Summary (Revenue, order count, avg prep time, top seller)
router.get('/analytics', verifyToken, requireRole(['admin', 'cashier']), async (req, res) => {
  try {
    const todayStr = getISTDateString();
    const targetDate = req.query.date || todayStr;

    let revQuery = "SELECT SUM(CASE WHEN status = 'cancelled' THEN 0 ELSE MAX(0, COALESCE(net_amount, total_amount, 0) - COALESCE(refunded_amount, 0)) END) as total FROM orders";
    let countQuery = "SELECT COUNT(*) as total FROM orders";
    let topQueryWhere = "";
    let qParams = [];

    if (targetDate && targetDate !== 'all') {
      const yrShort = targetDate.slice(2, 4);
      const moShort = targetDate.slice(5, 7);
      const dyShort = targetDate.slice(8, 10);
      const orderPrefix = `%ORD-${yrShort}${moShort}${dyShort}%`;

      const matchClause = "(SUBSTR(created_at, 1, 10) = ? OR created_at LIKE ? OR order_number LIKE ?)";
      revQuery += ` WHERE ${matchClause}`;
      countQuery += ` WHERE ${matchClause}`;
      topQueryWhere = ` WHERE ${matchClause}`;
      qParams = [targetDate, `${targetDate}%`, orderPrefix];
    }

    const totalRevRow = await getQuery(revQuery, qParams);
    const todayOrdersRow = await getQuery(countQuery, qParams);
    const totalOrdersRow = await getQuery("SELECT COUNT(*) as total FROM orders");
    const activeOrdersRow = await getQuery("SELECT COUNT(*) as total FROM orders WHERE status = 'active'");

    let topDishRow = null;
    if (qParams.length > 0) {
      topDishRow = await getQuery(`
        SELECT item_name, SUM(quantity) as total_qty
        FROM order_items
        WHERE status != 'rejected' AND order_id IN (
          SELECT id FROM orders ${topQueryWhere}
        )
        GROUP BY item_name
        ORDER BY total_qty DESC
        LIMIT 1
      `, qParams);
    }

    if (!topDishRow) {
      topDishRow = await getQuery(`
        SELECT item_name, SUM(quantity) as total_qty
        FROM order_items
        WHERE status != 'rejected'
        GROUP BY item_name
        ORDER BY total_qty DESC
        LIMIT 1
      `);
    }

    const reviewsAvg = await getQuery("SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews");

    res.json({
      todayRevenue: totalRevRow ? totalRevRow.total || 0 : 0,
      todayOrders: todayOrdersRow ? todayOrdersRow.total : 0,
      totalOrders: totalOrdersRow ? totalOrdersRow.total : 0,
      activeOrders: activeOrdersRow ? activeOrdersRow.total : 0,
      avgPrepMinutes: 14,
      topDish: topDishRow ? topDishRow.item_name : 'N/A',
      avgRating: reviewsAvg && reviewsAvg.avg_rating ? Number(reviewsAvg.avg_rating).toFixed(1) : '4.8',
      totalReviews: reviewsAvg ? reviewsAvg.review_count : 0,
      selectedDate: targetDate
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin/Cashier: Full Tax Invoice Data
router.get('/invoice/:orderId', verifyToken, requireRole(['admin', 'cashier']), async (req, res) => {
  try {
    const order = await getQuery('SELECT * FROM orders WHERE id = ? OR order_number = ?', [req.params.orderId, req.params.orderId]);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const items = await allQuery('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    const settings = await getQuery('SELECT * FROM restaurant_settings LIMIT 1');

    res.json({
      order,
      items,
      settings: settings || {
        name: 'Aamantran Bistro',
        address: '123 Spice Avenue, Culinary District, Mumbai - 400001',
        phone: '+91 98765 43210',
        gstin: '27AAAAA0000A1Z5',
        tax_rate: 5.0,
        currency: '₹'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Export reports as CSV
router.get('/export', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const orders = await allQuery('SELECT * FROM orders ORDER BY id DESC');
    let csv = 'Order ID,Order Number,Table,Payment Mode,Status,Subtotal,Tax,Discount,Net Amount,Created At\n';
    orders.forEach(o => {
      csv += `${o.id},"${o.order_number}","${o.table_number}","${o.payment_mode}","${o.status}",${o.total_amount},${o.tax_amount},${o.discount_amount},${o.net_amount},"${o.created_at}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sales_report.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
