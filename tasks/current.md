# 当前任务：Bug 修复 - 创建会话 type 字段枚举值不匹配

## 错误信息
Data truncated for column 'type' at row 1
位置：counselor.service.js:210 createSession

## 根本原因
sessions 表的 type 字段是 ENUM 类型，前端传入的值不在数据库枚举定义范围内。

## 排查方向（按顺序检查）
1. 查看 `database/migrations/001_init.sql`，找到 sessions 表 type 字段的枚举值定义
2. 查看 `backend/src/models/Session.js`，确认 Sequelize model 中 type 的枚举值和数据库一致
3. 查看 `frontend/src/views/counselor/` 中"开始对话"按钮的点击事件，确认实际传给后端的 type 值是什么
4. 三者对齐：数据库枚举 = Sequelize model 枚举 = 前端传入值

## 修复方式
以数据库 migrations 里的枚举定义为准，修正 model 或前端传入值，确保三处一致。

## 完成标准
- 点击开始对话成功创建 Session，无报错
- type 字段值正确写入数据库

## 不允许
- 不允许修改数据库表结构（不改枚举定义，只对齐代码）