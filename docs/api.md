# 大学生心理健康咨询平台 — API 文档

**Base URL**：`http://localhost:3000`
**版本前缀**：`/api/v1`
**编码**：UTF-8
**最后更新**：2026-03-09

---

## 通用规范

### 统一响应格式

```json
{ "code": 200, "data": {}, "message": "success" }
{ "code": 400, "data": null, "message": "错误描述" }
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | number | HTTP 状态码（200/201/400/401/403/404/409/500） |
| data | any | 业务数据，失败时为 null |
| message | string | 说明文本 |

### 认证方式

需要认证的接口必须在请求头中携带 JWT Token：

```
Authorization: Bearer <token>
```

### 角色权限

| 角色 | 值 | 说明 |
|------|----|------|
| 学生 | `student` | 通过注册创建，可预约、使用 AI 助手 |
| 咨询师 | `counselor` | 由学校管理端创建，管理预约和会话 |
| 学校管理 | `school` | 超级管理员，查看统计、管理咨询师和公告 |

---

## 一、认证模块 `/api/v1/auth`

### 1.1 注册

`POST /api/v1/auth/register`

> 仅支持学生自主注册（`role: "student"`），咨询师账号由管理端创建。

**Request Body**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | ✓ | 用户名，需唯一 |
| email | string | ✓ | 邮箱，需唯一 |
| password | string | ✓ | 密码，最少 6 位 |
| role | string | ✓ | 固定传 `"student"` |

**示例请求**

```json
{
  "username": "zhangsan",
  "email": "zhangsan@example.com",
  "password": "123456",
  "role": "student"
}
```

**示例响应** `201`

```json
{
  "code": 201,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "zhangsan",
      "email": "zhangsan@example.com",
      "role": "student",
      "isActive": true,
      "avatarUrl": null,
      "lastLoginAt": null,
      "createdAt": "2026-03-09T10:00:00.000Z"
    }
  },
  "message": "success"
}
```

**错误码**

| code | 说明 |
|------|------|
| 400 | 密码少于 6 位 |
| 400 | 邮箱/用户名已被注册（Sequelize UniqueConstraintError） |

---

### 1.2 登录

`POST /api/v1/auth/login`

**Request Body**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | ✓ | 注册邮箱 |
| password | string | ✓ | 密码 |

**示例请求**

```json
{
  "email": "zhangsan@example.com",
  "password": "123456"
}
```

**示例响应** `200`

```json
{
  "code": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "zhangsan",
      "email": "zhangsan@example.com",
      "role": "student",
      "isActive": true,
      "avatarUrl": null,
      "lastLoginAt": "2026-03-09T10:05:00.000Z",
      "createdAt": "2026-03-09T10:00:00.000Z"
    }
  },
  "message": "success"
}
```

**错误码**

| code | 说明 |
|------|------|
| 401 | 邮箱或密码错误 |
| 403 | 账号已被禁用 |

---

### 1.3 刷新 Token

`POST /api/v1/auth/refresh`

**Request Body**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| token | string | ✓ | 当前有效的 JWT |

**示例请求**

```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

**示例响应** `200`

```json
{
  "code": 200,
  "data": { "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...new..." },
  "message": "success"
}
```

**错误码**

| code | 说明 |
|------|------|
| 400 | 缺少 token |
| 401 | token 无效或已过期 |

---

### 1.4 获取当前用户信息

`GET /api/v1/auth/me`

> 需要认证（Bearer Token）。

**示例响应** `200`

```json
{
  "code": 200,
  "data": {
    "id": 1,
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "role": "student",
    "isActive": true,
    "avatarUrl": null,
    "lastLoginAt": "2026-03-09T10:05:00.000Z",
    "createdAt": "2026-03-09T10:00:00.000Z"
  },
  "message": "success"
}
```

---

## 二、学生端 `/api/v1/student`

> 所有接口需要认证，且 `role` 必须为 `student`。

### 2.1 查看个人档案

`GET /api/v1/student/profile`

**示例响应** `200`

```json
{
  "code": 200,
  "data": {
    "id": 1,
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "avatarUrl": null,
    "createdAt": "2026-03-09T10:00:00.000Z",
    "profile": {
      "id": 1,
      "userId": 1,
      "realName": "张三",
      "studentNo": "2024001",
      "gender": "male",
      "grade": "大三",
      "major": "计算机科学",
      "college": "信息学院",
      "phone": "13800138000",
      "emergencyContact": "张父",
      "emergencyPhone": "13900139000",
      "createdAt": "2026-03-09T10:10:00.000Z",
      "updatedAt": "2026-03-09T10:10:00.000Z"
    }
  },
  "message": "success"
}
```

> `profile` 为 `null` 表示用户尚未填写档案。

---

### 2.2 更新/创建个人档案

`PUT /api/v1/student/profile`

> 首次创建时 `realName` 为必填，后续更新可传任意子集字段。

**Request Body**（所有字段可选，首次创建时 `realName` 必填）

| 字段 | 类型 | 说明 |
|------|------|------|
| realName | string | 真实姓名 |
| studentNo | string | 学号 |
| gender | string | `"male"` / `"female"` / `"other"` |
| grade | string | 年级，如 `"大三"` |
| major | string | 专业 |
| college | string | 学院 |
| phone | string | 手机号 |
| emergencyContact | string | 紧急联系人姓名 |
| emergencyPhone | string | 紧急联系人电话 |

**示例请求**

```json
{
  "realName": "张三",
  "studentNo": "2024001",
  "gender": "male",
  "grade": "大三",
  "major": "计算机科学",
  "college": "信息学院"
}
```

**示例响应** `200`

```json
{
  "code": 200,
  "data": {
    "id": 1,
    "userId": 1,
    "realName": "张三",
    "studentNo": "2024001",
    "gender": "male",
    "grade": "大三",
    "major": "计算机科学",
    "college": "信息学院",
    "phone": null,
    "emergencyContact": null,
    "emergencyPhone": null,
    "updatedAt": "2026-03-09T10:10:00.000Z"
  },
  "message": "success"
}
```

---

### 2.3 获取可预约咨询师列表

`GET /api/v1/student/counselors`

**Query Params**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | ✗ | 按咨询师真实姓名模糊搜索 |

**示例响应** `200`

```json
{
  "code": 200,
  "data": [
    {
      "id": 2,
      "username": "counselor01",
      "avatarUrl": null,
      "counselorProfile": {
        "realName": "李四",
        "gender": "female",
        "title": "心理咨询师",
        "specialties": ["焦虑", "压力管理", "人际关系"],
        "bio": "从事心理咨询工作 8 年，擅长认知行为疗法。",
        "availableSlots": {
          "Mon": ["09:00-10:00", "14:00-15:00"],
          "Wed": ["09:00-10:00"],
          "Fri": ["14:00-15:00"]
        },
        "maxAppointmentsPerDay": 5
      }
    }
  ],
  "message": "success"
}
```

> 只返回 `isAccepting = true` 且账号启用的咨询师。

---

### 2.4 获取我的预约列表

`GET /api/v1/student/appointments`

**Query Params**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | ✗ | `pending` / `confirmed` / `completed` / `cancelled` |
| page | number | ✗ | 页码，默认 1 |
| pageSize | number | ✗ | 每页条数，默认 10 |

**示例响应** `200`

```json
{
  "code": 200,
  "data": {
    "total": 3,
    "page": 1,
    "pageSize": 10,
    "list": [
      {
        "id": 1,
        "studentId": 1,
        "counselorId": 2,
        "appointmentDate": "2026-03-15",
        "startTime": "09:00:00",
        "endTime": "10:00:00",
        "type": "offline",
        "reason": "学业压力较大",
        "status": "confirmed",
        "cancelReason": null,
        "cancelledBy": null,
        "createdAt": "2026-03-09T10:20:00.000Z",
        "counselor": {
          "id": 2,
          "username": "counselor01",
          "avatarUrl": null,
          "counselorProfile": {
            "realName": "李四",
            "title": "心理咨询师"
          }
        }
      }
    ]
  },
  "message": "success"
}
```

---

### 2.5 发起预约

`POST /api/v1/student/appointments`

**Request Body**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| counselorId | number | ✓ | 咨询师 user.id |
| appointmentDate | string | ✓ | 预约日期，格式 `YYYY-MM-DD` |
| startTime | string | ✓ | 开始时间，格式 `HH:MM:SS` |
| endTime | string | ✓ | 结束时间，格式 `HH:MM:SS`，须晚于 startTime |
| type | string | ✗ | `"offline"`（默认）/ `"online"` |
| reason | string | ✗ | 预约说明 |

**示例请求**

```json
{
  "counselorId": 2,
  "appointmentDate": "2026-03-15",
  "startTime": "09:00:00",
  "endTime": "10:00:00",
  "type": "offline",
  "reason": "学业压力较大，想寻求帮助"
}
```

**示例响应** `201`

```json
{
  "code": 201,
  "data": {
    "id": 1,
    "studentId": 1,
    "counselorId": 2,
    "appointmentDate": "2026-03-15",
    "startTime": "09:00:00",
    "endTime": "10:00:00",
    "type": "offline",
    "reason": "学业压力较大，想寻求帮助",
    "status": "pending",
    "createdAt": "2026-03-09T10:20:00.000Z"
  },
  "message": "success"
}
```

**错误码**

| code | 说明 |
|------|------|
| 400 | 缺少必要字段 |
| 400 | startTime >= endTime |
| 400 | 咨询师当日预约已满 |
| 400 | 该咨询师当前不接受预约 |
| 404 | 咨询师不存在或账号停用 |
| 409 | 所选时段与已有预约冲突 |

---

### 2.6 取消预约

`DELETE /api/v1/student/appointments/:id`

**Path Params**

| 参数 | 说明 |
|------|------|
| id | 预约 ID |

**Request Body**（可选）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| cancelReason | string | ✗ | 取消原因 |

**示例响应** `200`

```json
{
  "code": 200,
  "data": {
    "id": 1,
    "status": "cancelled",
    "cancelReason": "临时有事",
    "cancelledBy": 1
  },
  "message": "success"
}
```

**错误码**

| code | 说明 |
|------|------|
| 400 | 预约状态为 completed/cancelled，无法取消 |
| 403 | 无权操作此预约 |
| 404 | 预约不存在 |

---

### 2.7 提交咨询评价

`POST /api/v1/student/feedback`

**Request Body**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sessionId | number | ✓ | 咨询会话 ID |
| rating | number | ✓ | 评分，整数，1-5 |
| content | string | ✗ | 文字评价 |
| isAnonymous | boolean | ✗ | 是否匿名，默认 false |

**示例请求**

```json
{
  "sessionId": 1,
  "rating": 5,
  "content": "咨询师非常耐心，给了我很多帮助。",
  "isAnonymous": false
}
```

**示例响应** `201`

```json
{
  "code": 201,
  "data": {
    "id": 1,
    "sessionId": 1,
    "studentId": 1,
    "counselorId": 2,
    "rating": 5,
    "content": "咨询师非常耐心，给了我很多帮助。",
    "isAnonymous": false,
    "createdAt": "2026-03-09T16:00:00.000Z"
  },
  "message": "success"
}
```

**错误码**

| code | 说明 |
|------|------|
| 400 | 缺少 sessionId 或 rating |
| 400 | 评分不在 1-5 之间 |
| 400 | 咨询尚未完成，无法评价 |
| 403 | 无权评价此咨询 |
| 404 | 咨询记录不存在 |
| 409 | 已提交过评价，不可重复 |

---

## 三、学生 AI 助手 `/api/v1/student/ai`

> 所有接口需要认证，且 `role` 必须为 `student`。

### 3.1 新建对话

`POST /api/v1/student/ai/conversations`

**Request Body**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | ✗ | 对话标题；不传则在首条消息发送后自动截取前 30 字 |

**示例响应** `201`

```json
{
  "code": 201,
  "data": {
    "id": 1,
    "studentId": 1,
    "title": null,
    "status": "active",
    "createdAt": "2026-03-09T10:30:00.000Z",
    "updatedAt": "2026-03-09T10:30:00.000Z"
  },
  "message": "success"
}
```

---

### 3.2 获取对话列表

`GET /api/v1/student/ai/conversations`

**Query Params**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | ✗ | 页码，默认 1 |
| pageSize | number | ✗ | 每页条数，默认 20 |

**示例响应** `200`

```json
{
  "code": 200,
  "data": {
    "total": 2,
    "page": 1,
    "pageSize": 20,
    "list": [
      {
        "id": 2,
        "studentId": 1,
        "title": "学业压力太大怎么办",
        "status": "active",
        "createdAt": "2026-03-09T11:00:00.000Z",
        "updatedAt": "2026-03-09T11:30:00.000Z"
      }
    ]
  },
  "message": "success"
}
```

---

### 3.3 获取消息历史

`GET /api/v1/student/ai/conversations/:id/messages`

**Path Params**

| 参数 | 说明 |
|------|------|
| id | 对话 ID |

**示例响应** `200`

```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "conversationId": 1,
      "role": "user",
      "content": "最近学业压力很大，睡不着觉",
      "tokensUsed": null,
      "createdAt": "2026-03-09T10:31:00.000Z"
    },
    {
      "id": 2,
      "conversationId": 1,
      "role": "assistant",
      "content": "我听到了你的感受，学业压力确实会让人很焦虑……",
      "tokensUsed": 150,
      "createdAt": "2026-03-09T10:31:05.000Z"
    }
  ],
  "message": "success"
}
```

---

### 3.4 发送消息（SSE 流式输出）

`POST /api/v1/student/ai/conversations/:id/messages`

> 响应为 Server-Sent Events（`Content-Type: text/event-stream`），需用 `fetch` + `ReadableStream` 接收，**不能用 EventSource**（因为需要携带 POST body 和 Authorization 头）。

**Path Params**

| 参数 | 说明 |
|------|------|
| id | 对话 ID |

**Request Body**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | ✓ | 用户消息内容，不能为空字符串 |

**SSE 事件格式**

每个事件为一行 `data: {...}\n\n`，JSON 结构如下：

| type | 说明 | 额外字段 |
|------|------|---------|
| `delta` | AI 回复的增量文字片段 | `content: string` |
| `done` | 流式输出结束 | 无 |
| `error` | 发生错误 | `message: string` |

**前端接收示例（JavaScript）**

```js
const abortController = new AbortController();

const res = await fetch(`/api/v1/student/ai/conversations/${id}/messages`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({ content: '最近压力很大' }),
  signal: abortController.signal,
});

const reader = res.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const text = decoder.decode(value, { stream: true });
  for (const line of text.split('\n')) {
    if (line.startsWith('data: ')) {
      const event = JSON.parse(line.slice(6));
      if (event.type === 'delta') {
        // 追加到消息内容
      } else if (event.type === 'done') {
        // 流结束
      } else if (event.type === 'error') {
        // 显示错误
      }
    }
  }
}

// 中断流：abortController.abort()
```

**错误码**（flushHeaders 前，普通 JSON 响应）

| code | 说明 |
|------|------|
| 400 | 消息内容为空 |
| 403 | 无权访问此对话 |
| 404 | 对话不存在 |

---

## 四、咨询师端 `/api/v1/counselor`

> 所有接口需要认证，且 `role` 必须为 `counselor`。

### 4.1 查看个人档案

`GET /api/v1/counselor/profile`

**示例响应** `200`

```json
{
  "code": 200,
  "data": {
    "id": 2,
    "username": "counselor01",
    "email": "counselor01@school.edu",
    "avatarUrl": null,
    "createdAt": "2026-03-09T08:00:00.000Z",
    "profile": {
      "id": 1,
      "userId": 2,
      "realName": "李四",
      "gender": "female",
      "title": "心理咨询师",
      "qualification": "国家二级心理咨询师",
      "specialties": ["焦虑", "压力管理"],
      "bio": "从业 8 年，擅长认知行为疗法。",
      "availableSlots": {
        "Mon": ["09:00-10:00", "14:00-15:00"],
        "Wed": ["09:00-10:00"]
      },
      "maxAppointmentsPerDay": 5,
      "phone": "13800138001",
      "isAccepting": true,
      "updatedAt": "2026-03-09T09:00:00.000Z"
    }
  },
  "message": "success"
}
```

---

### 4.2 更新/创建档案

`PUT /api/v1/counselor/profile`

> 首次创建时 `realName` 为必填，后续更新可传任意子集。

**Request Body**（所有字段可选，首次创建时 `realName` 必填）

| 字段 | 类型 | 说明 |
|------|------|------|
| realName | string | 真实姓名 |
| gender | string | `"male"` / `"female"` / `"other"` |
| title | string | 职称 |
| qualification | string | 资质证书说明 |
| specialties | array | 擅长方向，字符串数组，如 `["焦虑", "压力管理"]` |
| bio | string | 个人简介 |
| availableSlots | object | 可预约时段，格式见下方说明 |
| maxAppointmentsPerDay | number | 每日最大接诊数，默认 5 |
| phone | string | 联系电话 |
| isAccepting | boolean | 是否接受新预约 |

**`availableSlots` 格式**

```json
{
  "Mon": ["09:00-10:00", "14:00-15:00"],
  "Tue": [],
  "Wed": ["09:00-10:00"],
  "Thu": [],
  "Fri": ["14:00-15:00"],
  "Sat": [],
  "Sun": []
}
```

> 时段字符串格式为 `HH:MM-HH:MM`，前端预约时会自动补 `:00` 后缀转换为 `HH:MM:SS`。

**示例响应** `200` — 同 4.1 的 `profile` 对象。

---

### 4.3 获取预约列表

`GET /api/v1/counselor/appointments`

**Query Params**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | ✗ | `pending` / `confirmed` / `completed` / `cancelled` |
| page | number | ✗ | 页码，默认 1 |
| pageSize | number | ✗ | 每页条数，默认 10 |

**示例响应** `200`

```json
{
  "code": 200,
  "data": {
    "total": 5,
    "page": 1,
    "pageSize": 10,
    "list": [
      {
        "id": 1,
        "studentId": 1,
        "counselorId": 2,
        "appointmentDate": "2026-03-15",
        "startTime": "09:00:00",
        "endTime": "10:00:00",
        "type": "offline",
        "reason": "学业压力较大",
        "status": "pending",
        "student": {
          "id": 1,
          "username": "zhangsan",
          "avatarUrl": null,
          "studentProfile": {
            "realName": "张三",
            "grade": "大三",
            "major": "计算机科学",
            "college": "信息学院"
          }
        }
      }
    ]
  },
  "message": "success"
}
```

---

### 4.4 确认/拒绝预约

`PUT /api/v1/counselor/appointments/:id`

**Path Params**

| 参数 | 说明 |
|------|------|
| id | 预约 ID |

**Request Body**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | ✓ | `"confirm"` 或 `"reject"` |
| cancelReason | string | ✗ | 拒绝原因（`action = "reject"` 时建议填写） |

**示例请求**

```json
{ "action": "confirm" }
```

```json
{ "action": "reject", "cancelReason": "该时段临时有会议" }
```

**示例响应** `200` — 返回更新后的预约对象。

**错误码**

| code | 说明 |
|------|------|
| 400 | action 不合法 |
| 400 | 预约状态不是 pending |
| 403 | 无权操作此预约 |
| 404 | 预约不存在 |

---

### 4.5 获取会话列表

`GET /api/v1/counselor/sessions`

**Query Params**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | ✗ | `in_progress` / `completed` |
| page | number | ✗ | 页码，默认 1 |
| pageSize | number | ✗ | 每页条数，默认 10 |

**示例响应** `200`

```json
{
  "code": 200,
  "data": {
    "total": 3,
    "page": 1,
    "pageSize": 10,
    "list": [
      {
        "id": 1,
        "appointmentId": 1,
        "studentId": 1,
        "counselorId": 2,
        "type": "individual",
        "status": "in_progress",
        "startedAt": "2026-03-15T09:05:00.000Z",
        "endedAt": null,
        "student": {
          "id": 1,
          "username": "zhangsan",
          "avatarUrl": null,
          "studentProfile": { "realName": "张三" }
        },
        "appointment": {
          "appointmentDate": "2026-03-15",
          "startTime": "09:00:00",
          "endTime": "10:00:00",
          "type": "offline"
        }
      }
    ]
  },
  "message": "success"
}
```

---

### 4.6 开始会话

`POST /api/v1/counselor/sessions`

**Request Body**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| appointmentId | number | ✗ | 关联预约 ID；不传表示临时安排 |
| studentId | number | ✓ | 学生 user.id |
| type | string | ✗ | `"individual"`（默认）/ `"group"` |

**示例请求**

```json
{
  "appointmentId": 1,
  "studentId": 1,
  "type": "individual"
}
```

**示例响应** `201`

```json
{
  "code": 201,
  "data": {
    "id": 1,
    "appointmentId": 1,
    "studentId": 1,
    "counselorId": 2,
    "type": "individual",
    "status": "in_progress",
    "startedAt": "2026-03-15T09:05:00.000Z",
    "endedAt": null
  },
  "message": "success"
}
```

> 开始会话后，关联预约状态自动更新为 `completed`。

**错误码**

| code | 说明 |
|------|------|
| 400 | 缺少 studentId |
| 400 | 预约状态不是 confirmed |
| 403 | 无权操作此预约 |
| 404 | 预约不存在 |
| 409 | 该预约已存在关联会话 |

---

### 4.7 结束会话

`PUT /api/v1/counselor/sessions/:id`

**Path Params**

| 参数 | 说明 |
|------|------|
| id | 会话 ID |

**Request Body**：无需传参，直接请求即可。

**示例响应** `200`

```json
{
  "code": 200,
  "data": {
    "id": 1,
    "status": "completed",
    "endedAt": "2026-03-15T10:00:00.000Z"
  },
  "message": "success"
}
```

**错误码**

| code | 说明 |
|------|------|
| 400 | 会话状态不是 in_progress |
| 403 | 无权操作此会话 |
| 404 | 会话不存在 |

---

### 4.8 添加案例笔记

`POST /api/v1/counselor/sessions/:id/notes`

**Path Params**

| 参数 | 说明 |
|------|------|
| id | 会话 ID |

**Request Body**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | ✓ | 笔记内容，不能为空 |
| riskLevel | string | ✗ | `"low"`（默认）/ `"medium"` / `"high"` |
| followUpRequired | boolean | ✗ | 是否需要跟进，默认 false |
| isPrivate | boolean | ✗ | 是否私密（仅咨询师可见），默认 true |

**示例请求**

```json
{
  "content": "学生表现出明显的学业焦虑症状，建议每周进行一次咨询。",
  "riskLevel": "low",
  "followUpRequired": true,
  "isPrivate": true
}
```

**示例响应** `201`

```json
{
  "code": 201,
  "data": {
    "id": 1,
    "sessionId": 1,
    "counselorId": 2,
    "content": "学生表现出明显的学业焦虑症状，建议每周进行一次咨询。",
    "riskLevel": "low",
    "followUpRequired": true,
    "isPrivate": true,
    "createdAt": "2026-03-15T10:05:00.000Z"
  },
  "message": "success"
}
```

---

### 4.9 获取案例笔记列表

`GET /api/v1/counselor/sessions/:id/notes`

**Path Params**

| 参数 | 说明 |
|------|------|
| id | 会话 ID |

**示例响应** `200`

```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "sessionId": 1,
      "counselorId": 2,
      "content": "学生表现出明显的学业焦虑症状。",
      "riskLevel": "low",
      "followUpRequired": true,
      "isPrivate": true,
      "createdAt": "2026-03-15T10:05:00.000Z"
    }
  ],
  "message": "success"
}
```

---

## 五、学校管理端 `/api/v1/school`

> 所有接口需要认证，且 `role` 必须为 `school`。

### 5.1 获取平台统计数据

`GET /api/v1/school/stats`

**示例响应** `200`

```json
{
  "code": 200,
  "data": {
    "studentCount": 120,
    "counselorCount": 5,
    "appointmentCount": 80,
    "completedSessionCount": 60,
    "avgRating": 4.72
  },
  "message": "success"
}
```

> `avgRating` 为所有 feedback 的平均评分（保留 2 位小数），无评价时为 `null`。

---

### 5.2 获取咨询师列表

`GET /api/v1/school/counselors`

**Query Params**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | ✗ | 页码，默认 1 |
| pageSize | number | ✗ | 每页条数，默认 20 |

**示例响应** `200`

```json
{
  "code": 200,
  "data": {
    "total": 5,
    "page": 1,
    "pageSize": 20,
    "list": [
      {
        "id": 2,
        "username": "counselor01",
        "email": "counselor01@school.edu",
        "isActive": true,
        "avatarUrl": null,
        "lastLoginAt": "2026-03-09T09:00:00.000Z",
        "createdAt": "2026-03-09T08:00:00.000Z",
        "counselorProfile": {
          "realName": "李四",
          "title": "心理咨询师",
          "specialties": ["焦虑", "压力管理"],
          "isAccepting": true,
          "maxAppointmentsPerDay": 5
        }
      }
    ]
  },
  "message": "success"
}
```

> `counselorProfile` 可能为 `null`（账号创建时未提供 `realName`）。

---

### 5.3 添加咨询师账号

`POST /api/v1/school/counselors`

**Request Body**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | ✓ | 登录用户名 |
| email | string | ✓ | 登录邮箱，需唯一 |
| password | string | ✓ | 初始密码 |
| realName | string | ✗ | 真实姓名；若提供则同时创建咨询师档案 |

**示例请求**

```json
{
  "username": "counselor02",
  "email": "counselor02@school.edu",
  "password": "init@2026",
  "realName": "王五"
}
```

**示例响应** `201`

```json
{
  "code": 201,
  "data": {
    "id": 3,
    "username": "counselor02",
    "email": "counselor02@school.edu",
    "role": "counselor",
    "isActive": true,
    "createdAt": "2026-03-09T10:00:00.000Z"
  },
  "message": "success"
}
```

**错误码**

| code | 说明 |
|------|------|
| 400 | 缺少 username/email/password |
| 409 | 该邮箱已被注册 |

---

### 5.4 启用/禁用咨询师账号

`PUT /api/v1/school/counselors/:id/status`

**Path Params**

| 参数 | 说明 |
|------|------|
| id | 咨询师 user.id |

**Request Body**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| isActive | boolean | ✓ | `true` 启用 / `false` 禁用 |

**示例请求**

```json
{ "isActive": false }
```

**示例响应** `200`

```json
{
  "code": 200,
  "data": {
    "id": 2,
    "username": "counselor01",
    "email": "counselor01@school.edu",
    "isActive": false
  },
  "message": "success"
}
```

**错误码**

| code | 说明 |
|------|------|
| 400 | isActive 不是布尔值 |
| 404 | 咨询师不存在 |

---

### 5.5 获取公告列表

`GET /api/v1/school/announcements`

> 管理端接口，默认返回所有状态公告（含草稿）。

**Query Params**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | ✗ | `"draft"` / `"published"` / `"all"`（默认） |
| page | number | ✗ | 页码，默认 1 |
| pageSize | number | ✗ | 每页条数，默认 20 |

**示例响应** `200`

```json
{
  "code": 200,
  "data": {
    "total": 4,
    "page": 1,
    "pageSize": 20,
    "list": [
      {
        "id": 1,
        "authorId": 3,
        "title": "2026 年春季学期心理健康周活动通知",
        "content": "本学期心理健康周将于 3 月 20 日至 3 月 26 日举行……",
        "targetRole": "all",
        "isPinned": true,
        "publishedAt": "2026-03-09T08:00:00.000Z",
        "expiresAt": "2026-03-26T23:59:59.000Z",
        "createdAt": "2026-03-09T07:50:00.000Z",
        "author": {
          "id": 3,
          "username": "school_admin"
        }
      }
    ]
  },
  "message": "success"
}
```

**`targetRole` 枚举**

| 值 | 说明 |
|----|------|
| `"all"` | 全体用户 |
| `"student"` | 仅学生 |
| `"counselor"` | 仅咨询师 |

---

### 5.6 创建公告

`POST /api/v1/school/announcements`

**Request Body**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | ✓ | 公告标题 |
| content | string | ✓ | 公告正文 |
| targetRole | string | ✗ | `"all"`（默认）/ `"student"` / `"counselor"` |
| isPinned | boolean | ✗ | 是否置顶，默认 false |
| publish | boolean | ✗ | `true` 立即发布，`false`（默认）保存为草稿 |
| expiresAt | string | ✗ | 过期时间，ISO 8601 格式；不传则永不过期 |

**示例请求**

```json
{
  "title": "2026 年春季学期心理健康周活动通知",
  "content": "本学期心理健康周将于 3 月 20 日至 3 月 26 日举行……",
  "targetRole": "all",
  "isPinned": true,
  "publish": true,
  "expiresAt": "2026-03-26T23:59:59.000Z"
}
```

**示例响应** `201`

```json
{
  "code": 201,
  "data": {
    "id": 1,
    "authorId": 3,
    "title": "2026 年春季学期心理健康周活动通知",
    "content": "本学期心理健康周将于 3 月 20 日至 3 月 26 日举行……",
    "targetRole": "all",
    "isPinned": true,
    "publishedAt": "2026-03-09T08:00:00.000Z",
    "expiresAt": "2026-03-26T23:59:59.000Z",
    "createdAt": "2026-03-09T08:00:00.000Z"
  },
  "message": "success"
}
```

**错误码**

| code | 说明 |
|------|------|
| 400 | 缺少 title 或 content |

---

### 5.7 删除公告

`DELETE /api/v1/school/announcements/:id`

**Path Params**

| 参数 | 说明 |
|------|------|
| id | 公告 ID |

**示例响应** `200`

```json
{
  "code": 200,
  "data": { "id": 1 },
  "message": "success"
}
```

**错误码**

| code | 说明 |
|------|------|
| 404 | 公告不存在 |

---

## 六、健康检查

`GET /health`

> 无需认证，用于监控服务存活状态。

**示例响应** `200`

```json
{
  "code": 200,
  "data": { "uptime": 3600, "timestamp": "2026-03-09T10:00:00.000Z" },
  "message": "ok"
}
```

---

## 附录：状态枚举

### 预约状态 `appointments.status`

| 值 | 说明 |
|----|------|
| `pending` | 待咨询师确认 |
| `confirmed` | 已确认 |
| `completed` | 已完成（咨询师开始会话时自动更新） |
| `cancelled` | 已取消（学生主动取消或咨询师拒绝） |

### 会话状态 `sessions.status`

| 值 | 说明 |
|----|------|
| `in_progress` | 进行中 |
| `completed` | 已结束 |

### AI 对话状态 `ai_conversations.status`

| 值 | 说明 |
|----|------|
| `active` | 活跃 |
| `archived` | 已归档 |

### 风险等级 `session_notes.risk_level`

| 值 | 说明 |
|----|------|
| `low` | 低风险（一般情绪困扰） |
| `medium` | 中等风险（需要关注） |
| `high` | 高风险（有危机迹象，需立即干预） |
