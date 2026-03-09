const { AiConversation, AiMessage } = require('../models');

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const MODEL = 'deepseek-chat';

const SYSTEM_PROMPT = `你是一位专业的大学心理健康助手，名叫"心语"。你的职责是：
1. 倾听学生的心理困扰，提供情感支持和心理疏导
2. 引导学生建立积极健康的心态，分享有效的心理调节方法
3. 对于普通的情绪问题（如学业压力、人际关系困扰、焦虑、低落），提供专业的心理支持
4. 对于严重的心理危机（如有自伤、自杀的念头或行为），必须立即建议学生联系专业心理咨询师或拨打心理援助热线（如：全国心理援助热线 400-161-9995）
5. 保持温暖、耐心、不评判的态度，让学生感到被理解和接纳

注意事项：
- 不要做出诊断或提供医疗建议
- 不要扮演心理治疗师的角色，只提供心理支持和疏导
- 如果学生描述有危机迹象，务必引导他们寻求专业帮助
- 用简洁、温暖的语言回复，避免使用过于专业的术语
- 每次回复保持在合理的长度，不要过于冗长`;

/**
 * 新建 AI 对话
 */
async function createConversation(studentId, title) {
  const conversation = await AiConversation.create({
    studentId,
    title: title || null,
    status: 'active',
  });
  return conversation.toJSON();
}

/**
 * 获取对话列表（分页，按最近更新排序）
 */
async function getConversations(studentId, { page = 1, pageSize = 20 } = {}) {
  const limit = Math.max(1, parseInt(pageSize) || 20);
  const offset = (Math.max(1, parseInt(page) || 1) - 1) * limit;

  const { count, rows } = await AiConversation.findAndCountAll({
    where: { studentId },
    order: [['updatedAt', 'DESC']],
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
 * 获取对话消息历史
 */
async function getMessages(studentId, conversationId) {
  const conversation = await AiConversation.findByPk(conversationId);
  if (!conversation) {
    const err = new Error('对话不存在');
    err.status = 404;
    throw err;
  }
  if (conversation.studentId !== studentId) {
    const err = new Error('无权访问此对话');
    err.status = 403;
    throw err;
  }

  const messages = await AiMessage.findAll({
    where: { conversationId },
    order: [['createdAt', 'ASC']],
  });
  return messages.map(m => m.toJSON());
}

/**
 * 发送消息（流式 SSE 输出）
 * 在调用 res.flushHeaders() 之前的错误会抛出（由 asyncHandler 转给 errorHandler）；
 * flushHeaders 之后的错误通过 SSE error 事件通知前端。
 *
 * @param {number} studentId
 * @param {number} conversationId
 * @param {string} content - 用户消息内容
 * @param {object} res - Express response 对象
 */
async function sendMessage(studentId, conversationId, content, res) {
  if (!content || !content.trim()) {
    const err = new Error('消息内容不能为空');
    err.status = 400;
    throw err;
  }

  const conversation = await AiConversation.findByPk(conversationId);
  if (!conversation) {
    const err = new Error('对话不存在');
    err.status = 404;
    throw err;
  }
  if (conversation.studentId !== studentId) {
    const err = new Error('无权访问此对话');
    err.status = 403;
    throw err;
  }

  // 保存用户消息
  await AiMessage.create({
    conversationId,
    role: 'user',
    content: content.trim(),
  });

  // 若对话无标题，截取首条消息前 30 字作为标题
  if (!conversation.title) {
    await conversation.update({ title: content.trim().slice(0, 30) });
  }

  // 获取历史消息（最近 20 条，含刚保存的用户消息）
  const history = await AiMessage.findAll({
    where: { conversationId },
    order: [['createdAt', 'ASC']],
    limit: 20,
  });

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map(m => ({ role: m.role, content: m.content })),
  ];

  // ── 设置 SSE 响应头（从此之后错误不再抛出，改为写入 SSE error 事件）──
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey || apiKey === 'your_deepseek_api_key_here') {
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'AI 服务未配置，请联系管理员' })}\n\n`);
    res.end();
    return;
  }

  let assistantContent = '';
  let tokensUsed = null;

  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: MODEL, messages, stream: true }),
    });

    if (!response.ok) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'AI 服务暂时不可用，请稍后重试' })}\n\n`);
      res.end();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // 保留未完整的最后一行

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (!trimmed.startsWith('data:')) continue;

        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') break;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            assistantContent += delta;
            res.write(`data: ${JSON.stringify({ type: 'delta', content: delta })}\n\n`);
          }
          if (parsed.usage?.completion_tokens) {
            tokensUsed = parsed.usage.completion_tokens;
          }
        } catch {
          // 忽略无法解析的行
        }
      }
    }
  } catch {
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'AI 服务连接失败，请检查网络' })}\n\n`);
    res.end();
    return;
  }

  // 保存助手回复
  if (assistantContent) {
    await AiMessage.create({
      conversationId,
      role: 'assistant',
      content: assistantContent,
      tokensUsed,
    });
    // 触发对话 updatedAt 刷新（用于列表排序）
    await AiConversation.update({ updatedAt: new Date() }, { where: { id: conversationId } });
  }

  res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
  res.end();
}

module.exports = { createConversation, getConversations, getMessages, sendMessage };
