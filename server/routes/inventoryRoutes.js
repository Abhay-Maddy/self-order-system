import express from 'express';
import { runQuery, allQuery } from '../db.js';
import { verifyToken, requireRole } from '../auth.js';

const router = express.Router();

// Admin / Kitchen: Get stock status & low-stock items
router.get('/', verifyToken, requireRole(['admin', 'chef', 'cashier']), async (req, res) => {
  try {
    const items = await allQuery(`
      SELECT id, name, price, stock_quantity, low_stock_threshold, is_active
      FROM menu_items
      ORDER BY stock_quantity ASC
    `);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin / Kitchen: Update stock quantity & threshold
router.patch('/:id', verifyToken, requireRole(['admin', 'chef']), async (req, res) => {
  try {
    const { stock_quantity, low_stock_threshold, is_active } = req.body;

    await runQuery(`
      UPDATE menu_items SET stock_quantity = ?, low_stock_threshold = ?, is_active = ?
      WHERE id = ?
    `, [stock_quantity, low_stock_threshold, is_active ? 1 : 0, req.params.id]);

    res.json({ message: 'Stock updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
