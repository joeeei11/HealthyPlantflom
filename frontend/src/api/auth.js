import request from '@/utils/request'

export const authApi = {
  register: (data) => request.post('/api/v1/auth/register', data),
  login: (data) => request.post('/api/v1/auth/login', data),
  getMe: () => request.get('/api/v1/auth/me'),
  refreshToken: () => request.post('/api/v1/auth/refresh'),
}
