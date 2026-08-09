import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'restaurant.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Helper to run query with Promises
export const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

export const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const allQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Initialize schema and seed data
export const initDb = async () => {
  // Create Tables
  await runQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'cashier', 'chef', 'waiter')) NOT NULL,
      is_main_admin INTEGER DEFAULT 0,
      status TEXT CHECK(status IN ('pending', 'approved', 'rejected', 'deactivated')) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    await runQuery(`ALTER TABLE users ADD COLUMN email TEXT`);
  } catch (e) {}
  try {
    await runQuery(`ALTER TABLE users ADD COLUMN personal_email TEXT`);
  } catch (e) {}
  try {
    await runQuery(`ALTER TABLE users ADD COLUMN phone TEXT`);
  } catch (e) {}
  try {
    await runQuery(`ALTER TABLE users ADD COLUMN is_main_admin INTEGER DEFAULT 0`);
  } catch (e) {}

  // Migration: fix role CHECK constraint to include 'waiter' (SQLite requires table rebuild)
  // Check if the current constraint already allows 'waiter' by inspecting the table SQL
  try {
    const tableInfo = await getQuery(`SELECT sql FROM sqlite_master WHERE type='table' AND name='users'`);
    const tableSql = (tableInfo && tableInfo.sql) || '';
    const needsMigration = tableSql.includes("role IN ('admin', 'cashier', 'chef')") && !tableSql.includes("'waiter'");

    if (needsMigration) {
      console.log('🔧 Migrating users table to fix role CHECK constraint (adding waiter)...');
      // SQLite table rebuild to change CHECK constraint
      await runQuery(`PRAGMA foreign_keys = OFF`);
      await runQuery(`
        CREATE TABLE IF NOT EXISTS users_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT,
          personal_email TEXT,
          phone TEXT,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          role TEXT CHECK(role IN ('admin', 'cashier', 'chef', 'waiter')) NOT NULL,
          is_main_admin INTEGER DEFAULT 0,
          status TEXT CHECK(status IN ('pending', 'approved', 'rejected', 'deactivated')) DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await runQuery(`
        INSERT INTO users_new (id, username, email, personal_email, phone, password_hash, name, role, is_main_admin, status, created_at)
        SELECT id, username, email, personal_email, phone, password_hash, name,
          CASE WHEN role NOT IN ('admin', 'cashier', 'chef', 'waiter') THEN 'chef' ELSE role END,
          is_main_admin, status, created_at
        FROM users
      `);
      await runQuery(`DROP TABLE users`);
      await runQuery(`ALTER TABLE users_new RENAME TO users`);
      await runQuery(`PRAGMA foreign_keys = ON`);
      console.log('✅ Users table migration complete — waiter role now allowed.');
    }
  } catch (migrationErr) {
    console.error('⚠️ Role constraint migration error (non-fatal):', migrationErr.message);
  }
  await runQuery(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER DEFAULT 0
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS subcategories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subcategory_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      subtitle TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      description TEXT,
      price REAL NOT NULL,
      is_veg INTEGER DEFAULT 1,
      is_vegan INTEGER DEFAULT 0,
      is_gluten_free INTEGER DEFAULT 0,
      spice_level TEXT DEFAULT 'medium',
      image_url TEXT,
      stock_quantity INTEGER DEFAULT 50,
      low_stock_threshold INTEGER DEFAULT 5,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE
    )
  `);

  try {
    await runQuery(`ALTER TABLE menu_items ADD COLUMN subtitle TEXT DEFAULT ''`);
  } catch (e) {}
  try {
    await runQuery(`ALTER TABLE menu_items ADD COLUMN tags TEXT DEFAULT ''`);
  } catch (e) {}
  try {
    await runQuery(`ALTER TABLE menu_items ADD COLUMN sort_order INTEGER DEFAULT 0`);
  } catch (e) {}
  try {
    await runQuery(`ALTER TABLE menu_items ADD COLUMN has_customization INTEGER DEFAULT 0`);
  } catch (e) {}

  await runQuery(`
    CREATE TABLE IF NOT EXISTS item_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price_modifier REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (item_id) REFERENCES menu_items(id) ON DELETE CASCADE
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_number TEXT UNIQUE NOT NULL,
      capacity INTEGER DEFAULT 4,
      location_zone TEXT DEFAULT 'Main Hall',
      is_active INTEGER DEFAULT 1
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT CHECK(discount_type IN ('percentage', 'fixed')) NOT NULL,
      discount_value REAL NOT NULL,
      min_order_amount REAL DEFAULT 0,
      max_discount REAL DEFAULT 0,
      usage_limit INTEGER DEFAULT 100,
      times_used INTEGER DEFAULT 0,
      expires_at TEXT,
      is_active INTEGER DEFAULT 1
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      table_number TEXT NOT NULL,
      customer_phone TEXT,
      payment_mode TEXT CHECK(payment_mode IN ('online', 'cash')) NOT NULL,
      payment_status TEXT CHECK(payment_status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
      total_amount REAL NOT NULL,
      tax_amount REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      net_amount REAL NOT NULL,
      status TEXT DEFAULT 'active',
      order_source TEXT CHECK(order_source IN ('customer', 'waiter')) DEFAULT 'customer',
      scheduled_time TEXT DEFAULT 'ASAP (~15 mins)',
      refund_reason TEXT,
      utr_reference TEXT,
      prep_time_minutes INTEGER DEFAULT 15,
      estimated_ready_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try {
    await runQuery(`ALTER TABLE orders ADD COLUMN order_source TEXT CHECK(order_source IN ('customer', 'waiter')) DEFAULT 'customer'`);
  } catch (e) {}

  try {
    await runQuery(`ALTER TABLE orders ADD COLUMN scheduled_time TEXT DEFAULT 'ASAP (~15 mins)'`);
  } catch (e) {}
  try {
    await runQuery(`ALTER TABLE orders ADD COLUMN placed_by_name TEXT DEFAULT ''`);
  } catch (e) {}
  try {
    await runQuery(`ALTER TABLE orders ADD COLUMN placed_by_role TEXT DEFAULT ''`);
  } catch (e) {}
  try {
    await runQuery(`ALTER TABLE orders ADD COLUMN prep_time_minutes INTEGER DEFAULT 15`);
  } catch (e) {}
  try {
    await runQuery(`ALTER TABLE orders ADD COLUMN estimated_ready_at DATETIME`);
  } catch (e) {}
  try {
    await runQuery(`ALTER TABLE orders ADD COLUMN utr_reference TEXT`);
  } catch (e) {}
  try {
    await runQuery(`ALTER TABLE orders ADD COLUMN refunded_amount REAL DEFAULT 0`);
  } catch (e) {}
  try {
    await runQuery(`ALTER TABLE orders ADD COLUMN cash_paid REAL DEFAULT 0`);
  } catch (e) {}
  try {
    await runQuery(`ALTER TABLE orders ADD COLUMN online_paid REAL DEFAULT 0`);
  } catch (e) {}
  try {
    await runQuery(`ALTER TABLE orders ADD COLUMN refund_cash_amount REAL DEFAULT 0`);
  } catch (e) {}
  try {
    await runQuery(`ALTER TABLE orders ADD COLUMN refund_online_amount REAL DEFAULT 0`);
  } catch (e) {}
  try {
    await runQuery(`ALTER TABLE orders ADD COLUMN refund_mode TEXT DEFAULT 'cash'`);
  } catch (e) {}


  await runQuery(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      variant_name TEXT,
      toppings_summary TEXT,
      spice_level TEXT,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      fulfillment_type TEXT CHECK(fulfillment_type IN ('dine_in', 'packing')) NOT NULL DEFAULT 'dine_in',
      status TEXT CHECK(status IN ('pending', 'accepted', 'preparing', 'ready', 'served', 'rejected')) DEFAULT 'pending',
      rejection_reason TEXT,
      prep_time_minutes INTEGER DEFAULT 15,
      estimated_ready_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )
  `);

  try {
    await runQuery(`ALTER TABLE order_items ADD COLUMN prep_time_minutes INTEGER DEFAULT 15`);
  } catch (e) {}
  try {
    await runQuery(`ALTER TABLE order_items ADD COLUMN estimated_ready_at DATETIME`);
  } catch (e) {}

  await runQuery(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      rating INTEGER CHECK(rating BETWEEN 1 AND 5),
      comment TEXT,
      redirected_to_google INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS restaurant_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT DEFAULT 'Aamantran Bistro',
      address TEXT DEFAULT '123 Spice Avenue, Culinary District, Mumbai - 400001',
      phone TEXT DEFAULT '+91 98765 43210',
      gstin TEXT DEFAULT '27AAAAA0000A1Z5',
      tax_rate REAL DEFAULT 5.0,
      currency TEXT DEFAULT '₹',
      default_lang TEXT DEFAULT 'en',
      google_maps_review_url TEXT DEFAULT 'https://maps.google.com/?q=Aamantran+Bistro'
    )
  `);

  // Seed default data if empty
  const userCount = await getQuery('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    console.log('Seeding initial data...');
    const adminPass = await bcrypt.hash('admin123', 10);
    const chefPass = await bcrypt.hash('chef123', 10);
    const cashierPass = await bcrypt.hash('cashier123', 10);

    // Users
    await runQuery(`INSERT INTO users (username, email, password_hash, name, role, is_main_admin, status) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
      'admin', 'admin@aamantran.com', adminPass, 'Main Admin Owner', 'admin', 1, 'approved'
    ]);
    await runQuery(`INSERT INTO users (username, email, password_hash, name, role, is_main_admin, status) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
      'chef1', 'chef1@aamantran.com', chefPass, 'Head Chef Mario', 'chef', 0, 'approved'
    ]);
    await runQuery(`INSERT INTO users (username, email, password_hash, name, role, is_main_admin, status) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
      'chef2', 'chef2@aamantran.com', chefPass, 'Junior Chef Alex', 'chef', 0, 'pending'
    ]);
    await runQuery(`INSERT INTO users (username, email, password_hash, name, role, is_main_admin, status) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
      'cashier1', 'cashier1@aamantran.com', cashierPass, 'Front Cashier Sarah', 'cashier', 0, 'approved'
    ]);

    // Restaurant Settings
    await runQuery(`INSERT INTO restaurant_settings (name) VALUES ('Aamantran Bistro')`);

    // Tables
    const tables = [
      { num: 'T-01', cap: 2, zone: 'Window Section' },
      { num: 'T-02', cap: 4, zone: 'Main Dining' },
      { num: 'T-03', cap: 4, zone: 'Main Dining' },
      { num: 'T-04', cap: 6, zone: 'Family Booth' },
      { num: 'T-05', cap: 2, zone: 'Patio Outdoor' }
    ];
    for (const t of tables) {
      await runQuery(`INSERT INTO tables (table_number, capacity, location_zone) VALUES (?, ?, ?)`, [t.num, t.cap, t.zone]);
    }

    // Coupons
    await runQuery(`INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount, usage_limit) VALUES (?, ?, ?, ?, ?, ?)`, [
      'WELCOME10', 'percentage', 10, 200, 100, 50
    ]);
    await runQuery(`INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount, usage_limit) VALUES (?, ?, ?, ?, ?, ?)`, [
      'FLAT50', 'fixed', 50, 400, 50, 30
    ]);

    // Categories & Subcategories
    const cat1 = await runQuery(`INSERT INTO categories (name, description, sort_order) VALUES (?, ?, ?)`, ['Starters & Appetizers', 'Delicious small bites to kickstart your meal', 1]);
    const cat2 = await runQuery(`INSERT INTO categories (name, description, sort_order) VALUES (?, ?, ?)`, ['Main Course', 'Hearty chef-special curries, bowls & breads', 2]);
    const cat3 = await runQuery(`INSERT INTO categories (name, description, sort_order) VALUES (?, ?, ?)`, ['Beverages', 'Refreshing mocks, shakes & cold brews', 3]);
    const cat4 = await runQuery(`INSERT INTO categories (name, description, sort_order) VALUES (?, ?, ?)`, ['Desserts', 'Sweet treats and classic desserts', 4]);

    const sub1 = await runQuery(`INSERT INTO subcategories (category_id, name, sort_order) VALUES (?, ?, ?)`, [cat1.lastID, 'Momos & Dimsums', 1]);
    const sub2 = await runQuery(`INSERT INTO subcategories (category_id, name, sort_order) VALUES (?, ?, ?)`, [cat1.lastID, 'Crispy Snacks', 2]);
    const sub3 = await runQuery(`INSERT INTO subcategories (category_id, name, sort_order) VALUES (?, ?, ?)`, [cat2.lastID, 'Signature Curries', 1]);
    const sub4 = await runQuery(`INSERT INTO subcategories (category_id, name, sort_order) VALUES (?, ?, ?)`, [cat2.lastID, 'Biryanis & Bowls', 2]);
    const sub5 = await runQuery(`INSERT INTO subcategories (category_id, name, sort_order) VALUES (?, ?, ?)`, [cat3.lastID, 'Craft Shakes', 1]);
    const sub6 = await runQuery(`INSERT INTO subcategories (category_id, name, sort_order) VALUES (?, ?, ?)`, [cat4.lastID, 'Ice Creams & Sweets', 1]);

    // Menu Items
    const items = [
      {
        sub: sub1.lastID,
        name: 'Steamed Paneer Tikka Momos (8 Pcs)',
        desc: 'Handcrafted momos stuffed with spiced cottage cheese and green herbs, served with spicy garlic dip.',
        price: 180,
        veg: 1, vgn: 0, gf: 0, spice: 'medium',
        img: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=600&auto=format&fit=crop&q=80',
        stock: 35, threshold: 5,
        variants: [{ name: 'Half (4 Pcs)', mod: -80 }, { name: 'Full (8 Pcs)', mod: 0 }]
      },
      {
        sub: sub1.lastID,
        name: 'Crispy Fried Chicken Momos',
        desc: 'Crunchy golden fried chicken momos sprinkled with peri peri seasoning.',
        price: 220,
        veg: 0, vgn: 0, gf: 0, spice: 'hot',
        img: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
        stock: 20, threshold: 5,
        variants: [{ name: 'Half (4 Pcs)', mod: -100 }, { name: 'Full (8 Pcs)', mod: 0 }]
      },
      {
        sub: sub2.lastID,
        name: 'Truffle Parmesan French Fries',
        desc: 'Double-fried potato batons tossed in white truffle oil and fresh parmesan.',
        price: 190,
        veg: 1, vgn: 0, gf: 1, spice: 'mild',
        img: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80',
        stock: 40, threshold: 8,
        variants: [{ name: 'Regular', mod: 0 }, { name: 'Large Cheese Burst', mod: 50 }]
      },
      {
        sub: sub3.lastID,
        name: 'Velvety Butter Chicken Gravy',
        desc: 'Tender tandoori chicken simmered in rich tomato, butter, and cashew cream sauce.',
        price: 340,
        veg: 0, vgn: 0, gf: 1, spice: 'medium',
        img: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=80',
        stock: 15, threshold: 3,
        variants: [{ name: 'Single Portion', mod: 0 }, { name: 'Family Handi', mod: 200 }]
      },
      {
        sub: sub3.lastID,
        name: 'Shahi Paneer Cream Masala',
        desc: 'Cottage cheese cubes cooked in aromatic royal spices and silky cream.',
        price: 290,
        veg: 1, vgn: 0, gf: 1, spice: 'mild',
        img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop&q=80',
        stock: 25, threshold: 4,
        variants: [{ name: 'Single Portion', mod: 0 }, { name: 'Family Handi', mod: 170 }]
      },
      {
        sub: sub4.lastID,
        name: 'Hyderabadi Dum Chicken Biryani',
        desc: 'Fragrant basmati rice layered with marinated chicken, saffron, and caramelised onions.',
        price: 360,
        veg: 0, vgn: 0, gf: 1, spice: 'hot',
        img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
        stock: 2, threshold: 5, // Low stock on purpose to trigger warning
        variants: [{ name: 'Regular', mod: 0 }, { name: 'Jumbo Pack', mod: 250 }]
      },
      {
        sub: sub5.lastID,
        name: 'Belgian Dark Chocolate Thick Shake',
        desc: 'Rich 70% dark Belgian chocolate blended with creamy ice cream.',
        price: 170,
        veg: 1, vgn: 0, gf: 1, spice: 'mild',
        img: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80',
        stock: 50, threshold: 10,
        variants: [{ name: 'Standard (350ml)', mod: 0 }, { name: 'Monster Jar (500ml)', mod: 50 }]
      },
      {
        sub: sub6.lastID,
        name: 'Warm Chocolate Lava Cake',
        desc: 'Gooey dark chocolate center cake served with a scoop of vanilla bean gelato.',
        price: 195,
        veg: 1, vgn: 0, gf: 0, spice: 'mild',
        img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
        stock: 12, threshold: 4,
        variants: [{ name: 'Single Slice', mod: 0 }]
      }
    ];

    for (const item of items) {
      const res = await runQuery(`
        INSERT INTO menu_items (subcategory_id, name, description, price, is_veg, is_vegan, is_gluten_free, spice_level, image_url, stock_quantity, low_stock_threshold)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [item.sub, item.name, item.desc, item.price, item.veg, item.vgn, item.gf, item.spice, item.img, item.stock, item.threshold]);
      
      const itemId = res.lastID;
      for (const v of item.variants) {
        await runQuery(`INSERT INTO item_variants (item_id, name, price_modifier) VALUES (?, ?, ?)`, [itemId, v.name, v.mod]);
      }
    }
    console.log('Seeding completed successfully!');
  }

  // Always sync Main Admin credentials from .env if provided
  const envAdminUsername = process.env.ADMIN_USERNAME || 'admin';
  const envAdminEmail = process.env.ADMIN_EMAIL || 'admin@aamantran.com';
  const envAdminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  try {
    const hashedAdminPass = await bcrypt.hash(envAdminPassword, 10);
    // First check if a user with this username already exists
    const existingByUsername = await getQuery('SELECT id, is_main_admin FROM users WHERE username = ?', [envAdminUsername]);
    const existingMainAdmin = await getQuery('SELECT id, username FROM users WHERE is_main_admin = 1');

    if (existingByUsername) {
      // Username exists — update that user to be main admin with latest credentials
      await runQuery(
        `UPDATE users SET email = ?, password_hash = ?, is_main_admin = 1, status = 'approved', role = 'admin' WHERE id = ?`,
        [envAdminEmail, hashedAdminPass, existingByUsername.id]
      );
      // If there was a different main admin, demote it
      if (existingMainAdmin && existingMainAdmin.id !== existingByUsername.id) {
        await runQuery(`UPDATE users SET is_main_admin = 0 WHERE id = ?`, [existingMainAdmin.id]);
      }
      console.log(`✅ Main Admin credentials synced from .env (Email: ${envAdminEmail}, Username: ${envAdminUsername})`);
    } else if (existingMainAdmin) {
      // Main admin exists but with different username — update username & credentials
      await runQuery(
        `UPDATE users SET username = ?, email = ?, password_hash = ?, status = 'approved' WHERE id = ?`,
        [envAdminUsername, envAdminEmail, hashedAdminPass, existingMainAdmin.id]
      );
      console.log(`✅ Main Admin credentials synced from .env (Email: ${envAdminEmail}, Username: ${envAdminUsername})`);
    } else {
      // No admin exists at all — create one
      await runQuery(
        `INSERT INTO users (username, email, password_hash, name, role, is_main_admin, status) VALUES (?, ?, ?, 'Main Admin Owner', 'admin', 1, 'approved')`,
        [envAdminUsername, envAdminEmail, hashedAdminPass]
      );
      console.log(`✅ Created Main Admin account from .env (Email: ${envAdminEmail})`);
    }

    // Ensure demo staff users (cashier1, chef1, waiter1) exist & have updated credentials
    const cashierPass = await bcrypt.hash('cashier123', 10);
    const chefPass = await bcrypt.hash('chef123', 10);
    const waiterPass = await bcrypt.hash('waiter123', 10);

    const existingCashier = await getQuery("SELECT id FROM users WHERE username = 'cashier1'");
    if (existingCashier) {
      await runQuery(`UPDATE users SET password_hash = ?, status = 'approved', role = 'cashier' WHERE id = ?`, [cashierPass, existingCashier.id]);
    } else {
      await runQuery(`INSERT INTO users (username, email, password_hash, name, role, is_main_admin, status) VALUES (?, ?, ?, 'Front Cashier Sarah', 'cashier', 0, 'approved')`, [
        'cashier1', 'cashier1@aamantran.com', cashierPass
      ]);
    }

    const existingChef = await getQuery("SELECT id FROM users WHERE username = 'chef1'");
    if (existingChef) {
      await runQuery(`UPDATE users SET password_hash = ?, status = 'approved', role = 'chef' WHERE id = ?`, [chefPass, existingChef.id]);
    } else {
      await runQuery(`INSERT INTO users (username, email, password_hash, name, role, is_main_admin, status) VALUES (?, ?, ?, 'Head Chef Mario', 'chef', 0, 'approved')`, [
        'chef1', 'chef1@aamantran.com', chefPass
      ]);
    }

    try {
      const existingWaiter = await getQuery("SELECT id FROM users WHERE username = 'waiter1'");
      if (existingWaiter) {
        await runQuery(`UPDATE users SET password_hash = ?, status = 'approved', role = 'cashier' WHERE id = ?`, [waiterPass, existingWaiter.id]);
      } else {
        await runQuery(`INSERT INTO users (username, email, password_hash, name, role, is_main_admin, status) VALUES (?, ?, ?, 'Floor Server Alex', 'cashier', 0, 'approved')`, [
          'waiter1', 'waiter1@aamantran.com', waiterPass
        ]);
      }
      console.log('✅ Demo staff accounts synced (cashier1, chef1, waiter1)');
    } catch (e) {
      console.log('Note on staff accounts sync:', e.message);
    }

    // Sync any orders whose created_at string differs from order_number date
    try {
      const allOrders = await allQuery(`SELECT id, order_number, created_at FROM orders WHERE order_number LIKE 'ORD-%'`);
      for (const ord of allOrders) {
        const parts = ord.order_number.split('-');
        if (parts.length >= 2 && parts[1].length === 6) {
          const yy = '20' + parts[1].slice(0, 2);
          const mm = parts[1].slice(2, 4);
          const dd = parts[1].slice(4, 6);
          const expectedDateStr = `${yy}-${mm}-${dd}`;
          
          if (ord.created_at && !ord.created_at.startsWith(expectedDateStr)) {
            const timePart = ord.created_at.includes(' ') ? ord.created_at.split(' ')[1] : (ord.created_at.includes('T') ? ord.created_at.split('T')[1].slice(0, 8) : '12:00:00');
            const fixedCreatedAt = `${expectedDateStr} ${timePart}`;
            await runQuery(`UPDATE orders SET created_at = ? WHERE id = ?`, [fixedCreatedAt, ord.id]);
            console.log(`🔧 Synchronized order #${ord.order_number} created_at to local date: ${fixedCreatedAt}`);
          }
        }
      }
    } catch (e) {
      console.error('Error synchronizing order created_at dates:', e.message);
    }
  } catch (err) {
    console.error('Error syncing Main Admin credentials from .env:', err.message);
  }
};

export default db;
