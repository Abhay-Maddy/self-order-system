import express from 'express';
import { runQuery, getQuery, allQuery } from '../db.js';
import { verifyToken, requireRole } from '../auth.js';

const router = express.Router();

// Get list of tables
router.get('/', async (req, res) => {
  try {
    const tables = await allQuery('SELECT * FROM tables ORDER BY table_number ASC');
    res.json(tables);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Add new table
router.post('/', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { table_number, capacity, location_zone } = req.body;
    if (!table_number) return res.status(400).json({ error: 'Table number is required.' });

    const existing = await getQuery('SELECT id FROM tables WHERE table_number = ?', [table_number]);
    if (existing) return res.status(400).json({ error: 'Table number already exists.' });

    const resDb = await runQuery('INSERT INTO tables (table_number, capacity, location_zone) VALUES (?, ?, ?)', [
      table_number, capacity || 4, location_zone || 'Main Dining'
    ]);

    res.json({ id: resDb.lastID, table_number, capacity, location_zone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete table
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    await runQuery('DELETE FROM tables WHERE id = ?', [req.params.id]);
    res.json({ message: 'Table removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
