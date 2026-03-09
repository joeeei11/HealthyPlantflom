const counselorService = require('../services/counselor.service');
const { success } = require('../utils/response');

async function getProfile(req, res) {
  const result = await counselorService.getProfile(req.user.id);
  return success(res, result);
}

async function updateProfile(req, res) {
  const result = await counselorService.updateProfile(req.user.id, req.body);
  return success(res, result, '档案更新成功');
}

async function getAppointments(req, res) {
  const { status, page, pageSize } = req.query;
  const result = await counselorService.getAppointments(req.user.id, { status, page, pageSize });
  return success(res, result);
}

async function updateAppointment(req, res) {
  const result = await counselorService.updateAppointment(
    req.user.id,
    parseInt(req.params.id),
    req.body
  );
  return success(res, result, '预约状态已更新');
}

async function getSessions(req, res) {
  const { status, page, pageSize } = req.query;
  const result = await counselorService.getSessions(req.user.id, { status, page, pageSize });
  return success(res, result);
}

async function createSession(req, res) {
  const result = await counselorService.createSession(req.user.id, req.body);
  return success(res, result, '会话已开始', 201);
}

async function endSession(req, res) {
  const result = await counselorService.endSession(req.user.id, parseInt(req.params.id));
  return success(res, result, '会话已结束');
}

async function createNote(req, res) {
  const result = await counselorService.createNote(
    req.user.id,
    parseInt(req.params.id),
    req.body
  );
  return success(res, result, '笔记已保存', 201);
}

async function getNotes(req, res) {
  const result = await counselorService.getNotes(req.user.id, parseInt(req.params.id));
  return success(res, result);
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
