import express from 'express';
import { runQuery, getQuery, allQuery } from '../db.js';
import { verifyToken, requireRole } from '../auth.js';

const router = express.Router();

// Public: Get full menu structure with categories, subcategories, items, variants
router.get('/', async (req, res) => {
  try {
    const categories = await allQuery('SELECT * FROM categories ORDER BY sort_order ASC, id ASC');
    const subcategories = await allQuery('SELECT * FROM subcategories ORDER BY sort_order ASC, id ASC');
    const items = await allQuery('SELECT * FROM menu_items ORDER BY id ASC');
    const variants = await allQuery('SELECT * FROM item_variants');

    // Attach variants to items
    const itemsWithVariants = items.map(item => ({
      ...item,
      variants: variants.filter(v => v.item_id === item.id)
    }));

    // Attach items to subcategories
    const subcatsWithItems = subcategories.map(sub => ({
      ...sub,
      items: itemsWithVariants.filter(item => item.subcategory_id === sub.id)
    }));

    // Attach subcategories to categories
    const menuTree = categories.map(cat => ({
      ...cat,
      subcategories: subcatsWithItems.filter(sub => sub.category_id === cat.id)
    }));

    res.json({ categories: menuTree, allItems: itemsWithVariants });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: CRUD Categories
router.post('/categories', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, description, sort_order } = req.body;
    const result = await runQuery(
      'INSERT INTO categories (name, description, sort_order) VALUES (?, ?, ?)',
      [name, description || '', sort_order || 0]
    );
    res.json({ id: result.lastID, name, description, sort_order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/categories/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, description, sort_order } = req.body;
    await runQuery(
      'UPDATE categories SET name = ?, description = ?, sort_order = ? WHERE id = ?',
      [name, description, sort_order, req.params.id]
    );
    res.json({ message: 'Category updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/categories/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    await runQuery('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: CRUD Subcategories
router.post('/subcategories', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { category_id, name, sort_order } = req.body;
    const result = await runQuery(
      'INSERT INTO subcategories (category_id, name, sort_order) VALUES (?, ?, ?)',
      [category_id, name, sort_order || 0]
    );
    res.json({ id: result.lastID, category_id, name, sort_order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/subcategories/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, sort_order, category_id } = req.body;
    await runQuery(
      'UPDATE subcategories SET name = ?, sort_order = ?, category_id = ? WHERE id = ?',
      [name, sort_order || 0, category_id, req.params.id]
    );
    res.json({ message: 'Subcategory updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/subcategories/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    await runQuery('DELETE FROM subcategories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Subcategory deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: CRUD Menu Items
router.post('/items', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const {
      subcategory_id, name, subtitle, tags, description, price, is_veg, is_vegan,
      is_gluten_free, spice_level, image_url, stock_quantity, low_stock_threshold, variants
    } = req.body;

    const result = await runQuery(`
      INSERT INTO menu_items
      (subcategory_id, name, subtitle, tags, description, price, is_veg, is_vegan, is_gluten_free, spice_level, image_url, stock_quantity, low_stock_threshold)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [subcategory_id, name, subtitle || '', tags || '', description, price, is_veg ? 1 : 0, is_vegan ? 1 : 0, is_gluten_free ? 1 : 0, spice_level || 'medium', image_url, stock_quantity || 50, low_stock_threshold || 5]);

    const itemId = result.lastID;
    if (variants && Array.isArray(variants)) {
      for (const v of variants) {
        await runQuery('INSERT INTO item_variants (item_id, name, price_modifier) VALUES (?, ?, ?)', [itemId, v.name, v.price_modifier || 0]);
      }
    }

    res.json({ id: itemId, message: 'Item created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/items/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const {
      subcategory_id, name, subtitle, tags, description, price, is_veg, is_vegan,
      is_gluten_free, spice_level, image_url, stock_quantity, low_stock_threshold, is_active, variants
    } = req.body;

    await runQuery(`
      UPDATE menu_items SET
      subcategory_id = ?, name = ?, subtitle = ?, tags = ?, description = ?, price = ?, is_veg = ?, is_vegan = ?,
      is_gluten_free = ?, spice_level = ?, image_url = ?, stock_quantity = ?, low_stock_threshold = ?, is_active = ?
      WHERE id = ?
    `, [subcategory_id, name, subtitle || '', tags || '', description, price, is_veg ? 1 : 0, is_vegan ? 1 : 0, is_gluten_free ? 1 : 0, spice_level, image_url, stock_quantity, low_stock_threshold, is_active ? 1 : 0, req.params.id]);

    if (variants && Array.isArray(variants)) {
      await runQuery('DELETE FROM item_variants WHERE item_id = ?', [req.params.id]);
      for (const v of variants) {
        await runQuery('INSERT INTO item_variants (item_id, name, price_modifier) VALUES (?, ?, ?)', [req.params.id, v.name, v.price_modifier || 0]);
      }
    }

    res.json({ message: 'Item updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/items/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    await runQuery('DELETE FROM menu_items WHERE id = ?', [req.params.id]);
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
