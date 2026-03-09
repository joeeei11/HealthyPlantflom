const studentService = require('../services/student.service');
const { success } = require('../utils/response');

async function getProfile(req, res) {
  const result = await studentService.getProfile(req.user.id);
  return success(res, result);
}

async function updateProfile(req, res) {
  const result = await studentService.updateProfile(req.user.id, req.body);
  return success(res, result, '个人信息更新成功');
}

async function getCounselors(req, res) {
  const { keyword } = req.query;
  const result = await studentService.getCounselors({ keyword });
  return success(res, result);
}

async function createAppointment(req, res) {
  const result = await studentService.createAppointment(req.user.id, req.body);
  return success(res, result, '预约提交成功', 201);
}

async function getAppointments(req, res) {
  const { status, page, pageSize } = req.query;
  const result = await studentService.getAppointments(req.user.id, { status, page, pageSize });
  return success(res, result);
}

async function cancelAppointment(req, res) {
  const result = await studentService.cancelAppointment(
    req.user.id,
    parseInt(req.params.id),
    req.body
  );
  return success(res, result, '预约已取消');
}

async function submitFeedback(req, res) {
  const result = await studentService.submitFeedback(req.user.id, req.body);
  return success(res, result, '评价提交成功', 201);
}

async function getAnnouncements(req, res) {
  const { page, pageSize } = req.query;
  const result = await studentService.getAnnouncements({ page, pageSize });
  return success(res, result);
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
