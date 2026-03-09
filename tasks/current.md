# 当前任务：排查并实现学生端评分功能

## 目标
确认评分功能现状，补全缺失部分。

## 第一步：排查现状（先做这个，再动代码）
检查以下内容并报告结果：
1. `database/migrations/001_init.sql` 中 feedback 表是否存在，字段有哪些
2. `backend/src/models/Feedback.js` 是否存在
3. `backend/src/routes/student.js` 中是否有 POST /api/v1/student/feedback 接口
4. `frontend/src/views/student/MyAppointments.vue` 中是否有评分相关入口

报告格式：
- feedback 表：存在/不存在
- Feedback model：存在/不存在
- 评分接口：存在/不存在
- 前端入口：存在/不存在

## 第二步：根据排查结果补全缺失部分

### 如果后端完整，只缺前端入口
在 `views/student/MyAppointments.vue` 中：
- 已完成状态的预约，显示"评分"按钮
- 已评分的预约，显示星级和"已评价"标记，不可重复评分
- 点击评分弹出对话框，包含 1-5 星评分 + 可选文字评价
- 提交后调用 POST /api/v1/student/feedback

### 如果后端也缺失
补全以下内容：
- `backend/src/models/Feedback.js`
- `backend/src/services/student.service.js` 增加 createFeedback 方法
- `backend/src/controllers/student.controller.js` 增加 submitFeedback
- `backend/src/routes/student.js` 挂载 POST /api/v1/student/feedback
- 然后再做前端入口

## 完成标准
- 已完成的预约显示评分按钮
- 提交评分成功，按钮变为已评价状态
- 同一预约不能重复评分

## 不允许
- 不允许改数据库表结构
- 不允许影响预约列表其他功能
