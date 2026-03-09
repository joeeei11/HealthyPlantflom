const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  logger.error(`${req.method} ${req.path} — ${err.message}`, {
    stack: err.stack,
    status: err.status,
  });

  // Sequelize 验证错误
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const message = err.errors?.map((e) => e.message).join('; ') || '数据验证失败';
    return res.status(400).json({ code: 400, data: null, message });
  }

  const status = err.status || 500;
  const message = status === 500 ? '服务器内部错误' : err.message || '请求处理失败';
  return res.status(status).json({ code: status, data: null, message });
}

module.exports = errorHandler;
