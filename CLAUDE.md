# 大学生心理健康咨询 Web 平台

## 项目概述
面向高校的心理健康咨询平台，支持学生预约咨询、AI 心理助手对话、咨询师管理案例、学校管理数据统计。
三端：学生端 / 咨询师端 / 学校管理端，统一后端 API。

## 技术栈
- 前端：Vue 3 + Vite + Pinia + Vue Router + Axios
- 后端：Node.js + Express + Sequelize ORM
- 数据库：MySQL 8
- AI：DeepSeek API（流式输出，SSE）
- 认证：JWT，三端 role 区分（student / counselor / school）

## 目录结构
```
project-root/
├── backend/
│   ├── src/
│   │   ├── routes/          # 路由定义，只做路由挂载
│   │   ├── controllers/     # 业务逻辑，禁止直接写 SQL
│   │   ├── models/          # Sequelize 模型定义
│   │   ├── middleware/      # JWT 验证、权限控制
│   │   ├── services/        # 业务服务层（含 ai.service.js）
│   │   └── utils/           # 工具函数
│   ├── .env                 # 环境变量（不提交 git）
│   └── app.js
├── frontend/
│   ├── src/
│   │   ├── views/
│   │   │   ├── student/     # 学生端页面
│   │   │   ├── counselor/   # 咨询师端页面
│   │   │   └── school/      # 管理端页面
│   │   ├── stores/          # Pinia 状态
│   │   ├── router/          # Vue Router
│   │   ├── api/             # Axios 封装，按模块拆文件
│   │   └── utils/
│   └── .env                 # 前端环境变量（不提交 git）
├── database/
│   ├── schema.sql           # 禁止修改，仅作参考
│   └── migrations/          # 按序号追加，001_init.sql ...
├── docs/                    # 接口文档
└── tasks/
    ├── current.md           # 当前任务描述（你来维护）
    ├── progress.md          # 进度快照（Claude 维护，/clear 前必须更新）
    └── decisions.md         # 关键决策记录（Claude 维护）
```

## 环境变量

### backend/.env
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mental_health
DB_USER=root
DB_PASSWORD=
JWT_SECRET=
JWT_EXPIRES_IN=7d
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
PORT=3000
```

### frontend/.env
```
VITE_API_BASE_URL=http://localhost:3000
```

## 启动方式
```bash
cd backend && npm run dev    # 运行在 3000 端口
cd frontend && npm run dev   # 运行在 5173 端口
```

## API 规范

### 路由前缀
```
/api/v1/auth/*        # 公共认证（登录、注册、刷新 token）
/api/v1/student/*     # 学生端接口
/api/v1/counselor/*   # 咨询师端接口
/api/v1/school/*      # 管理端接口
```

### 统一响应格式
```json
{ "code": 200, "data": {}, "message": "success" }
{ "code": 400, "data": null, "message": "错误描述" }
```

### 权限中间件用法
```js
router.get('/profile', authMiddleware, roleGuard('student'), controller.getProfile)
// role 取值：student | counselor | school
```

## 开发规范

### 后端
- controller 只负责请求解析和响应，业务逻辑下沉到 service
- 禁止在 controller 里直接调用 Sequelize 模型或写 SQL
- DeepSeek API 统一封装在 `services/ai.service.js`，其他模块不得直接调用
- 流式输出用 SSE（text/event-stream），前端用 EventSource 接收
- 错误统一由全局错误中间件处理，controller 里 throw 即可

### 前端
- 禁止硬编码 API 地址，统一用 `import.meta.env.VITE_API_BASE_URL`
- API 请求统一放在 `src/api/` 目录，按模块拆文件（auth.js / student.js ...）
- 全局状态用 Pinia，组件内临时状态用 ref/reactive
- 路由守卫统一在 `router/index.js` 处理 token 校验和角色跳转

### 数据库
- 禁止修改 `database/schema.sql`
- 新增改动只追加 migration 文件，命名：`001_init.sql`、`002_add_xxx.sql`
- 每个 migration 必须幂等（使用 `IF NOT EXISTS`、`IF EXISTS` 等）

## 任务管理

| 文件 | 维护者 | 时机 |
|------|--------|------|
| tasks/current.md | 你 | 每次开始新任务前手动更新 |
| tasks/progress.md | Claude | 每步完成后，/clear 前必须更新 |
| tasks/decisions.md | Claude | 做了重要技术选择时记录原因 |

每次新 session 开头指令：
```
读 CLAUDE.md、tasks/progress.md 和 tasks/current.md，继续当前任务。
```

每次结束 session 前说：
```
更新 tasks/progress.md 后结束。
```

## 禁止事项
- 不允许修改 `database/schema.sql`
- 不允许在 controller 直接写 SQL 或直接调用 Sequelize 模型
- 不允许在前端硬编码 API 地址
- 不允许在 service 层以外直接调用 DeepSeek API
- 不允许在代码里明文写入任何密钥或密码