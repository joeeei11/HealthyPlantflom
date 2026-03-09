const schoolService = require('../services/school.service');
const { success } = require('../utils/response');

async function getStats(req, res) {
  const result = await schoolService.getStats();
  return success(res, result);
}

async function getCounselors(req, res) {
  const { page, pageSize } = req.query;
  const result = await schoolService.getCounselors({ page, pageSize });
  return success(res, result);
}

async function createCounselor(req, res) {
  const result = await schoolService.createCounselor(req.body);
  return success(res, result, '咨询师账号已创建', 201);
}

async function updateCounselorStatus(req, res) {
  const result = await schoolService.updateCounselorStatus(
    parseInt(req.params.id),
    req.body
  );
  return success(res, result, '状态已更新');
}

async function getAnnouncements(req, res) {
  const { page, pageSize, status } = req.query;
  const result = await schoolService.getAnnouncements({ page, pageSize, status });
  return success(res, result);
}

async function createAnnouncement(req, res) {
  const result = await schoolService.createAnnouncement(req.user.id, req.body);
  return success(res, result, '公告已创建', 201);
}

async function deleteAnnouncement(req, res) {
  const result = await schoolService.deleteAnnouncement(parseInt(req.params.id));
  return success(res, result, '公告已删除');
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
