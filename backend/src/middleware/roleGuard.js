/**
 * 角色权限中间件
 * 用法：router.get('/path', authMiddleware, roleGuard('student'), handler)
 */
function roleGuard(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, data: null, message: '未认证' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ code: 403, data: null, message: '无权限访问' });
    }
    next();
  };
}

module.exports = roleGuard;
