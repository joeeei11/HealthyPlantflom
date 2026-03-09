const router = require('express').Router();
const schoolController = require('../controllers/school.controller');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const asyncHandler = require('../utils/asyncHandler');

// 所有路由均需认证 + 学校管理角色
router.use(authMiddleware, roleGuard('school'));

// GET  /api/v1/school/stats                   — 平台总览统计
router.get('/stats', asyncHandler(schoolController.getStats));

// GET  /api/v1/school/counselors              — 咨询师列表
router.get('/counselors', asyncHandler(schoolController.getCounselors));

// POST /api/v1/school/counselors              — 添加咨询师账号
router.post('/counselors', asyncHandler(schoolController.createCounselor));

// PUT  /api/v1/school/counselors/:id/status   — 启用/禁用咨询师
router.put('/counselors/:id/status', asyncHandler(schoolController.updateCounselorStatus));

// GET  /api/v1/school/announcements           — 公告列表（含草稿）
router.get('/announcements', asyncHandler(schoolController.getAnnouncements));

// POST /api/v1/school/announcements           — 创建公告
router.post('/announcements', asyncHandler(schoolController.createAnnouncement));

// DELETE /api/v1/school/announcements/:id     — 删除公告
router.delete('/announcements/:id', asyncHandler(schoolController.deleteAnnouncement));

module.exports = router;
