import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'gourmetbites-super-secret-key-2026';

export const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name, status: user.status },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
};

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.status !== 'approved') {
      return res.status(403).json({ error: 'Account pending admin approval or deactivated.' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
    }
    next();
  };
};
