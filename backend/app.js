require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { connectDB } = require('./src/config/database');
const errorHandler = require('./src/middleware/errorHandler');
const logger = require('./src/utils/logger');

const app = express();

// ── 基础中间件 ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── 请求日志 ─────────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ── 路由挂载 ─────────────────────────────────────────────────────────────────
const authRouter      = require('./src/routes/auth.routes');
const studentRouter   = require('./src/routes/student.routes');
const counselorRouter = require('./src/routes/counselor.routes');
const schoolRouter    = require('./src/routes/school.routes');
const aiRouter        = require('./src/routes/ai.routes');

app.use('/api/v1/auth',       authRouter);
app.use('/api/v1/student/ai', aiRouter);       // 更具体的路径优先挂载
app.use('/api/v1/student',    studentRouter);
app.use('/api/v1/counselor',  counselorRouter);
app.use('/api/v1/school',     schoolRouter);

// ── 健康检查 ────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ code: 200, data: null, message: 'ok' });
});

// ── 404 兜底 ─────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ code: 404, data: null, message: '接口不存在' });
});

// ── 全局错误中间件（必须放最后）────────────────────────────────────────────
app.use(errorHandler);

// ── 启动 ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    logger.info(`[server] running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  logger.error('[server] startup failed', { message: err.message });
  process.exit(1);
});

module.exports = app;
