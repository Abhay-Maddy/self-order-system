import express from 'express';
import { runQuery, getQuery } from '../db.js';
import { verifyToken, requireRole } from '../auth.js';

const router = express.Router();

// Public: Get restaurant settings
router.get('/', async (req, res) => {
  try {
    const settings = await getQuery('SELECT * FROM restaurant_settings LIMIT 1');
    const defaultSettings = {
      name: process.env.PAYMENT_MERCHANT_NAME || 'Aamantran Bistro',
      address: settings.address || '',
      phone: settings.phone || '',
      gstin: settings.gstin || '',
      tax_rate: settings.tax_rate || 5,
      currency: settings.currency || '₹',
      payment_upi_id: process.env.PAYMENT_UPI_ID || 'aamantran@upi',
      payment_merchant_name: process.env.PAYMENT_MERCHANT_NAME || 'Aamantran Restaurant',
      google_maps_review_url: 'https://maps.google.com/?q=Aamantran+Bistro'
    };
    res.json({ ...defaultSettings, ...(settings || {}) });
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

    const updated = await getQuery('SELECT * FROM restaurant_settings LIMIT 1');
    const io = req.app.get('io');
    if (io) {
      io.emit('settings_updated', updated);
    }

    res.json({ message: 'Restaurant settings updated successfully', settings: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
