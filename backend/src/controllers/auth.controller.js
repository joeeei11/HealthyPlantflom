const authService = require('../services/auth.service');
const { success } = require('../utils/response');

async function register(req, res) {
  const { username, email, password, role } = req.body;
  const result = await authService.register({ username, email, password, role });
  return success(res, result, '注册成功', 201);
}

async function login(req, res) {
  const { username, email, password } = req.body;
  const result = await authService.login({ username, email, password });
  return success(res, result, '登录成功');
}

async function refresh(req, res) {
  const { token } = req.body;
  const result = await authService.refreshToken(token);
  return success(res, result, 'Token 刷新成功');
}

async function me(req, res) {
  const result = await authService.getMe(req.user.id);
  return success(res, result);
}

module.exports = { register, login, refresh, me };
