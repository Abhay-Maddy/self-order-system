import express from 'express';
import { runQuery, getQuery, allQuery } from '../db.js';
import { verifyToken, requireRole } from '../auth.js';

const router = express.Router();

// Customer: Validate coupon code
router.post('/validate', async (req, res) => {
  try {
    const { code, cart_amount } = req.body;
    if (!code) return res.status(400).json({ error: 'Coupon code required.' });

    const coupon = await getQuery('SELECT * FROM coupons WHERE code = ? AND is_active = 1', [code.toUpperCase()]);
    if (!coupon) {
      return res.status(404).json({ error: 'Invalid or expired coupon code.' });
    }

    if (cart_amount < coupon.min_order_amount) {
      return res.status(400).json({ error: `Minimum order amount of ₹${coupon.min_order_amount} required for this coupon.` });
    }

    if (coupon.times_used >= coupon.usage_limit) {
      return res.status(400).json({ error: 'Coupon usage limit has been reached.' });
    }

    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (cart_amount * coupon.discount_value) / 100;
      if (coupon.max_discount > 0 && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    } else {
      discount = coupon.discount_value;
    }

    res.json({
      valid: true,
      code: coupon.code,
      discount_amount: discount,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: CRUD Coupons
router.get('/', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const coupons = await allQuery('SELECT * FROM coupons ORDER BY id DESC');
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { code, discount_type, discount_value, min_order_amount, max_discount, usage_limit } = req.body;
    await runQuery(`
      INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount, usage_limit)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [code.toUpperCase(), discount_type, discount_value, min_order_amount || 0, max_discount || 0, usage_limit || 100]);

    res.json({ message: 'Coupon created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    await runQuery('DELETE FROM coupons WHERE id = ?', [req.params.id]);
    res.json({ message: 'Coupon deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
