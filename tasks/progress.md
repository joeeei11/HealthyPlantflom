# 进度快照

## 最后更新：2026-03-09（阶段 14 完成 + Bug 修复）

## 已完成

### 脚手架初始化 + 依赖安装（2026-03-09）
- [x] 创建完整目录结构（backend/src/* / frontend/src/* / database/migrations/ / docs/）
- [x] `backend/package.json` — Express 4、Sequelize 6、JWT、bcryptjs、cors、dotenv、multer、nodemon
- [x] `backend/app.js` — Express 基础结构，CORS、全局错误中间件、健康检查路由
- [x] `backend/.env.example` / `backend/.env` — 已复制，待填写真实值
- [x] `frontend/package.json` — Vite 5、Vue 3、Pinia、Vue Router 4、Axios
- [x] `frontend/vite.config.js` — @ 别名、开发代理（/api → localhost:3000）
- [x] `frontend/.env.example` / `frontend/.env` — 已复制
- [x] `database/schema.sql` — 占位注释文件
- [x] `.gitignore` — node_modules、.env、dist、日志、系统文件
- [x] `docker-compose.yml` — MySQL 8（备用，本机已有 MySQL 8.4，无需启动）
- [x] `backend npm install` — 161 包，0 漏洞
- [x] `frontend npm install` — 58 包，2 个中等级漏洞（开发依赖，不影响功能）

### 数据库 Schema 设计（2026-03-09）
- [x] `database/migrations/001_init.sql` — 10 张表，全部幂等（CREATE TABLE IF NOT EXISTS）
  - `users` — 统一用户表，role ENUM(student/counselor/school)
  - `student_profiles` — 学生扩展信息，1:1 users
  - `counselor_profiles` — 咨询师扩展信息，含 specialties/availableSlots JSON 字段
  - `appointments` — 预约记录，student_id + counselor_id + date + time + status
  - `sessions` — 实际咨询会话，1:1 appointments（可为空）
  - `session_notes` — 咨询师案例笔记，含 risk_level 危机评估字段
  - `ai_conversations` — AI 对话会话，1:N ai_messages
  - `ai_messages` — AI 消息，role ENUM(user/assistant)
  - `announcements` — 学校公告，支持草稿/发布/过期/置顶
  - `feedback` — 学生评价，1:1 sessions，1-5 星评分
- [x] `database/schema.sql` — 更新为 ER 说明、表关系、索引策略注释（无 SQL）
- [x] 外键关系完整，高频查询场景均有索引覆盖

### 数据库执行（2026-03-09）
- [x] `backend/.env` — DB_PASSWORD 已填写真实值
- [x] 数据库 `mental_health` 创建成功（MySQL 8.4.8，utf8mb4）
- [x] `001_init.sql` 执行成功，10 张表 + 15 个外键约束全部创建
- [x] 幂等性验证通过（重复执行无报错）

### 后端基础架构（2026-03-09）
- [x] `backend/src/config/database.js` — Sequelize 实例初始化，连接池配置，`connectDB()` 函数
- [x] `backend/src/utils/response.js` — `success(res, data, message, code)` / `fail(res, message, code)`
- [x] `backend/src/utils/jwt.js` — `signToken(payload)` / `verifyToken(token)`
- [x] `backend/src/utils/logger.js` — info/warn/error，带时间戳，生产环境关 info
- [x] `backend/src/middleware/auth.js` — JWT Bearer Token 验证，失败返回 401
- [x] `backend/src/middleware/roleGuard.js` — `roleGuard('student'|'counselor'|'school')` 角色权限
- [x] `backend/src/middleware/errorHandler.js` — 全局错误处理，Sequelize 验证错误特殊处理
- [x] `backend/app.js` — 完整版，接入 connectDB、请求日志、404兜底、errorHandler
- [x] 验证通过：`npm run dev` 启动无报错，MySQL 连接成功，`/health` 返回标准格式，404 返回标准格式

### 用户认证模块（2026-03-09）
- [x] `backend/src/utils/asyncHandler.js` — async 路由包装器，自动将 rejected Promise 转给 errorHandler
- [x] `backend/src/models/User.js` — Sequelize 模型，对应 users 表，underscored:true 自动映射 snake_case
- [x] `backend/src/services/auth.service.js` — register / login / refreshToken / getMe，bcrypt 密码哈希
- [x] `backend/src/controllers/auth.controller.js` — 调用 service，返回统一响应，只做 req/res 处理
- [x] `backend/src/routes/auth.routes.js` — 4 条路由，asyncHandler 包装，/me 路由带 authMiddleware
- [x] `backend/app.js` — 取消注释挂载 authRouter 到 `/api/v1/auth`
- [x] `backend/.env` — JWT_SECRET 已更新为随机 128-hex 字符串
- [x] 全部接口测试通过：注册 201、登录 200、/me 200（无 passwordHash）、refresh 200、无 token 401、重复注册 400

### 学生端 API（2026-03-09）
- [x] `backend/src/models/StudentProfile.js` — student_profiles 表映射
- [x] `backend/src/models/CounselorProfile.js` — counselor_profiles 表映射（含 specialties/availableSlots JSON）
- [x] `backend/src/models/Appointment.js` — appointments 表映射，appointmentDate 用 DATEONLY，startTime/endTime 用 STRING(8)
- [x] `backend/src/models/Session.js` — sessions 表映射（为 feedback 关联准备）
- [x] `backend/src/models/Feedback.js` — feedback 表映射，rating 含 validate min/max
- [x] `backend/src/models/index.js` — 统一加载所有模型 + 设置 Sequelize 关联（hasOne/belongsTo）
- [x] `backend/src/services/student.service.js` — 7 个业务函数全部实现
- [x] `backend/src/controllers/student.controller.js` — 7 个 controller 方法
- [x] `backend/src/routes/student.routes.js` — 7 条路由，全部 authMiddleware + roleGuard('student')
- [x] `backend/app.js` — 挂载 studentRouter 到 `/api/v1/student`
- [x] 全部接口测试通过（详见下方测试结果）

### 咨询师端 API（2026-03-09）
- [x] `backend/src/models/SessionNote.js` — session_notes 表映射（riskLevel ENUM、followUpRequired、isPrivate）
- [x] `backend/src/models/index.js` — 追加 SessionNote，添加 Session hasMany SessionNote 关联
- [x] `backend/src/services/counselor.service.js` — 9 个业务函数全部实现
- [x] `backend/src/controllers/counselor.controller.js` — 9 个 controller 方法
- [x] `backend/src/routes/counselor.routes.js` — 9 条路由，全部 authMiddleware + roleGuard('counselor')
- [x] `backend/app.js` — 挂载 counselorRouter 到 `/api/v1/counselor`
- [x] 全部接口测试通过（21 个测试场景）

### 学校管理端 API（2026-03-09）
- [x] `backend/src/models/Announcement.js` — announcements 表映射（targetRole ENUM、isPinned、publishedAt/expiresAt 可空）
- [x] `backend/src/models/index.js` — 追加 Announcement，添加 Announcement belongsTo User(author) 关联
- [x] `backend/src/services/school.service.js` — 7 个业务函数全部实现
- [x] `backend/src/controllers/school.controller.js` — 7 个 controller 方法
- [x] `backend/src/routes/school.routes.js` — 7 条路由，全部 authMiddleware + roleGuard('school')
- [x] `backend/app.js` — 取消注释，挂载 schoolRouter 到 `/api/v1/school`
- [x] 全部接口测试通过

### AI 对话模块（2026-03-09）
- [x] `backend/src/models/AiConversation.js` — ai_conversations 表映射（studentId, title, status ENUM(active/archived)）
- [x] `backend/src/models/AiMessage.js` — ai_messages 表映射，updatedAt: false（该表无 updated_at 列）
- [x] `backend/src/models/index.js` — 追加 AiConversation + AiMessage，设置 hasMany/belongsTo 关联
- [x] `backend/src/services/ai.service.js` — DeepSeek API 封装，系统 Prompt（心理健康场景），SSE 流式输出
- [x] `backend/src/controllers/ai.controller.js` — 4 个 controller 方法
- [x] `backend/src/routes/ai.routes.js` — 4 条路由，全部 authMiddleware + roleGuard('student')
- [x] `backend/app.js` — 挂载 aiRouter 到 `/api/v1/student/ai`
- [x] 全部接口测试通过

### 前端基础架构（阶段 9）（2026-03-09）
- [x] `frontend/index.html` — Vite 项目入口 HTML
- [x] `frontend/src/main.js` — 挂载 Vue、Pinia、Router
- [x] `frontend/src/App.vue` — 根组件（RouterView）
- [x] `frontend/src/utils/request.js` — Axios 实例，请求拦截加 token，响应拦截处理 401 自动跳登录
- [x] `frontend/src/api/auth.js` — register/login/getMe/refreshToken
- [x] `frontend/src/api/student.js` — 学生端所有接口
- [x] `frontend/src/api/counselor.js` — 咨询师端所有接口
- [x] `frontend/src/api/school.js` — 管理端所有接口
- [x] `frontend/src/api/ai.js` — AI 对话接口（含 fetch POST SSE 处理，返回 abort 函数）
- [x] `frontend/src/stores/auth.js` — Pinia auth store（token/user/isLoggedIn/role + login/fetchMe/logout，localStorage 持久化）
- [x] `frontend/src/router/index.js` — 三端路由分组，路由守卫（未登录跳 /login，角色不匹配跳对应首页，已登录访问 /login 跳首页）
- [x] `frontend/src/views/Login.vue` — 统一登录页，角色选择 Tab，注册弹窗（仅学生），完整样式
- [x] `frontend/src/layouts/StudentLayout.vue` — 学生端侧边栏（紫色主题）+ RouterView
- [x] `frontend/src/layouts/CounselorLayout.vue` — 咨询师端侧边栏（绿色主题）+ RouterView
- [x] `frontend/src/layouts/SchoolLayout.vue` — 管理端侧边栏（深蓝/红主题）+ RouterView
- [x] 三端占位视图（Dashboard/Profile/Counselors/Appointments/AIChat/Sessions/Announcements）
- [x] `vite build` 构建通过，0 错误

### 学生端页面（阶段 10）（2026-03-09）
- [x] `views/student/Dashboard.vue` — 欢迎页：今日日期、预约状态统计（4 张卡片）、近期预约列表（最新 5 条）、快速操作入口
- [x] `views/student/Profile.vue` — 个人档案：账号信息（只读）+ 个人信息（查看/编辑双模式），表格字段含姓名/学号/性别/年级/专业/学院/手机/紧急联系人
- [x] `views/student/Counselors.vue` — 咨询师列表：按姓名关键字搜索，卡片展示（头像/姓名/职称/专长标签/简介），点击打开预约弹窗；预约弹窗含日期选择（明天起），基于 availableSlots 动态展示可选时段，预约方式/说明选填
- [x] `views/student/Appointments.vue` — 我的预约：状态 Tab 筛选（全部/待确认/已确认/已完成/已取消），预约卡片含咨询师信息/时间/方式/说明/取消原因，取消弹窗带原因输入，分页支持
- [x] `views/student/AIChat.vue` — AI 对话：左栏对话列表（新建/选择），右栏流式聊天（SSE 逐字渲染/停止按钮/自动滚底/cursor 动效），onUnmounted 清理 SSE 连接
- [x] `api/student.js` — cancelAppointment 更新支持传 body（DELETE 请求用 `{ data }` 参数）
- [x] `vite build` 构建通过，0 错误，所有 5 个页面均成功打包

### 咨询师端页面（阶段 11）（2026-03-09）
- [x] `views/counselor/Dashboard.vue` — 工作台：4 张统计卡（待确认/已确认预约、进行中/已完成会话），待确认预约列表（含快速确认/拒绝），进行中会话列表，快速操作入口；4 并发 API 请求
- [x] `views/counselor/Profile.vue` — 个人档案：账号信息（只读），基本信息编辑（realName/gender/title/qualification/bio/phone/isAccepting/maxPerDay），擅长方向 Tag 增删保存，可预约时段按星期管理（增删 HH:MM-HH:MM 格式时段，独立保存）
- [x] `views/counselor/Appointments.vue` — 预约管理：状态 Tab 筛选，学生信息卡片，确认/拒绝（弹窗带原因输入），已确认预约一键"开始会话"（调 createSession API 后跳转会话详情），分页
- [x] `views/counselor/Sessions.vue` — 会话列表：状态 Tab 筛选，会话卡片（学生信息/状态/时间/关联预约），"结束会话"弹窗确认，"查看详情"跳转，分页
- [x] `views/counselor/SessionDetail.vue` — 会话详情（新增文件）：via history.state 获取 session，展示学生信息和会话状态，进行中可结束会话，案例笔记列表，新建笔记表单（content/riskLevel/followUpRequired/isPrivate），保存成功 toast 提示
- [x] `router/index.js` — 新增 `/counselor/sessions/:id` → `CounselorSessionDetail` 路由
- [x] `vite build` 构建通过，0 错误，119 模块全部编译

### 学校管理端页面（阶段 12）（2026-03-09）
- [x] `views/school/Dashboard.vue` — 数据总览：5 张统计卡（学生数/咨询师数/预约数/已完成会话数/平均评分），快速操作入口（咨询师管理/公告管理），平台说明
- [x] `views/school/Counselors.vue` — 咨询师管理：列表（含 realName/职称/擅长方向/接诊状态/账号状态/最后登录），启用/禁用一键切换，添加咨询师弹窗（username/email/password/realName），分页
- [x] `views/school/Announcements.vue` — 公告管理：状态 Tab 筛选（全部/已发布/草稿），公告列表（置顶/发布状态/目标受众/摘要/作者/时间），新建弹窗（title/content/targetRole/isPinned/publish/expiresAt），删除确认弹窗，分页
- [x] `vite build` 构建通过，0 错误，120 模块全部编译

### 联调与收尾（阶段 13）（2026-03-09）
- [x] `docs/api.md` — 全量接口文档（31 个端点，含入参/出参/错误码/示例）
- [x] console.log 检查通过（仅 database.js 连接日志 + logger.js 内部实现，均为合理用途）
- [x] `backend/.env.example` 完整（9 个变量）
- [x] `frontend/.env.example` 完整
- [x] `.gitignore` 覆盖所有敏感文件（node_modules/.env/dist/logs/mysql_data 等）
- [x] 全流程端到端联调通过：
  - 学校管理员创建咨询师账号 ✓
  - 咨询师登录并设置档案（时段/专长/接受预约）✓
  - 学生注册并浏览咨询师列表 ✓
  - 学生发起预约（时段冲突/每日上限校验正常）✓
  - 咨询师确认预约 ✓
  - 咨询师开始会话（预约自动标记 completed）✓
  - 咨询师添加案例笔记 ✓
  - 咨询师结束会话 ✓
  - 学生提交评价（5 星）✓
  - 学校管理端查看统计数据（学生数/咨询师数/预约数/完成会话数/平均评分）✓
  - AI 对话新建/列表/消息历史/SSE 流式输出 ✓
  - 公告创建/发布/列表 ✓
- [x] 前端 dist/ 构建产物存在（上次构建 0 错误，120 模块）

## 项目完成状态
**全部完成 + Bug 修复（含编码加固）。** 阶段 1–13 全部通过，后端 API、前端三端页面、AI 助手、端到端联调均已验证。中文编码问题已彻底解决。

### Bug 修复（2026-03-09）
- [x] 登录字段名不匹配 Bug 已修复
  - **原因**：`Login.vue` 发送 `{ username, password }`，后端 `auth.service.js` 只接收 `{ email, password }`
  - **修复**：`auth.service.js` login() 改为接受 username 或 email，用 `Op.or` 查询（`{ email: identifier } OR { username: identifier }`）
  - **修复**：`auth.controller.js` login() 也同时解构 username 和 email
  - **测试**：用户名登录 200 ✓，邮箱登录 200 ✓
- [!] 注册接口 404 说明：后端注册接口代码正确，实测 201 成功。发现系统上有一个**旧版后端实例运行在 3001 端口**（没有 auth 路由），若前端 `.env` 曾配置错误端口则会遇到 404

### Bug 修复（2026-03-09，续）
- [x] 注册弹窗角色选项不完整 Bug 已修复
  - **原因**：`Login.vue` 注册弹窗的 `<select>` 只有 `<option value="student">` 一个选项
  - **修复**：补充 `<option value="counselor">咨询师</option>` 和 `<option value="school">学校管理员</option>`
  - 后端无角色白名单限制，数据库 ENUM 已包含全部三种值，前端一行修复即可生效
  - 采用方案 A（三种角色均可公开注册，适合开发测试阶段）

### Bug 修复（2026-03-09，续二 + 续三）
- [x] 中文乱码根因重新分析 + 加固
  - **根因**：乱码数据是通过非 API 路径（如 MySQL Workbench 用 GBK/latin1 直连）写入的历史数据；"李咨询师"通过 API 写入因此正确
  - **加固 1**：`dialectOptions.charset: 'utf8mb4'`（已有）
  - **加固 2**：`dialectOptions.dateStrings: ['DATE']`（新增）— 让 mysql2 以字符串而非 JS Date 对象返回 DATE 列，消除 DATEONLY + timezone 时区偏移
  - **加固 3**：`afterConnect` hook（新增）— 每个连接池连接建立后强制执行 `SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci`
- [x] `0001-01-01` 异常日期根因
  - 原因：mysql2 默认把 DATE 列解析为 JS Date 对象，配合 `timezone: '+08:00'` 会造成日期偏移/归零
  - 修复：`dateStrings: ['DATE']` 阻断 Date 对象转换
- [x] `database/migrations/002_cleanup_corrupted_data.sql` 创建
  - 提供清理脚本：删除 `appointment_date < '2000-01-01'` 的无效预约
  - 提供清理脚本：删除 `real_name` 含乱码字节（HEX 包含 EFBFBD）的 counselor_profiles
  - 删除后需在 web UI 重新创建受影响的咨询师账号

### Bug 修复（2026-03-09，续四）
- [x] 学校管理端公告乱码清除
  - 删除 `announcements` 表中 `HEX(title/content) LIKE '%EFBFBD%'` 的乱码记录
  - 重启后端后通过 Web UI 重新创建公告，显示正常
- [x] 全部乱码问题已解决，验证通过

### Bug 修复（2026-03-09，续五）
- [x] 学生档案保存 500 错误：`Data truncated for column 'gender'`
  - **根因**：前端 `form.gender` 初始化为 `''`（空字符串），`saveProfile()` 将全部 form 字段（含 `gender: ''`）一并发送；service 层过滤条件 `data[key] !== undefined` 让 `''` 通过，导致 MySQL 尝试向 ENUM('male','female','other') 列插入空字符串，触发 `Data truncated` 错误
  - **修复**：`student.service.js` `updateProfile()` 过滤条件改为 `data[key] !== undefined && data[key] !== ''`，空字符串视同"未提供"跳过，不写入数据库
  - **影响**：首次创建 profile 且未选择性别时，gender 列为 null（允许空值）；后续编辑未修改性别字段时，gender 保持原值不变

### 学生端公告查看功能（阶段 14）（2026-03-09）
- [x] `backend/src/services/student.service.js` — 新增 `getAnnouncements({ page, pageSize })`，过滤条件：`publishedAt IS NOT NULL`、`targetRole IN ('all','student')`、`expiresAt IS NULL OR expiresAt > now`，按 isPinned DESC / publishedAt DESC 排序，分页
- [x] `backend/src/controllers/student.controller.js` — 新增 `getAnnouncements` 方法
- [x] `backend/src/routes/student.routes.js` — 新增 `GET /api/v1/student/announcements`
- [x] `frontend/src/api/student.js` — 新增 `getAnnouncements(params)` 接口封装
- [x] `frontend/src/views/student/Dashboard.vue` — 首页新增"最新公告"区域，显示最新 3 条，并发请求（Promise.all），含置顶标记和发布日期
- [x] `frontend/src/views/student/Announcements.vue` — 新建全量公告列表页，支持分页，置顶公告左侧高亮橙色边框
- [x] `frontend/src/router/index.js` — 新增 `/student/announcements` 子路由 → `StudentAnnouncements`
- [x] `frontend/src/layouts/StudentLayout.vue` — 侧边栏新增"📢 学校公告"导航入口
- [x] `vite build` 构建通过，0 错误，122 模块全部编译

### Bug 修复（2026-03-09，续六）
- [x] 预约 `type` 字段 `Data truncated` 错误
  - **根因**：`Counselors.vue` 预约方式 `<select>` 含 `value="phone"` 选项，但 `appointments.type` ENUM 只有 `'online'`/`'offline'`，写入非法值触发 MySQL 截断错误
  - **修复**：删除 `<option value="phone">电话</option>`，前端选项与数据库 ENUM 保持一致
  - 与之前 `gender` 字段乱码 bug 同类问题（前端表单值超出 ENUM 范围）

### Bug 修复（2026-03-09，续七）
- [x] 创建会话 `sessions.type` 字段 `Data truncated` 错误
  - **根因**：`Appointments.vue` `startSession()` 直接把 `apt.type`（`appointments.type` ENUM：`'online'/'offline'`）传给 `createSession` 的 `type` 字段，而 `sessions.type` ENUM 只有 `'individual'/'online'`，`'offline'` 是非法值
  - **修复**：在调用前映射：`apt.type === 'online' ? 'online' : 'individual'`（线下面谈 = 个体咨询）
  - **文件**：`frontend/src/views/counselor/Appointments.vue` 第 245-250 行
  - **构建**：vite build 通过，0 错误，122 模块

### Bug 修复（2026-03-09，续八）
- [x] 咨询师端会话详情"数据不可用"Bug 修复
  - **根因**：`Sessions.vue` / `Dashboard.vue` 的 `goToDetail(session)` / `goToSession(session)` 把 Vue 3 **reactive Proxy**（`v-for` 中的列表项）直接传给 `router.push({ state: { session } })`；Vue Router 内部调用 `history.pushState` 时，浏览器 Structured Clone Algorithm 对包含嵌套 Proxy（Vue reactive 的 `get` trap 对嵌套对象会返回新 Proxy）的对象可能序列化失败，Vue Router 捕获后会 fallback 到 `location.assign(url)`，导致整页刷新；刷新后 `history.state.session` 为 null，SessionDetail 显示"数据不可用"
  - **修复**：在导航前加 `JSON.parse(JSON.stringify(session))` 进行深度 JSON 序列化，将 reactive Proxy 转为纯 POJO，保证 `history.pushState` 序列化成功
  - **文件**：`frontend/src/views/counselor/Sessions.vue`（`goToDetail`）/ `Dashboard.vue`（`goToSession`）
  - `Appointments.vue` 的 `startSession` 无需修改（`res.data` 已是 Axios 返回的纯对象）
  - **构建**：vite build 通过，0 错误，122 模块

### 学生端评分功能（阶段 15）（2026-03-10）
- [x] `backend/src/models/index.js` — 新增 `Appointment.hasOne(Session, as:'session')` + `Session.hasOne(Feedback, as:'feedback')` 反向关联
- [x] `backend/src/services/student.service.js` — `getAppointments()` 改为同时 include Session（required:false）及其 Feedback（required:false），返回 `apt.session.id` + `apt.session.feedback`
- [x] `frontend/src/views/student/Appointments.vue` — 完整评分功能：
  - 已完成预约 + 有 session + 未评价 → 显示紫色"评分"按钮
  - 已评价 → 显示金色星级 + "已评价" + 评价摘要（绿色背景栏）
  - 评分弹窗：5 星点选（悬停高亮/放大）+ 文字评价（选填）+ 匿名勾选
  - 提交成功后重新加载列表，按钮自动变为已评价状态
  - `vite build` 通过，0 错误，122 模块

## 当前阻塞
无。

## 待办 / 已知缺失
- 咨询师端暂无修改密码功能
- 管理端暂无编辑已发布公告功能
- 前端页面样式细节尚未验证（功能逻辑完整）
- 未实现头像上传功能（`multer` 已安装但接口未实现）
- 系统上有残留的旧版后端实例（端口 3000/3001），建议重启时统一清理
