/**
 * 异步路由包装器
 * 将 async 控制器的 rejected Promise 转发给 Express 全局错误中间件
 * 用法：router.get('/path', asyncHandler(controller.method))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
