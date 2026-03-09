import request from '@/utils/request'

export const studentApi = {
  // 个人档案
  getProfile: () => request.get('/api/v1/student/profile'),
  updateProfile: (data) => request.put('/api/v1/student/profile', data),

  // 咨询师列表
  getCounselors: (params) => request.get('/api/v1/student/counselors', { params }),

  // 预约
  getAppointments: (params) => request.get('/api/v1/student/appointments', { params }),
  createAppointment: (data) => request.post('/api/v1/student/appointments', data),
  cancelAppointment: (id, data) => request.delete(`/api/v1/student/appointments/${id}`, { data }),

  // 评价
  submitFeedback: (data) => request.post('/api/v1/student/feedback', data),

  // 公告
  getAnnouncements: (params) => request.get('/api/v1/student/announcements', { params }),
}
