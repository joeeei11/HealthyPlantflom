const router = require('express').Router();
const aiController = require('../controllers/ai.controller');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const asyncHandler = require('../utils/asyncHandler');

// 所有路由均需认证 + 学生角色
router.use(authMiddleware, roleGuard('student'));

// POST /api/v1/student/ai/conversations         — 新建对话
router.post('/conversations', asyncHandler(aiController.createConversation));

// GET  /api/v1/student/ai/conversations         — 对话列表（分页）
router.get('/conversations', asyncHandler(aiController.getConversations));

// GET  /api/v1/student/ai/conversations/:id/messages — 消息历史
router.get('/conversations/:id/messages', asyncHandler(aiController.getMessages));

// POST /api/v1/student/ai/conversations/:id/messages — 发送消息（SSE 流式）
router.post('/conversations/:id/messages', asyncHandler(aiController.sendMessage));

module.exports = router;
