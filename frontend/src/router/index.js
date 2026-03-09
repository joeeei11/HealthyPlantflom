import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 角色对应的首页路径
const roleHomeMap = {
  student: '/student',
  counselor: '/counselor',
  school: '/school',
}

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { public: true },
  },

  // 学生端
  {
    path: '/student',
    component: () => import('@/layouts/StudentLayout.vue'),
    meta: { role: 'student' },
    children: [
      {
        path: '',
        name: 'StudentDashboard',
        component: () => import('@/views/student/Dashboard.vue'),
      },
      {
        path: 'profile',
        name: 'StudentProfile',
        component: () => import('@/views/student/Profile.vue'),
      },
      {
        path: 'counselors',
        name: 'StudentCounselors',
        component: () => import('@/views/student/Counselors.vue'),
      },
      {
        path: 'appointments',
        name: 'StudentAppointments',
        component: () => import('@/views/student/Appointments.vue'),
      },
      {
        path: 'ai',
        name: 'StudentAI',
        component: () => import('@/views/student/AIChat.vue'),
      },
      {
        path: 'announcements',
        name: 'StudentAnnouncements',
        component: () => import('@/views/student/Announcements.vue'),
      },
    ],
  },

  // 咨询师端
  {
    path: '/counselor',
    component: () => import('@/layouts/CounselorLayout.vue'),
    meta: { role: 'counselor' },
    children: [
      {
        path: '',
        name: 'CounselorDashboard',
        component: () => import('@/views/counselor/Dashboard.vue'),
      },
      {
        path: 'profile',
        name: 'CounselorProfile',
        component: () => import('@/views/counselor/Profile.vue'),
      },
      {
        path: 'appointments',
        name: 'CounselorAppointments',
        component: () => import('@/views/counselor/Appointments.vue'),
      },
      {
        path: 'sessions',
        name: 'CounselorSessions',
        component: () => import('@/views/counselor/Sessions.vue'),
      },
      {
        path: 'sessions/:id',
        name: 'CounselorSessionDetail',
        component: () => import('@/views/counselor/SessionDetail.vue'),
      },
    ],
  },

  // 学校管理端
  {
    path: '/school',
    component: () => import('@/layouts/SchoolLayout.vue'),
    meta: { role: 'school' },
    children: [
      {
        path: '',
        name: 'SchoolDashboard',
        component: () => import('@/views/school/Dashboard.vue'),
      },
      {
        path: 'counselors',
        name: 'SchoolCounselors',
        component: () => import('@/views/school/Counselors.vue'),
      },
      {
        path: 'announcements',
        name: 'SchoolAnnouncements',
        component: () => import('@/views/school/Announcements.vue'),
      },
    ],
  },

  // 兜底
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // 公开路由直接放行
  if (to.meta.public) {
    // 已登录用户访问 /login 跳转到对应首页
    if (authStore.isLoggedIn && authStore.role) {
      return next(roleHomeMap[authStore.role] || '/login')
    }
    return next()
  }

  // 未登录跳转到登录页
  if (!authStore.isLoggedIn) {
    return next('/login')
  }

  // 角色校验：访问了不属于自己角色的路由
  if (to.meta.role && to.meta.role !== authStore.role) {
    return next(roleHomeMap[authStore.role] || '/login')
  }

  next()
})

export default router
