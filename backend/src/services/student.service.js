const { Op } = require('sequelize');
const { User, StudentProfile, CounselorProfile, Appointment, Session, Feedback, Announcement } = require('../models');

/**
 * 获取学生个人信息（含扩展档案）
 */
async function getProfile(userId) {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'username', 'email', 'avatarUrl', 'createdAt'],
  });
  if (!user) {
    const err = new Error('用户不存在');
    err.status = 404;
    throw err;
  }
  const profile = await StudentProfile.findOne({ where: { userId } });
  return { ...user.toJSON(), profile: profile ? profile.toJSON() : null };
}

/**
 * 更新/创建学生档案
 * 首次调用（profile 不存在）时必须传 realName
 */
async function updateProfile(userId, data) {
  const ALLOWED = [
    'realName', 'studentNo', 'gender', 'grade',
    'major', 'college', 'phone', 'emergencyContact', 'emergencyPhone',
  ];
  const updates = {};
  for (const key of ALLOWED) {
    if (data[key] !== undefined && data[key] !== '') updates[key] = data[key];
  }

  let profile = await StudentProfile.findOne({ where: { userId } });
  if (profile) {
    await profile.update(updates);
  } else {
    if (!updates.realName) {
      const err = new Error('首次创建档案必须提供 realName（真实姓名）');
      err.status = 400;
      throw err;
    }
    profile = await StudentProfile.create({ userId, ...updates });
  }
  return profile.toJSON();
}

/**
 * 获取咨询师列表（仅返回正在接受预约的咨询师）
 * @param {object} options - { keyword }  可按咨询师姓名模糊搜索
 */
async function getCounselors({ keyword } = {}) {
  const profileWhere = { isAccepting: 1 };
  if (keyword) {
    profileWhere.realName = { [Op.like]: `%${keyword}%` };
  }

  const counselors = await User.findAll({
    where: { role: 'counselor', isActive: 1 },
    attributes: ['id', 'username', 'avatarUrl'],
    include: [{
      model: CounselorProfile,
      as: 'counselorProfile',
      where: profileWhere,
      required: true,
      attributes: ['realName', 'gender', 'title', 'specialties', 'bio', 'availableSlots', 'maxAppointmentsPerDay'],
    }],
  });
  return counselors.map(c => c.toJSON());
}

/**
 * 发起预约
 */
async function createAppointment(studentId, { counselorId, appointmentDate, startTime, endTime, type, reason }) {
  if (!counselorId || !appointmentDate || !startTime || !endTime) {
    const err = new Error('缺少必要字段：counselorId、appointmentDate、startTime、endTime');
    err.status = 400;
    throw err;
  }
  if (startTime >= endTime) {
    const err = new Error('开始时间必须早于结束时间');
    err.status = 400;
    throw err;
  }

  // 验证咨询师存在且账号启用
  const counselor = await User.findOne({ where: { id: counselorId, role: 'counselor', isActive: 1 } });
  if (!counselor) {
    const err = new Error('咨询师不存在或账号已停用');
    err.status = 404;
    throw err;
  }

  // 验证咨询师档案存在且正在接受预约
  const counselorProfile = await CounselorProfile.findOne({ where: { userId: counselorId } });
  if (!counselorProfile || !counselorProfile.isAccepting) {
    const err = new Error('该咨询师当前不接受预约');
    err.status = 400;
    throw err;
  }

  // 检查当日预约数量是否已达上限
  const dayCount = await Appointment.count({
    where: {
      counselorId,
      appointmentDate,
      status: { [Op.notIn]: ['cancelled'] },
    },
  });
  if (dayCount >= counselorProfile.maxAppointmentsPerDay) {
    const err = new Error('该咨询师当日预约已满');
    err.status = 400;
    throw err;
  }

  // 检查时段冲突（两区间 [a,b] 和 [c,d] 重叠条件：a < d AND c < b）
  const conflicting = await Appointment.findOne({
    where: {
      counselorId,
      appointmentDate,
      status: { [Op.notIn]: ['cancelled'] },
      startTime: { [Op.lt]: endTime },
      endTime: { [Op.gt]: startTime },
    },
  });
  if (conflicting) {
    const err = new Error('该时段已有其他预约，请选择其他时间');
    err.status = 409;
    throw err;
  }

  const appointment = await Appointment.create({
    studentId,
    counselorId,
    appointmentDate,
    startTime,
    endTime,
    type: type || 'offline',
    reason: reason || null,
  });
  return appointment.toJSON();
}

/**
 * 获取我的预约列表（分页）
 */
async function getAppointments(studentId, { status, page = 1, pageSize = 10 } = {}) {
  const where = { studentId };
  if (status) where.status = status;

  const limit = Math.max(1, parseInt(pageSize) || 10);
  const offset = (Math.max(1, parseInt(page) || 1) - 1) * limit;

  const { count, rows } = await Appointment.findAndCountAll({
    where,
    include: [{
      model: User,
      as: 'counselor',
      attributes: ['id', 'username', 'avatarUrl'],
      include: [{
        model: CounselorProfile,
        as: 'counselorProfile',
        attributes: ['realName', 'title'],
      }],
    }],
    order: [['appointmentDate', 'DESC'], ['startTime', 'DESC']],
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
 * 取消预约
 */
async function cancelAppointment(studentId, appointmentId, { cancelReason } = {}) {
  const appointment = await Appointment.findByPk(appointmentId);
  if (!appointment) {
    const err = new Error('预约不存在');
    err.status = 404;
    throw err;
  }
  if (appointment.studentId !== studentId) {
    const err = new Error('无权操作此预约');
    err.status = 403;
    throw err;
  }
  if (!['pending', 'confirmed'].includes(appointment.status)) {
    const err = new Error(`当前预约状态为「${appointment.status}」，无法取消`);
    err.status = 400;
    throw err;
  }

  await appointment.update({
    status: 'cancelled',
    cancelledBy: studentId,
    cancelReason: cancelReason || null,
  });
  return appointment.toJSON();
}

/**
 * 提交咨询评价
 */
async function submitFeedback(studentId, { sessionId, rating, content, isAnonymous }) {
  if (!sessionId || rating === undefined || rating === null) {
    const err = new Error('缺少必要字段：sessionId、rating');
    err.status = 400;
    throw err;
  }
  if (rating < 1 || rating > 5) {
    const err = new Error('评分须在 1-5 之间');
    err.status = 400;
    throw err;
  }

  const session = await Session.findByPk(sessionId);
  if (!session) {
    const err = new Error('咨询记录不存在');
    err.status = 404;
    throw err;
  }
  if (session.studentId !== studentId) {
    const err = new Error('无权评价此咨询');
    err.status = 403;
    throw err;
  }
  if (session.status !== 'completed') {
    const err = new Error('只能对已完成的咨询进行评价');
    err.status = 400;
    throw err;
  }

  const existing = await Feedback.findOne({ where: { sessionId } });
  if (existing) {
    const err = new Error('已提交过评价，不可重复评价');
    err.status = 409;
    throw err;
  }

  const feedback = await Feedback.create({
    sessionId,
    studentId,
    counselorId: session.counselorId,
    rating,
    content: content || null,
    isAnonymous: isAnonymous ? 1 : 0,
  });
  return feedback.toJSON();
}

/**
 * 获取对学生可见的已发布公告（分页）
 * targetRole 为 'all' 或 'student'，publishedAt 不为空，未过期
 */
async function getAnnouncements({ page = 1, pageSize = 10 } = {}) {
  const now = new Date();
  const where = {
    publishedAt: { [Op.not]: null },
    targetRole: { [Op.in]: ['all', 'student'] },
    [Op.or]: [
      { expiresAt: null },
      { expiresAt: { [Op.gt]: now } },
    ],
  };

  const limit = Math.max(1, parseInt(pageSize) || 10);
  const offset = (Math.max(1, parseInt(page) || 1) - 1) * limit;

  const { count, rows } = await Announcement.findAndCountAll({
    where,
    include: [{ model: User, as: 'author', attributes: ['username'] }],
    order: [['isPinned', 'DESC'], ['publishedAt', 'DESC']],
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

module.exports = {
  getProfile,
  updateProfile,
  getCounselors,
  createAppointment,
  getAppointments,
  cancelAppointment,
  submitFeedback,
  getAnnouncements,
};
