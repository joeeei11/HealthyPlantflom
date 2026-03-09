import request from '@/utils/request'

export const schoolApi = {
  // 统计数据
  getStats: () => request.get('/api/v1/school/stats'),

  // 咨询师管理
  getCounselors: (params) => request.get('/api/v1/school/counselors', { params }),
  createCounselor: (data) => request.post('/api/v1/school/counselors', data),
  updateCounselorStatus: (id, data) =>
    request.put(`/api/v1/school/counselors/${id}/status`, data),

  // 公告管理
  getAnnouncements: (params) => request.get('/api/v1/school/announcements', { params }),
  createAnnouncement: (data) => request.post('/api/v1/school/announcements', data),
  deleteAnnouncement: (id) => request.delete(`/api/v1/school/announcements/${id}`),
}
