const { verifyToken } = require('../utils/jwt');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, data: null, message: '未提供认证 Token' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    req.user = payload; // { id, role, ... }
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Token 已过期' : 'Token 无效';
    return res.status(401).json({ code: 401, data: null, message });
  }
}

module.exports = authMiddleware;
