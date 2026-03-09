const router = require('express').Router();
const counselorController = require('../controllers/counselor.controller');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const asyncHandler = require('../utils/asyncHandler');

// 所有路由均需认证 + 咨询师角色
router.use(authMiddleware, roleGuard('counselor'));

// GET  /api/v1/counselor/profile       — 查看个人档案
router.get('/profile', asyncHandler(counselorController.getProfile));

// PUT  /api/v1/counselor/profile       — 更新/创建档案（含可预约时段）
router.put('/profile', asyncHandler(counselorController.updateProfile));

// GET  /api/v1/counselor/appointments  — 预约列表
router.get('/appointments', asyncHandler(counselorController.getAppointments));

// PUT  /api/v1/counselor/appointments/:id — 确认/拒绝预约
router.put('/appointments/:id', asyncHandler(counselorController.updateAppointment));

// GET  /api/v1/counselor/sessions      — 历史会话列表
router.get('/sessions', asyncHandler(counselorController.getSessions));

// POST /api/v1/counselor/sessions      — 开始新会话
router.post('/sessions', asyncHandler(counselorController.createSession));

// PUT  /api/v1/counselor/sessions/:id  — 结束会话
router.put('/sessions/:id', asyncHandler(counselorController.endSession));

// POST /api/v1/counselor/sessions/:id/notes — 添加案例笔记
router.post('/sessions/:id/notes', asyncHandler(counselorController.createNote));

// GET  /api/v1/counselor/sessions/:id/notes — 获取案例笔记
router.get('/sessions/:id/notes', asyncHandler(counselorController.getNotes));

module.exports = router;
