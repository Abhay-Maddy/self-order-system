import express from 'express';
import { runQuery, getQuery } from '../db.js';
import { verifyToken, requireRole } from '../auth.js';

const router = express.Router();

// Public: Get restaurant settings
router.get('/', async (req, res) => {
  try {
    const settings = await getQuery('SELECT * FROM restaurant_settings LIMIT 1');
    res.json(settings || {
      name: 'Amantradha Bistro',
      address: '123 Spice Avenue, Culinary District, Mumbai - 400001',
      phone: '+91 98765 43210',
      gstin: '27AAAAA0000A1Z5',
      tax_rate: 5.0,
      currency: '₹',
      default_lang: 'en',
      google_maps_review_url: 'https://maps.google.com/?q=Amantradha+Bistro'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update restaurant settings
router.put('/', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, address, phone, gstin, tax_rate, currency, default_lang, google_maps_review_url } = req.body;
    await runQuery(`
      UPDATE restaurant_settings SET
      name = ?, address = ?, phone = ?, gstin = ?, tax_rate = ?, currency = ?, default_lang = ?, google_maps_review_url = ?
      WHERE id = (SELECT id FROM restaurant_settings LIMIT 1)
    `, [name, address, phone, gstin, tax_rate, currency, default_lang, google_maps_review_url]);

    res.json({ message: 'Restaurant settings updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
