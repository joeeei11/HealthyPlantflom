# 关键技术决策记录

## 2026-03-09

### 1. 不使用 Docker，直接连本机 MySQL
**背景**：docker-compose.yml 已创建，但执行时发现系统未安装 Docker。
**决策**：使用本机已有的 MySQL 8.4（Community Server），跳过 docker-compose up。
**影响**：docker-compose.yml 保留以便团队其他成员使用 Docker 环境；本机开发直接配置 backend/.env 中的 DB_* 变量连接本地 MySQL。

### 2. multer 版本选择
**背景**：multer 1.x 存在已知漏洞，npm warn 提示升级到 2.x。
**决策**：暂时保留 1.4.5-lts.2（package.json 中写的 1.4.5-lts.1，安装时自动取最新 lts 补丁）。
**原因**：multer 2.x API 有 breaking change，当前阶段尚未实现文件上传功能，等到实际编写上传相关代码时再升级并适配新 API。

### 3. vite.config.js 开发代理
**背景**：前端运行在 5173，后端在 3000，跨域问题。
**决策**：vite 开发服务器配置 `/api` 代理到 `localhost:3000`，同时后端 CORS 允许 `localhost:5173`。
**影响**：前端 api/ 模块请求路径以 `/api/v1/...` 为准，无需在开发时暴露后端端口。

### 4. 用户表设计：单表 + 扩展表，不拆分多表
**背景**：三端（student/counselor/school）用户信息差异大，有两种方案：①单 users 表 + 扩展表；②三张独立用户表。
**决策**：选方案①，`users` 表统一存认证信息（username、email、password_hash、role），扩展信息分存 `student_profiles` / `counselor_profiles`，school 角色无扩展表。
**原因**：JWT 认证只需查 `users` 表，不需要多表 JOIN；扩展信息按需懒加载；角色切换（如教师兼任管理员）未来更易扩展。

### 5. counselor_profiles 用 JSON 存储非结构化字段
**背景**：咨询师的"擅长方向"（specialties）和"可预约时段"（available_slots）是可变长度的复杂结构。
**决策**：使用 MySQL 8 原生 JSON 类型存储，`specialties` 为字符串数组，`available_slots` 为 `{"Mon": ["09:00-10:00"]}` 结构。
**原因**：避免额外的关联表（如 counselor_specialties），查询简单；MySQL 8 JSON 支持成熟，可用 JSON_CONTAINS 做筛选。
**影响**：Sequelize model 中对应字段类型为 `DataTypes.JSON`，读写时自动序列化/反序列化。

### 6. sessions 表与 appointments 表的关系设计
**背景**：预约（appointment）和实际咨询（session）是两个不同阶段，存在"有预约但未发生咨询"和"临时安排咨询无预约"两种场景。
**决策**：`sessions.appointment_id` 设为可空外键，`ON DELETE SET NULL`；`appointments` 和 `sessions` 之间为 1:1（sessions 表 appointment_id 加 UNIQUE）。
**原因**：解耦预约流程和咨询流程，不强制要求咨询师必须通过预约系统才能发起会话。

### 7. announcements 支持草稿机制
**背景**：学校管理员需要先草拟公告，审核后再发布。
**决策**：`published_at` 字段为 NULL 表示草稿，有值表示已发布；`expires_at` 为 NULL 表示永不过期。
**影响**：前端查询公告列表时需加 `WHERE published_at IS NOT NULL AND (expires_at IS NULL OR expires_at > NOW())` 条件。

### 8. 不引入第三方日志库（winston/morgan），使用自定义 logger
**背景**：后端需要结构化日志，可选 winston、morgan 或自定义实现。
**决策**：自定义 `src/utils/logger.js`，封装 info/warn/error 三级，带 ISO 时间戳，生产环境关闭 info 级别。
**原因**：当前阶段日志需求简单，引入 winston 增加依赖和配置成本；morgan 适合 HTTP 请求日志但不适合业务日志；自定义实现零依赖，后期如需升级可直接替换内部实现。

### 9. app.js 使用 async start() 模式，先连库再监听
**背景**：服务启动时需保证数据库连接成功后再开始接收请求，有两种方案：①先 listen 后异步连库；②await connectDB() 后再 listen。
**决策**：选方案②，`async function start()` 内 `await connectDB()` 成功后调用 `app.listen()`；连库失败则 `process.exit(1)`。
**原因**：避免服务接受请求但数据库尚未就绪的窗口期；启动失败快速退出，便于进程管理器（PM2/Docker）自动重启。

### 10. errorHandler 对 Sequelize 验证错误做专项处理
**背景**：Sequelize 抛出的 `SequelizeValidationError` 和 `SequelizeUniqueConstraintError` 携带 `errors[]` 数组，直接透传会暴露内部字段名。
**决策**：在全局 errorHandler 中识别这两类错误，提取 `err.errors[].message` 拼接后以 400 返回，其余错误仍走通用逻辑（500 不暴露堆栈）。
**影响**：数据库约束错误对前端友好展示；controller 层只需 `throw` 即可，无需自行捕获 Sequelize 错误。

### 11. 用自定义 asyncHandler 替代 express-async-errors
**背景**：Express 4 不原生支持 async 路由错误冒泡，controller 里 `throw` 的错误不会自动进入全局 errorHandler，有两种方案：①引入 `express-async-errors` npm 包（monkey-patch Express）；②自定义 `asyncHandler(fn)` 包装器。
**决策**：选方案②，在 `src/utils/asyncHandler.js` 中实现 `(fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)`，在路由层包裹所有 async controller。
**原因**：零新增依赖；实现透明，无 monkey-patch 副作用；方便未来迁移 Express 5（原生支持 async，届时可直接删除包装器）。
**影响**：routes 文件统一写 `router.post('/path', asyncHandler(controller.method))`；controller 只需 `throw` 带 `status` 属性的 Error 即可触发全局错误处理。

### 12. auth service 用 formatUser() 显式过滤敏感字段
**背景**：User 模型含 `passwordHash` 字段，直接返回 `user.toJSON()` 会将哈希密码暴露给前端。
**决策**：在 `auth.service.js` 中定义私有 `formatUser(user)` 函数，显式枚举允许返回的字段（id / username / email / role / isActive / avatarUrl / lastLoginAt / createdAt），所有对外暴露用户信息的路径都经过此函数。
**原因**：比 `attributes: { exclude: [...] }` 更安全（新增字段默认不暴露，而非默认暴露）；逻辑集中，日后增减暴露字段只改一处。
**影响**：`passwordHash` 字段永远不会出现在任何 API 响应中。

### 13. Sequelize 关联统一在 models/index.js 中定义
**背景**：随着模型数量增加（User / StudentProfile / CounselorProfile / Appointment / Session / Feedback），需要在多个模型之间建立 hasOne / belongsTo 关联，有两种方案：①在每个模型文件底部直接 `require` 其他模型并调用关联方法；②在独立的 `models/index.js` 中统一加载所有模型后集中定义关联。
**决策**：选方案②，创建 `src/models/index.js`，统一 require 所有模型并集中调用关联方法，service 层统一从 `models/index.js` 导入所需模型。
**原因**：方案①存在循环依赖风险（A 引用 B，B 引用 A）；方案②关联关系一目了然，新增模型只改一处；Node.js 模块缓存保证关联方法只在首次加载时执行一次，不会重复注册。
**影响**：service 文件统一写 `require('../models')`；auth.service.js 仍直接引用 `User`（无关联需求，无需改动）；后续新增模型只需在 `index.js` 中追加 require 和关联定义。

### 14. appointments 时间字段的类型选择
**背景**：`appointment_date` 为 MySQL DATE 类型，`start_time` / `end_time` 为 MySQL TIME 类型，Sequelize 对 TIME 类型的支持存在 dialect 差异。
**决策**：`appointmentDate` 使用 `DataTypes.DATEONLY`（映射 MySQL DATE）；`startTime` / `endTime` 使用 `DataTypes.STRING(8)`（以 `'HH:MM:SS'` 字符串存储 TIME 值）。
**原因**：`DataTypes.TIME` 在部分 Sequelize 版本读取时会附加日期前缀，行为不稳定；`STRING(8)` 简单可靠，MySQL TIME 字符串按字典序比较与时间大小顺序一致，可直接用 `Op.lt` / `Op.gt` 做时段冲突检测。
**影响**：前后端传参约定为 `'HH:MM:SS'` 格式；冲突检测逻辑 `startTime < endTime AND existingStart < endTime` 可直接用字符串比较实现，无需转换。

### 15. 预约冲突检测逻辑
**背景**：学生预约时需确保所选时段与咨询师已有预约无冲突，同时检查每日接诊上限。
**决策**：两步校验：①`COUNT` 非取消预约数量 >= `maxAppointmentsPerDay` 则报满；②区间重叠条件 `existingStart < newEnd AND newStart < existingEnd`（两区间重叠的充要条件），用 Sequelize Op.lt / Op.gt 实现，排除 `cancelled` 状态。
**原因**：单次数据库查询即可完成冲突检测，无需拉取全部预约到内存做循环对比；逻辑简洁，边界情况（首尾相接不算重叠）自然满足。
**影响**：status 为 `cancelled` 的预约不占用时段，学生取消后该时段可被他人重新预约。

### 16. 咨询师开始会话时同步更新预约状态
**背景**：咨询师从"已确认的预约"发起会话时，预约状态应同步更新，防止同一预约被重复发起会话。
**决策**：在 `counselor.service.js/createSession()` 中，创建 Session 记录后立即将来源预约状态更新为 `completed`。若尝试对同一 `appointmentId` 再次发起，由于预约状态已为 `completed`（不等于 `confirmed`），校验逻辑自动拒绝并返回 400。
**原因**：无需单独维护"是否已关联会话"标志；状态流转（confirmed → completed）本身就是幂等拦截依据；逻辑简洁，边界清晰。
**影响**：`appointments.status` 从 `confirmed` 变 `completed` 发生在会话 **开始** 时（而非结束时），学生端预约列表会及时反映这一变化。

### 17. counselor.service 的 createSession 跳过"已存在 Session"检查
**背景**：设计了先检查 `Session.findOne({ where: { appointmentId } })` 是否存在的逻辑（409），但实际上决策 16 中预约状态更新已使该检查冗余。
**决策**：代码中仍保留了 `existingSession` 检查（409 路径），但在实际流程中该路径不可达（因预约状态校验在前）。保留代码作为防御性编程，不做删除。
**影响**：无功能影响；若未来更改状态同步时机，该防御检查仍能生效。

### 18. school.service.getStats() 用 Promise.all 并发查询
**背景**：统计接口需要同时查询 5 项数据（学生数、咨询师数、预约数、已完成会话数、平均评分），可串行也可并发。
**决策**：使用 `Promise.all([...])` 一次性并发发出全部 DB 查询，等待最慢的一条完成后统一返回。
**原因**：5 条查询相互独立，并发执行总耗时约等于最慢单条查询时间，串行执行则为 5 条之和；实现简洁，无需手动管理中间状态。
**影响**：stats 接口响应时间与数据规模的相关性降低；若日后查询增多仍可沿用此模式。

### 19. 学校管理端公告列表默认展示全部状态（含草稿）
**背景**：公告列表有两种受众：①学生/咨询师（只看已发布且未过期的）；②学校管理员（需要管理草稿）。
**决策**：`GET /api/v1/school/announcements` 默认返回所有状态公告（草稿 + 已发布），通过 `?status=draft` 或 `?status=published` 参数筛选；学生端未来另开接口时只返回有效已发布公告。
**原因**：管理端需要草稿管理能力；通过 query param 筛选比两个路由更简洁；角色隔离（roleGuard('school')）确保普通用户无法访问此接口。
**影响**：学生/咨询师不通过此接口获取公告，将来在各自端单独实现公告查看接口（只返回 `publishedAt IS NOT NULL AND (expiresAt IS NULL OR expiresAt > NOW())` 的记录）。

### 20. createCounselor 可选同步创建 CounselorProfile
**背景**：管理员添加咨询师账号时，可以同时提供 realName 快速建档，也可以留给咨询师自己完善。
**决策**：若请求体含 `realName`，`createCounselor` 在创建 User 后立即 `CounselorProfile.create({ userId, realName })`；若无 `realName` 则只创建 User，档案由咨询师后续通过 `PUT /counselor/profile` 自行填写（首次创建必须传 realName，决策已有记录）。
**原因**：保持与咨询师自更新档案逻辑一致；管理员批量导入时可快速建档，小批量时可先建账号再让当事人完善，灵活性更高。
**影响**：管理员创建咨询师后，CounselorProfile 可能为 null（无 realName 时），前端展示列表需做空值兜底。

### 21. AI 服务使用 Node.js 内置 fetch（不引入额外 HTTP 客户端库）
**背景**：调用 DeepSeek API（兼容 OpenAI 格式）需要 HTTP 客户端，可选 node-fetch、axios、openai SDK 或 Node.js 内置 fetch。
**决策**：使用 Node.js 18+ 内置的全局 `fetch`（当前运行 v24.12.0），无需安装任何新依赖。
**原因**：零新增依赖；DeepSeek 接口是标准 HTTP/JSON，不需要 SDK 封装；内置 fetch 的 ReadableStream 可直接解析 SSE 流。
**影响**：需要 Node.js >= 18，低版本需改用 node-fetch 4.x；Windows 环境下 fetch 行为与 Linux 一致。

### 22. SSE 错误处理分两段：flushHeaders 前 throw，之后写入 SSE error 事件
**背景**：SSE 响应一旦调用 `res.flushHeaders()`，HTTP 状态码和头部已发送，无法再走 Express 全局错误中间件（会导致"Cannot set headers after they are sent"）。
**决策**：`ai.service.sendMessage()` 在 `flushHeaders()` 之前做所有前置校验（token、对话归属、内容非空）并 `throw` 标准 Error；`flushHeaders()` 之后的所有错误（API 调用失败、网络错误）通过 `res.write('data: ...')` 写入 SSE error 事件后 `res.end()`。
**原因**：前置校验失败时客户端收到标准 JSON 错误响应；流式阶段的错误通过 SSE 协议通知前端，前端可根据 `type: 'error'` 显示友好提示而不是白屏。
**影响**：controller 的 `sendMessage` 仍可用 `asyncHandler` 包装，前置 throw 被自动捕获；流式阶段的错误不再进入 errorHandler。

### 23. AI 对话历史限制最近 20 条
**背景**：每次发送消息需将全部对话历史拼入 messages 数组发给 DeepSeek，历史越长消耗 token 越多，且可能超出模型上下文窗口。
**决策**：`sendMessage` 中通过 `limit: 20` 只取最近 20 条消息（含刚保存的用户消息）构建 messages 数组，系统 Prompt 额外占用 1 个 message。
**原因**：对大多数心理咨询场景，最近 10 轮对话（20 条）已足够上下文；超过部分被截断不会导致 bug，只是模型看不到更早的对话。
**影响**：超长对话中模型可能"忘记"早期内容；如需完整历史可扩大 limit 或实现对话摘要机制（未来优化项）。

### 24. /api/v1/student/ai 路由挂载顺序：比 /api/v1/student 更靠前
**背景**：Express `app.use('/api/v1/student', handler)` 对所有 `/api/v1/student/*` 路径均生效，包括 `/api/v1/student/ai/*`，导致 studentRouter 的 `router.use(authMiddleware)` 会对 AI 路由也运行一次。
**决策**：在 `app.js` 中先挂载 `aiRouter` 到 `/api/v1/student/ai`，再挂载 `studentRouter` 到 `/api/v1/student`。
**原因**：更具体的路径优先匹配，避免 studentRouter 的全局中间件对 AI 路由重复执行；语义清晰。
**影响**：AI 路由由 aiRouter 自身的 `router.use(authMiddleware, roleGuard('student'))` 独立处理鉴权。

### 25. 前端 AI SSE 使用 fetch POST 而非 EventSource
**背景**：AI 对话发送消息需要携带 POST body（content 字段），EventSource 仅支持 GET 请求，无法发送请求体。
**决策**：`api/ai.js` 的 `sendMessage` 用原生 `fetch` 发 POST 请求，读取 `response.body.getReader()` 手动解析 SSE 流，返回 `AbortController.abort` 作为取消函数。
**原因**：EventSource 无法设置请求头（Authorization）也无法发送 body；fetch + ReadableStream 完全兼容标准 SSE 格式；AbortController 可在组件 unmount 时清理连接。
**影响**：前端调用方式为 `const stop = aiApi.sendMessage(id, content, { onDelta, onDone, onError })`，`stop()` 取消流；组件内在 `onUnmounted` 调用 `stop()`。

### 26. Pinia auth store 用 localStorage 手动持久化（不引入插件）
**背景**：用户刷新页面后需保持登录状态，可选 `pinia-plugin-persistedstate` 插件或手动 localStorage。
**决策**：在 `stores/auth.js` 中手动读写 `localStorage.getItem/setItem`，不引入第三方插件。
**原因**：仅 token 和 user 两个字段需要持久化，引入插件过重；手动控制序列化/反序列化逻辑更透明，token 过期时清理逻辑集中在 `logout()` 和 request.js 的 401 拦截器。
**影响**：`request.js` 的 401 拦截器直接操作 localStorage（`removeItem('token'/'user')`）和调用 `router.push('/login')`，与 store 的 `logout()` 行为一致。

### 27. 路由守卫角色校验：访问非己端路由重定向到自己的首页
**背景**：学生 token 用户若手动访问 `/counselor/*` 路由，需要拦截并重定向。
**决策**：`router/index.js` 的 `beforeEach` 守卫检查 `to.meta.role !== authStore.role`，重定向到 `roleHomeMap[authStore.role]`（student→/student，counselor→/counselor，school→/school）。
**原因**：防止错误角色访问敏感页面；重定向到自己的首页比返回 /login 体验更好；与后端 roleGuard 中间件形成双重防护。
**影响**：meta.role 只在各端 layout 路由上设置，子路由自动继承；`/login` 设 `meta.public: true` 绕过守卫，已登录用户访问 /login 自动跳转首页。

### 28. axios DELETE 请求通过 `{ data }` 选项传递请求体
**背景**：取消预约接口为 `DELETE /api/v1/student/appointments/:id`，后端通过 `req.body.cancelReason` 接收取消原因，但 axios 的 `request.delete(url)` 默认不携带 body。
**决策**：将 `api/student.js` 中 `cancelAppointment` 改为 `request.delete(url, { data })`，axios 会把 `data` 作为请求体发出。
**原因**：axios 对 DELETE 请求的 body 通过第二参数的 `data` 字段传入，与 GET 的 `params` 平行；无需改动后端，前端一行改动即可。
**影响**：取消原因为可选字段，不传时 `data` 为 `undefined`，axios 不会发送空 body，与后端 `cancelReason || null` 逻辑一致。

### 29. Counselors 页预约时段基于 Date.getDay() 动态解析 availableSlots
**背景**：咨询师的可用时段以 `{ "Mon": ["09:00-10:00"] }` 格式存储，前端需根据学生选择的日期展示对应时段。
**决策**：用 `new Date(dateStr + 'T00:00:00').getDay()` 取 0–6，映射到 `['Sun','Mon','Tue','Wed','Thu','Fri','Sat']` 的缩写，再从 `availableSlots` 取对应数组展示；时段字符串 "HH:MM-HH:MM" 在提交时分割并各补 `:00` 后缀得到 `HH:MM:00` 格式（与后端 STRING(8) 约定一致）。
**原因**：纯前端计算，不需要额外接口；日期字符串加 `T00:00:00` 防止时区偏移导致 getDay() 错误。
**影响**：若咨询师未配置某天的时段，该日期选中后提示"该日期无可用时段"，用户需换日期重选。

### 30. AIChat 页流式消息使用本地临时对象渲染，done 后不强制重新拉取
**背景**：发送消息后需立即在 UI 展示用户消息和 AI 流式回复，有两种方式：①等 SSE done 后重新拉取全部消息；②本地直接 push 临时消息并实时 append delta。
**决策**：选方案②，发送时立即 push `{ _tmpId, role:'user', content }` 和 `{ _tmpId, role:'assistant', content:'', _streaming:true }`，SSE delta 事件逐字追加到 assistant content，done 后去掉 `_streaming` 标记；不在 done 后强制 reload（服务端 done 事件不携带 messageId）。
**原因**：避免 done 后 reload 引起消息列表闪烁；streaming 内容与服务端最终保存内容一致（delta 逐字累积 = 完整回复）；用户刷新页面后会正常拉取服务端真实记录。
**影响**：onUnmounted 调用 stopFn 清理 SSE 连接，防止组件销毁后 fetch 泄漏；stop 中断时本地显示已收到的部分内容，服务端不保存不完整回复（后端在流完成后才调用 AiMessage.create）。

### 31. SessionDetail 通过 router history.state 获取 session 数据
**背景**：会话详情页需要展示 session 基本信息（学生、状态、时间），但后端无单条 session GET 接口（只有分页列表），若每次进入详情页都重新拉列表过滤，既浪费流量也增加等待时间。
**决策**：导航时通过 `router.push({ path: '...', state: { session } })` 将 session 对象附加到 history state；详情页用 `history.state?.session` 读取；页面刷新时 state 丢失则展示提示并引导用户返回列表重新进入。
**原因**：Vue Router 4 原生支持 state 参数（底层调用 `history.pushState`），无需 Pinia/sessionStorage；典型用户行为是从列表点击进入详情，直接刷新详情页的场景极少见；避免为这一场景额外新增后端接口。
**影响**：Sessions.vue 和 Dashboard.vue 中所有"查看详情"操作均使用 `router.push({ state: { session } })` 而非 `RouterLink`；SessionDetail 页面右上角"返回"按钮提示用户在 state 缺失时重新导航。

### 32. "开始会话"入口放在预约管理页，而非会话列表页
**背景**：咨询师开始一次会话可以从两个入口触发：①在"已确认预约"处点击开始；②在会话列表新建。
**决策**：将"开始会话"按钮放在 Appointments.vue 的"已确认"预约卡片上，不在 Sessions.vue 新增入口。
**原因**：从预约触发会话是最常见流程，预约卡片上已有完整的学生/时间信息，上下文更清晰；createSession 需要 appointmentId + studentId，在预约卡片处这些字段天然可得，无需额外选择步骤；Sessions 页定位为"历史会话管理"，保持职责单一。
**影响**：Appointments.vue 中 confirmed 状态的预约卡片显示"开始会话"按钮，调用 createSession 后自动跳转到新会话的 SessionDetail 页。

### 33. Profile 页三块内容独立保存（基本信息 / 擅长方向 / 可预约时段）
**背景**：咨询师档案包含三类差异较大的字段，可选择一次全量提交或分块提交。
**决策**：三个卡片各有独立"保存"按钮，分别调用同一个 `PUT /api/v1/counselor/profile` 接口（只传当前块的字段），互不干扰。
**原因**：可预约时段的编辑操作复杂（按星期增删），如果与基本信息合并到同一表单，用户编辑时段后忘记点保存容易丢失；分块保存提供更细粒度的反馈（"时段已保存" vs "信息已保存"）；后端 updateProfile 本身已支持部分字段更新（只更新 ALLOWED 白名单中传入的 key），无需改动。
**影响**：前端三个保存操作相互独立，不存在互相覆盖的风险（因为各块只传各自负责的字段）。

### 34. 案例笔记默认私有
**背景**：`session_notes` 表中的笔记涉及来访者隐私，默认可见性需要明确。
**决策**：`session_notes.is_private` 默认为 `1`（仅咨询师可见）。
**原因**：保护来访者隐私；案例笔记属于咨询师的工作记录，默认不应对学生可见，需显式设置 `isPrivate: false` 才能改变。

### 36. Sequelize + MySQL 编码三层加固方案

**背景**：部分通过非 API 路径（如 MySQL Workbench 使用 GBK/latin1 直连）写入的中文数据出现乱码；同时发现 `DataTypes.DATEONLY` + `timezone: '+08:00'` + mysql2 默认 Date 对象解析的组合会导致日期偏移（出现 `0001-01-01`）。

**决策**：在 `database.js` 中采用三层加固：
1. `dialectOptions.charset: 'utf8mb4'` — 声明 mysql2 连接字符集
2. `dialectOptions.dateStrings: ['DATE']` — 让 mysql2 以字符串而非 JS Date 对象返回 MySQL DATE 列，彻底消除 DATEONLY 时区偏移问题
3. `afterConnect` hook 执行 `SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci` — 每个连接池连接建立后强制设置，是最可靠的兜底保障

**原因**：MySQL 8 虽然服务器默认字符集已是 utf8mb4，但 mysql2 驱动层的 charset 声明、DATE 列的类型解析、连接池复用时的字符集状态均需独立保障；三层各自覆盖不同的失效场景，互为补充。

**影响**：`dateStrings: ['DATE']` 仅影响 DATE 类型（对应 `DATEONLY` 字段），DATETIME/TIMESTAMP 字段不受影响，Sequelize 的时区处理逻辑对后者仍正常工作。数据库中因历史写入方式错误产生的乱码记录需手动清理（通过 `HEX(col) LIKE '%EFBFBD%'` 识别），清理后通过 Web UI 重新录入即可。

### 37. service 层过滤空字符串，避免 ENUM 列截断

**背景**：前端表单中 ENUM 字段（如 `gender`）初始化为空字符串 `''`，提交时随整个 form 对象发出，service 层原有过滤 `data[key] !== undefined` 无法拦截 `''`，导致 MySQL ENUM 列收到非法值抛出 `Data truncated` 错误（500）。

**决策**：将过滤条件改为 `data[key] !== undefined && data[key] !== ''`，空字符串视同"未提供"，不写入 `updates`。

**原因**：ENUM 列不接受空字符串，NULL 是合法的"无值"表达；同时其他文本字段（如 phone、studentNo）在用户未填时也应保持原值，不覆写为空字符串；该规则在服务层统一处理比在每个控制器或前端逐字段判断更安全。

**影响**：用户无法通过前端将某字段"主动清空"为空字符串（发 null 才能清空），但当前表单场景下无此需求；若未来需要支持清空字段，前端需显式传 `null` 而非 `''`。

### 38. 前端 ENUM 表单选项必须与数据库 ENUM 值完全一致

**背景**：先后出现两次"前端 `<select>` 选项包含数据库 ENUM 列不支持的值"导致的 500 错误：①`student_profiles.gender` 接收空字符串；②`appointments.type` 接收 `'phone'`（ENUM 仅有 `'online'`/`'offline'`）。

**决策**：前端所有绑定至数据库 ENUM 列的 `<select>` / `<radio>` 等控件，其 `value` 集合必须与数据库 ENUM 定义完全一致，不得包含额外值；新增 ENUM 值时须同步修改前端控件。Service 层同时做空字符串过滤（`data[key] !== ''`）作为兜底防御。

**原因**：MySQL ENUM 列对非法值直接报 `Data truncated` 导致 500，错误信息不友好；前端是输入来源，在控件层面提前限定范围是最简单可靠的防御。

**影响**：修改数据库 ENUM 时须同步检查所有对应前端控件；service 层空字符串过滤兜底保留。

### 39. appointments.type 到 sessions.type 的映射规则

**背景**：`appointments.type` ENUM 为 `('online', 'offline')`，`sessions.type` ENUM 为 `('individual', 'online')`，两表枚举值不同但语义有对应关系，直接透传导致 `Data truncated`。

**决策**：在 `Appointments.vue` 的 `startSession()` 中显式映射：`'online' → 'online'`，`'offline'（及其他值）→ 'individual'`。

**原因**：`offline`（线下面谈）在咨询语境下等同于 `individual`（个体咨询），两个维度描述的是同一类面对面咨询；以数据库已有 ENUM 定义为准，不更改表结构，只在前端做语义桥接。

**影响**：线下预约发起的会话 type 记录为 `individual`，线上预约发起的会话 type 记录为 `online`，语义正确。

### 35. 使用指南文档结构选择
**背景**：项目文档需要面向多类读者（学生/咨询师/管理员/开发者）。
**决策**：将使用指南输出为独立的 `docs/使用指南.md`，面向四类读者分章节撰写，API 章节完全基于实际路由和 service 代码提取，不虚构接口。
**原因**：项目存在三端用户，不同读者关注点不同；API 文档从代码提取保证准确性；暂未实现的功能（如公告编辑、头像上传）明确标注"当前版本暂未实现"。
