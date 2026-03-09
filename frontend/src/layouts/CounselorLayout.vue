<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <span class="logo">心理健康平台</span>
        <span class="role-badge">咨询师</span>
      </div>
      <nav class="nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          active-class="nav-item--active"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
      <div class="sidebar-footer">
        <span class="username">{{ user?.username }}</span>
        <button class="logout-btn" @click="handleLogout">退出</button>
      </div>
    </aside>
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const router = useRouter()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const navItems = [
  { to: '/counselor', icon: '🏠', label: '工作台' },
  { to: '/counselor/appointments', icon: '📅', label: '预约管理' },
  { to: '/counselor/sessions', icon: '💬', label: '咨询会话' },
  { to: '/counselor/profile', icon: '👤', label: '个人档案' },
]

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  background: #f4f6f9;
}

.sidebar {
  width: 220px;
  background: #16213e;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 24px 20px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 6px;
}

.role-badge {
  display: inline-block;
  font-size: 11px;
  background: #48bb78;
  color: #fff;
  padding: 2px 8px;
  border-radius: 12px;
}

.nav {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.nav-item--active {
  background: #48bb78;
  color: #fff;
}

.nav-icon {
  font-size: 16px;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.username {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

.logout-btn {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.main-content {
  flex: 1;
  overflow-y: auto;
}
</style>
