import request from '@/utils/request'

export const counselorApi = {
  // 个人档案
  getProfile: () => request.get('/api/v1/counselor/profile'),
  updateProfile: (data) => request.put('/api/v1/counselor/profile', data),

  // 预约管理
  getAppointments: (params) => request.get('/api/v1/counselor/appointments', { params }),
  updateAppointmentStatus: (id, data) =>
    request.put(`/api/v1/counselor/appointments/${id}`, data),

  // 会话管理
  getSessions: (params) => request.get('/api/v1/counselor/sessions', { params }),
  createSession: (data) => request.post('/api/v1/counselor/sessions', data),
  endSession: (id) => request.put(`/api/v1/counselor/sessions/${id}`),

  // 案例笔记
  getNotes: (sessionId) => request.get(`/api/v1/counselor/sessions/${sessionId}/notes`),
  createNote: (sessionId, data) =>
    request.post(`/api/v1/counselor/sessions/${sessionId}/notes`, data),
}
