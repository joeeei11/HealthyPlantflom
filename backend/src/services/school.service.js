const bcrypt = require('bcryptjs');
const { Op, fn, col } = require('sequelize');
const { User, StudentProfile, CounselorProfile, Appointment, Session, Feedback, Announcement } = require('../models');

// ── 数据统计 ────────────────────────────────────────────────────────────────

/**
 * 获取平台总览统计
 */
async function getStats() {
  const [studentCount, counselorCount, appointmentCount, sessionCount, avgRating] =
    await Promise.all([
      User.count({ where: { role: 'student', isActive: 1 } }),
      User.count({ where: { role: 'counselor', isActive: 1 } }),
      Appointment.count(),
      Session.count({ where: { status: 'completed' } }),
      Feedback.findOne({
        attributes: [[fn('AVG', col('rating')), 'avgRating']],
        raw: true,
      }),
    ]);

  return {
    studentCount,
    counselorCount,
    appointmentCount,
    completedSessionCount: sessionCount,
    avgRating: avgRating?.avgRating ? parseFloat(Number(avgRating.avgRating).toFixed(2)) : null,
  };
}

// ── 咨询师管理 ──────────────────────────────────────────────────────────────

/**
 * 获取咨询师列表（含扩展档案，分页）
 */
async function getCounselors({ page = 1, pageSize = 20 } = {}) {
  const limit = Math.max(1, parseInt(pageSize) || 20);
  const offset = (Math.max(1, parseInt(page) || 1) - 1) * limit;

  const { count, rows } = await User.findAndCountAll({
    where: { role: 'counselor' },
    attributes: ['id', 'username', 'email', 'isActive', 'avatarUrl', 'lastLoginAt', 'createdAt'],
    include: [{
      model: CounselorProfile,
      as: 'counselorProfile',
      attributes: ['realName', 'title', 'specialties', 'isAccepting', 'maxAppointmentsPerDay'],
      required: false,
    }],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return {
    total: count,
    page: parseInt(page) || 1,
    pageSize: limit,
    list: rows.map(r => r.toJSON()),
  };
}

/**
 * 添加咨询师账号
 * @param {object} data - { username, email, password, realName }
 */
async function createCounselor({ username, email, password, realName }) {
  if (!username || !email || !password) {
    const err = new Error('username、email、password 为必填项');
    err.status = 400;
    throw err;
  }

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    const err = new Error('该邮箱已被注册');
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    username,
    email,
    passwordHash,
    role: 'counselor',
    isActive: 1,
  });

  // 若提供了 realName，同时创建档案
  if (realName) {
    await CounselorProfile.create({ userId: user.id, realName });
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

/**
 * 启用 / 禁用咨询师账号
 * @param {number} counselorId - 目标咨询师的 user.id
 * @param {boolean} isActive
 */
async function updateCounselorStatus(counselorId, { isActive }) {
  if (typeof isActive !== 'boolean' && isActive !== 0 && isActive !== 1) {
    const err = new Error('isActive 须为布尔值');
    err.status = 400;
    throw err;
  }

  const user = await User.findOne({ where: { id: counselorId, role: 'counselor' } });
  if (!user) {
    const err = new Error('咨询师不存在');
    err.status = 404;
    throw err;
  }

  await user.update({ isActive: isActive ? 1 : 0 });
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    isActive: user.isActive,
  };
}

// ── 公告管理 ────────────────────────────────────────────────────────────────

/**
 * 获取公告列表（管理端：含草稿）
 * @param {object} options - { page, pageSize, status: 'draft'|'published'|'all' }
 */
async function getAnnouncements({ page = 1, pageSize = 20, status = 'all' } = {}) {
  const limit = Math.max(1, parseInt(pageSize) || 20);
  const offset = (Math.max(1, parseInt(page) || 1) - 1) * limit;

  const where = {};
  if (status === 'draft') {
    where.publishedAt = null;
  } else if (status === 'published') {
    // 已发布
    where.publishedAt = { [Op.ne]: null };
  }

  const { count, rows } = await Announcement.findAndCountAll({
    where,
    include: [{
      model: User,
      as: 'author',
      attributes: ['id', 'username'],
    }],
    order: [
      ['isPinned', 'DESC'],
      ['publishedAt', 'DESC'],
      ['createdAt', 'DESC'],
    ],
    limit,
    offset,
  });

  return {
    total: count,
    page: parseInt(page) || 1,
    pageSize: limit,
    list: rows.map(r => r.toJSON()),
  };
}

/**
 * 创建公告（支持草稿 publish=false，立即发布 publish=true）
 */
async function createAnnouncement(authorId, { title, content, targetRole, isPinned, publish, expiresAt }) {
  if (!title || !content) {
    const err = new Error('title 和 content 为必填项');
    err.status = 400;
    throw err;
  }

  const announcement = await Announcement.create({
    authorId,
    title,
    content,
    targetRole: targetRole || 'all',
    isPinned: isPinned ? 1 : 0,
    publishedAt: publish ? new Date() : null,
    expiresAt: expiresAt || null,
  });

  return announcement.toJSON();
}

/**
 * 删除公告
 */
async function deleteAnnouncement(announcementId) {
  const announcement = await Announcement.findByPk(announcementId);
  if (!announcement) {
    const err = new Error('公告不存在');
    err.status = 404;
    throw err;
  }

  await announcement.destroy();
  return { id: announcementId };
}

module.exports = {
  getStats,
  getCounselors,
  createCounselor,
  updateCounselorStatus,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
};
