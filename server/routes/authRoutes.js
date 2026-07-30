import express from 'express';
import bcrypt from 'bcryptjs';
import { runQuery, getQuery, allQuery } from '../db.js';
import { generateToken, verifyToken, requireRole } from '../auth.js';

const router = express.Router();

// Register staff account (Chef / Cashier)
router.post('/register', async (req, res) => {
  try {
    const { username, password, name, role } = req.body;
    if (!username || !password || !name || !role) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (!['chef', 'cashier'].includes(role)) {
      return res.status(400).json({ error: 'Only chef or cashier registration is allowed.' });
    }

    const existing = await getQuery('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(400).json({ error: 'Username already taken.' });
    }

    const hash = await bcrypt.hash(password, 10);
    // Requires admin approval by default
    await runQuery(
      `INSERT INTO users (username, password_hash, name, role, status) VALUES (?, ?, ?, ?, 'pending')`,
      [username, hash, name, role]
    );

    res.json({ message: 'Registration request submitted! Awaiting Admin approval.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login staff
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await getQuery('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    if (user.status !== 'approved') {
      return res.status(403).json({ error: `Account status is '${user.status}'. Please contact Admin for approval.` });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email || `${user.username}@gourmetbites.com`,
        name: user.name,
        role: user.role,
        is_main_admin: user.is_main_admin || 0,
        status: user.status
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user profile
router.get('/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

// Admin: List all users (Admins, Chefs, Cashiers)
router.get('/staff', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const staff = await allQuery('SELECT id, username, email, name, role, is_main_admin, status, created_at FROM users ORDER BY created_at DESC');
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Add a new Admin, Chef, or Cashier directly
router.post('/add-user', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { username, email, password, name, role, status = 'approved' } = req.body;
    if (!username || !password || !name || !role) {
      return res.status(400).json({ error: 'Username, password, name, and role are required.' });
    }
    if (!['admin', 'chef', 'cashier'].includes(role)) {
      return res.status(400).json({ error: 'Role must be admin, chef, or cashier.' });
    }

    const existing = await getQuery('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(400).json({ error: 'Username already exists.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const userEmail = email || `${username}@gourmetbites.com`;
    const isMainAdmin = 0; // Only initial admin is main admin by default

    await runQuery(
      `INSERT INTO users (username, email, password_hash, name, role, is_main_admin, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, userEmail, hash, name, role, isMainAdmin, status]
    );

    res.json({ message: `Successfully added new ${role}: ${name}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete/Remove staff or sub-admin user
router.delete('/users/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const targetUser = await getQuery('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (targetUser.is_main_admin === 1) {
      return res.status(403).json({ error: 'Cannot delete the Main Admin account.' });
    }

    await runQuery('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: `User '${targetUser.username}' deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Approve/Reject/Deactivate staff user
router.patch('/staff/:id/status', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'deactivated', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const targetUser = await getQuery('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (targetUser && targetUser.is_main_admin === 1) {
      return res.status(403).json({ error: 'Cannot modify status of the Main Admin account.' });
    }

    await runQuery('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: `User status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
