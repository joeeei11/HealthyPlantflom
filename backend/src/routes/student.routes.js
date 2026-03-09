const router = require('express').Router();
const studentController = require('../controllers/student.controller');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const asyncHandler = require('../utils/asyncHandler');

// 所有路由均需认证 + 学生角色
router.use(authMiddleware, roleGuard('student'));

// GET  /api/v1/student/profile       — 查看个人信息
router.get('/profile', asyncHandler(studentController.getProfile));

// PUT  /api/v1/student/profile       — 更新/创建个人档案
router.put('/profile', asyncHandler(studentController.updateProfile));

// GET  /api/v1/student/counselors    — 获取可预约咨询师列表
router.get('/counselors', asyncHandler(studentController.getCounselors));

// GET  /api/v1/student/appointments  — 我的预约列表
router.get('/appointments', asyncHandler(studentController.getAppointments));

// POST /api/v1/student/appointments  — 发起预约
router.post('/appointments', asyncHandler(studentController.createAppointment));

// DELETE /api/v1/student/appointments/:id — 取消预约
router.delete('/appointments/:id', asyncHandler(studentController.cancelAppointment));

// POST /api/v1/student/feedback      — 提交咨询评价
router.post('/feedback', asyncHandler(studentController.submitFeedback));

// GET  /api/v1/student/announcements — 查看已发布公告
router.get('/announcements', asyncHandler(studentController.getAnnouncements));

module.exports = router;
