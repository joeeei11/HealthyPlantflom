# 当前任务：无（待分配）

## 上一个任务（已完成）
Bug 修复 - 咨询师端会话详情数据不可用

### 根因
`Sessions.vue` / `Dashboard.vue` 将 Vue 3 reactive Proxy（v-for 列表项）直接传入
`router.push({ state: { session } })`，浏览器 Structured Clone Algorithm 序列化失败后
Vue Router fallback 到 `location.assign`，整页刷新导致 `history.state.session` 丢失。

### 修复
在导航前执行 `JSON.parse(JSON.stringify(session))` 转为纯 POJO，确保 `history.pushState` 序列化成功。

### 影响文件
- `frontend/src/views/counselor/Sessions.vue`（goToDetail）
- `frontend/src/views/counselor/Dashboard.vue`（goToSession）
