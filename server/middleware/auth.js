const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_here';

function extractToken(header) {
  if (!header) return null;
  const parts = header.split(' ');
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];
  if (parts.length === 1) return parts[0];
  return null;
}

function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers['x-access-token'];
    const token = extractToken(authHeader);
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden: insufficient role' });
    return next();
  };
}

module.exports = { requireAuth, requireRole };
