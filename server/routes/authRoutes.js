import express from 'express';
import bcrypt from 'bcryptjs';
import { runQuery, getQuery, allQuery } from '../db.js';
import { generateToken, verifyToken, requireRole } from '../auth.js';

const router = express.Router();

// Register staff account (Chef / Cashier / Waiter / Admin Request)
router.post('/register', async (req, res) => {
  try {
    const { username, password, name, role, personal_email, phone } = req.body;
    if (!username || !password || !name || !role || !personal_email || !phone) {
      return res.status(400).json({ error: 'Username, password, name, role, personal Gmail, and mobile phone number are required.' });
    }
    if (!['chef', 'cashier', 'waiter', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid staff role specified.' });
    }

    const existing = await getQuery('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(400).json({ error: 'Username already taken.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const companyEmail = `${username}@aamantran.com`;

    // Requires admin approval by default
    await runQuery(
      `INSERT INTO users (username, email, personal_email, phone, password_hash, name, role, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [username, companyEmail, personal_email.trim(), phone.trim(), hash, name, role]
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
        email: user.email || `${user.username}@aamantran.com`,
        personal_email: user.personal_email || '',
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
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await getQuery('SELECT id, username, email, personal_email, name, role, is_main_admin, status FROM users WHERE id = ?', [req.user.id]);
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: List all users (Admins, Chefs, Cashiers, Waiters)
router.get('/staff', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const staff = await allQuery(`
      SELECT id, username, email, personal_email, phone, name, role, is_main_admin, status, created_at 
      FROM users 
      ORDER BY 
        CASE role 
          WHEN 'admin' THEN 1 
          WHEN 'cashier' THEN 2 
          WHEN 'chef' THEN 3 
          WHEN 'waiter' THEN 4 
          ELSE 5 
        END ASC,
        created_at DESC
    `);
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Add a new Admin, Chef, Cashier, or Waiter directly
router.post('/add-user', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { username, email, personal_email, phone, password, name, role, status = 'approved' } = req.body;
    if (!username || !password || !name || !role) {
      return res.status(400).json({ error: 'Username, password, name, and role are required.' });
    }
    if (!['admin', 'chef', 'cashier', 'waiter'].includes(role)) {
      return res.status(400).json({ error: 'Role must be admin, chef, cashier, or waiter.' });
    }

    const existing = await getQuery('SELECT id FROM users WHERE username = ?', [username]);
    if (existing) {
      return res.status(400).json({ error: 'Username already exists.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const userEmail = email || `${username}@aamantran.com`;
    const isMainAdmin = 0; // Only initial admin is main admin by default

    await runQuery(
      `INSERT INTO users (username, email, personal_email, phone, password_hash, name, role, is_main_admin, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, userEmail, personal_email || '', phone || '', hash, name, role, isMainAdmin, status]
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

// User: Update own profile (Name, Work Email, Personal Email, Phone, Username, Password) — All fields optional
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, email, personal_email, phone, username, password } = req.body;
    const userId = req.user.id;

    const currentUser = await getQuery('SELECT * FROM users WHERE id = ?', [userId]);
    if (!currentUser) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const newName = (name && name.trim()) ? name.trim() : currentUser.name;
    const newUsername = (username && username.trim()) ? username.trim() : currentUser.username;
    const newEmail = email !== undefined ? email.trim() : (currentUser.email || '');
    const newPersonalEmail = personal_email !== undefined ? personal_email.trim() : (currentUser.personal_email || '');
    const newPhone = phone !== undefined ? phone.trim() : (currentUser.phone || '');

    // Check if new username is taken by another user
    if (newUsername !== currentUser.username) {
      const existing = await getQuery('SELECT id FROM users WHERE username = ? AND id != ?', [newUsername, userId]);
      if (existing) {
        return res.status(400).json({ error: 'Username is already taken by another account.' });
      }
    }

    let passwordHash = currentUser.password_hash;
    if (password && password.trim()) {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    await runQuery(
      `UPDATE users SET name = ?, email = ?, personal_email = ?, phone = ?, username = ?, password_hash = ? WHERE id = ?`,
      [newName, newEmail, newPersonalEmail, newPhone, newUsername, passwordHash, userId]
    );

    const updatedUser = await getQuery('SELECT id, username, email, personal_email, phone, name, role, is_main_admin, status FROM users WHERE id = ?', [userId]);
    const newToken = generateToken(updatedUser);

    res.json({
      message: 'Profile updated successfully!',
      token: newToken,
      user: updatedUser
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Edit any staff member's profile (Name, Email, Personal Email, Phone, Username, Role, Status, Password reset)
router.put('/staff/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { name, email, personal_email, phone, username, role, status, password } = req.body;
    const targetId = req.params.id;

    const targetUser = await getQuery('SELECT * FROM users WHERE id = ?', [targetId]);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!name || !username) {
      return res.status(400).json({ error: 'Name and Username are required.' });
    }

    // Check username uniqueness
    const existing = await getQuery('SELECT id FROM users WHERE username = ? AND id != ?', [username, targetId]);
    if (existing) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    let passwordHash = targetUser.password_hash;
    if (password && password.trim()) {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    // Don't downgrade main admin role or status
    const newRole = targetUser.is_main_admin === 1 ? 'admin' : (role || targetUser.role);
    const newStatus = targetUser.is_main_admin === 1 ? 'approved' : (status || targetUser.status);
    const newPersonalEmail = personal_email !== undefined ? personal_email : (targetUser.personal_email || '');
    const newPhone = phone !== undefined ? phone : (targetUser.phone || '');

    await runQuery(
      `UPDATE users SET name = ?, email = ?, personal_email = ?, phone = ?, username = ?, role = ?, status = ?, password_hash = ? WHERE id = ?`,
      [name, email, newPersonalEmail, newPhone, username, newRole, newStatus, passwordHash, targetId]
    );

    res.json({ message: `Staff account '${username}' updated successfully!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Quick Approve or Reject a pending staff request (used by StaffApprovalManager)
router.patch('/staff/:id/status', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending', 'deactivated'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be: approved, rejected, pending, or deactivated.' });
    }

    const targetUser = await getQuery('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (targetUser.is_main_admin === 1) {
      return res.status(403).json({ error: 'Cannot change status of the Main Admin account.' });
    }

    await runQuery('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: `User status updated to '${status}' successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
