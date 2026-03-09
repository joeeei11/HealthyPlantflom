const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const User = require('../models/User');
const { signToken, verifyToken } = require('../utils/jwt');

const SALT_ROUNDS = 10;

/**
 * 注册新用户
 * @param {object} param0 - { username, email, password, role }
 * @returns {{ token: string, user: object }}
 */
async function register({ username, email, password, role }) {
  if (!password || password.length < 6) {
    const err = new Error('密码长度不能少于 6 位');
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ username, email, passwordHash, role });
  const token = signToken({ id: user.id, role: user.role });
  return { token, user: formatUser(user) };
}

/**
 * 用户登录（支持 username 或 email）
 * @param {object} param0 - { username, email, password }（username 和 email 传其一即可）
 * @returns {{ token: string, user: object }}
 */
async function login({ username, email, password }) {
  const identifier = email || username;
  if (!identifier) {
    const err = new Error('请输入用户名或邮箱');
    err.status = 400;
    throw err;
  }
  const user = await User.findOne({
    where: { [Op.or]: [{ email: identifier }, { username: identifier }] },
  });
  if (!user) {
    const err = new Error('邮箱或密码错误');
    err.status = 401;
    throw err;
  }
  if (!user.isActive) {
    const err = new Error('账号已被禁用，请联系管理员');
    err.status = 403;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const err = new Error('邮箱或密码错误');
    err.status = 401;
    throw err;
  }

  await user.update({ lastLoginAt: new Date() });
  const token = signToken({ id: user.id, role: user.role });
  return { token, user: formatUser(user) };
}

/**
 * 刷新 Token（凭有效 token 换取新 token）
 * @param {string} oldToken
 * @returns {{ token: string }}
 */
async function refreshToken(oldToken) {
  if (!oldToken) {
    const err = new Error('缺少 token');
    err.status = 400;
    throw err;
  }

  const payload = verifyToken(oldToken); // 过期/无效会直接 throw
  const user = await User.findByPk(payload.id);
  if (!user || !user.isActive) {
    const err = new Error('用户不存在或已被禁用');
    err.status = 401;
    throw err;
  }

  const token = signToken({ id: user.id, role: user.role });
  return { token };
}

/**
 * 获取当前登录用户信息
 * @param {number} userId
 * @returns {object}
 */
async function getMe(userId) {
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error('用户不存在');
    err.status = 404;
    throw err;
  }
  return formatUser(user);
}

/**
 * 格式化用户对象，过滤敏感字段
 */
function formatUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    avatarUrl: user.avatarUrl,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

module.exports = { register, login, refreshToken, getMe };
