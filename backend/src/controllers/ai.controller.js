const aiService = require('../services/ai.service');
const { success } = require('../utils/response');

async function createConversation(req, res) {
  const { title } = req.body;
  const conversation = await aiService.createConversation(req.user.id, title);
  return success(res, conversation, '对话创建成功', 201);
}

async function getConversations(req, res) {
  const { page, pageSize } = req.query;
  const result = await aiService.getConversations(req.user.id, { page, pageSize });
  return success(res, result);
}

async function getMessages(req, res) {
  const conversationId = parseInt(req.params.id);
  const messages = await aiService.getMessages(req.user.id, conversationId);
  return success(res, messages);
}

// SSE 流式接口：aiService.sendMessage 自行管理响应头和响应体，无需调用 success()
async function sendMessage(req, res) {
  const conversationId = parseInt(req.params.id);
  const { content } = req.body;
  await aiService.sendMessage(req.user.id, conversationId, content, res);
}

module.exports = { createConversation, getConversations, getMessages, sendMessage };
