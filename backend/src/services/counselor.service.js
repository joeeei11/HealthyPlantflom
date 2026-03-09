const { User, CounselorProfile, Appointment, Session, SessionNote, StudentProfile } = require('../models');

// ── 个人档案 ────────────────────────────────────────────────────────────────

/**
 * 获取咨询师个人信息（含扩展档案）
 */
async function getProfile(counselorId) {
  const user = await User.findByPk(counselorId, {
    attributes: ['id', 'username', 'email', 'avatarUrl', 'createdAt'],
  });
  if (!user) {
    const err = new Error('用户不存在');
    err.status = 404;
    throw err;
  }
  const profile = await CounselorProfile.findOne({ where: { userId: counselorId } });
  return { ...user.toJSON(), profile: profile ? profile.toJSON() : null };
}

/**
 * 更新/创建咨询师档案
 * 首次调用（profile 不存在）时必须传 realName
 */
async function updateProfile(counselorId, data) {
  const ALLOWED = [
    'realName', 'gender', 'title', 'qualification',
    'specialties', 'bio', 'availableSlots', 'maxAppointmentsPerDay',
    'phone', 'isAccepting',
  ];
  const updates = {};
  for (const key of ALLOWED) {
    if (data[key] !== undefined) updates[key] = data[key];
  }

  let profile = await CounselorProfile.findOne({ where: { userId: counselorId } });
  if (profile) {
    await profile.update(updates);
  } else {
    if (!updates.realName) {
      const err = new Error('首次创建档案必须提供 realName（真实姓名）');
      err.status = 400;
      throw err;
    }
    profile = await CounselorProfile.create({ userId: counselorId, ...updates });
  }
  return profile.toJSON();
}

// ── 预约管理 ────────────────────────────────────────────────────────────────

/**
 * 获取属于该咨询师的预约列表（分页）
 * @param {object} options - { status, page, pageSize }
 */
async function getAppointments(counselorId, { status, page = 1, pageSize = 10 } = {}) {
  const where = { counselorId };
  if (status) where.status = status;

  const limit = Math.max(1, parseInt(pageSize) || 10);
  const offset = (Math.max(1, parseInt(page) || 1) - 1) * limit;

  const { count, rows } = await Appointment.findAndCountAll({
    where,
    include: [{
      model: User,
      as: 'student',
      attributes: ['id', 'username', 'avatarUrl'],
      include: [{
        model: StudentProfile,
        as: 'studentProfile',
        attributes: ['realName', 'grade', 'major', 'college'],
      }],
    }],
    order: [['appointmentDate', 'DESC'], ['startTime', 'ASC']],
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
 * 确认或拒绝预约
 * @param {string} action - 'confirm' | 'reject'
 */
async function updateAppointment(counselorId, appointmentId, { action, cancelReason } = {}) {
  if (!['confirm', 'reject'].includes(action)) {
    const err = new Error('action 参数须为 confirm 或 reject');
    err.status = 400;
    throw err;
  }

  const appointment = await Appointment.findByPk(appointmentId);
  if (!appointment) {
    const err = new Error('预约不存在');
    err.status = 404;
    throw err;
  }
  if (appointment.counselorId !== counselorId) {
    const err = new Error('无权操作此预约');
    err.status = 403;
    throw err;
  }
  if (appointment.status !== 'pending') {
    const err = new Error(`当前预约状态为「${appointment.status}」，无法操作`);
    err.status = 400;
    throw err;
  }

  if (action === 'confirm') {
    await appointment.update({ status: 'confirmed' });
  } else {
    await appointment.update({
      status: 'cancelled',
      cancelledBy: counselorId,
      cancelReason: cancelReason || null,
    });
  }
  return appointment.toJSON();
}

// ── 会话管理 ────────────────────────────────────────────────────────────────

/**
 * 获取属于该咨询师的会话列表（分页）
 */
async function getSessions(counselorId, { status, page = 1, pageSize = 10 } = {}) {
  const where = { counselorId };
  if (status) where.status = status;

  const limit = Math.max(1, parseInt(pageSize) || 10);
  const offset = (Math.max(1, parseInt(page) || 1) - 1) * limit;

  const { count, rows } = await Session.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'student',
        attributes: ['id', 'username', 'avatarUrl'],
        include: [{
          model: StudentProfile,
          as: 'studentProfile',
          attributes: ['realName'],
        }],
      },
      {
        model: Appointment,
        as: 'appointment',
        attributes: ['appointmentDate', 'startTime', 'endTime', 'type'],
        required: false,
      },
    ],
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
 * 开始会话（从预约发起 或 临时安排）
 */
async function createSession(counselorId, { appointmentId, studentId, type }) {
  if (!studentId) {
    const err = new Error('缺少必要字段：studentId');
    err.status = 400;
    throw err;
  }

  // 若来源于预约，校验预约归属和状态
  if (appointmentId) {
    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      const err = new Error('预约不存在');
      err.status = 404;
      throw err;
    }
    if (appointment.counselorId !== counselorId) {
      const err = new Error('无权操作此预约');
      err.status = 403;
      throw err;
    }
    if (appointment.status !== 'confirmed') {
      const err = new Error('只能为已确认的预约开始会话');
      err.status = 400;
      throw err;
    }
    // 检查是否已存在关联会话
    const existing = await Session.findOne({ where: { appointmentId } });
    if (existing) {
      const err = new Error('该预约已存在关联会话');
      err.status = 409;
      throw err;
    }
  }

  const session = await Session.create({
    appointmentId: appointmentId || null,
    studentId,
    counselorId,
    type: type || 'individual',
    status: 'in_progress',
    startedAt: new Date(),
  });

  // 将来源预约标记为已完成
  if (appointmentId) {
    await Appointment.update({ status: 'completed' }, { where: { id: appointmentId } });
  }

  return session.toJSON();
}

/**
 * 结束会话
 */
async function endSession(counselorId, sessionId) {
  const session = await Session.findByPk(sessionId);
  if (!session) {
    const err = new Error('会话不存在');
    err.status = 404;
    throw err;
  }
  if (session.counselorId !== counselorId) {
    const err = new Error('无权操作此会话');
    err.status = 403;
    throw err;
  }
  if (session.status !== 'in_progress') {
    const err = new Error(`当前会话状态为「${session.status}」，无法结束`);
    err.status = 400;
    throw err;
  }

  await session.update({ status: 'completed', endedAt: new Date() });
  return session.toJSON();
}

// ── 案例笔记 ────────────────────────────────────────────────────────────────

/**
 * 添加案例笔记
 */
async function createNote(counselorId, sessionId, { content, riskLevel, followUpRequired, isPrivate }) {
  if (!content) {
    const err = new Error('笔记内容不能为空');
    err.status = 400;
    throw err;
  }

  const session = await Session.findByPk(sessionId);
  if (!session) {
    const err = new Error('会话不存在');
    err.status = 404;
    throw err;
  }
  if (session.counselorId !== counselorId) {
    const err = new Error('无权为此会话添加笔记');
    err.status = 403;
    throw err;
  }

  const note = await SessionNote.create({
    sessionId,
    counselorId,
    content,
    riskLevel: riskLevel || 'low',
    followUpRequired: followUpRequired ? 1 : 0,
    isPrivate: isPrivate === false ? 0 : 1,
  });
  return note.toJSON();
}

/**
 * 获取会话的案例笔记列表（仅本咨询师可见）
 */
async function getNotes(counselorId, sessionId) {
  const session = await Session.findByPk(sessionId);
  if (!session) {
    const err = new Error('会话不存在');
    err.status = 404;
    throw err;
  }
  if (session.counselorId !== counselorId) {
    const err = new Error('无权查看此会话笔记');
    err.status = 403;
    throw err;
  }

  const notes = await SessionNote.findAll({
    where: { sessionId, counselorId },
    order: [['createdAt', 'ASC']],
  });
  return notes.map(n => n.toJSON());
}

module.exports = {
  getProfile,
  updateProfile,
  getAppointments,
  updateAppointment,
  getSessions,
  createSession,
  endSession,
  createNote,
  getNotes,
};
