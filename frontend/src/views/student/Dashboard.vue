<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h2>欢迎回来，{{ user?.username }}</h2>
        <p class="date">{{ today }}</p>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div v-for="stat in stats" :key="stat.label" class="stat-card">
        <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
        <div class="stat-label">{{ stat.label }}</div>
      </div>
    </div>

    <!-- 近期预约 -->
    <div class="card">
      <div class="card-header">
        <h3>近期预约</h3>
        <RouterLink to="/student/appointments" class="link-more">查看全部 →</RouterLink>
      </div>
      <div v-if="loading" class="state-text">加载中...</div>
      <div v-else-if="recentList.length === 0" class="state-text">暂无预约记录，<RouterLink to="/student/counselors" class="inline-link">去预约</RouterLink></div>
      <div v-else class="apt-list">
        <div v-for="apt in recentList" :key="apt.id" class="apt-row">
          <div class="apt-info">
            <span class="counselor-name">{{ apt.counselor?.counselorProfile?.realName || apt.counselor?.username }}</span>
            <span class="apt-time">{{ apt.appointmentDate }} &nbsp;{{ apt.startTime?.slice(0, 5) }}–{{ apt.endTime?.slice(0, 5) }}</span>
          </div>
          <span :class="['status-badge', `s-${apt.status}`]">{{ statusLabel[apt.status] }}</span>
        </div>
      </div>
    </div>

    <!-- 最新公告 -->
    <div class="card">
      <div class="card-header">
        <h3>最新公告</h3>
        <RouterLink to="/student/announcements" class="link-more">查看全部 →</RouterLink>
      </div>
      <div v-if="announcementsLoading" class="state-text">加载中...</div>
      <div v-else-if="latestAnnouncements.length === 0" class="state-text">暂无公告</div>
      <div v-else class="ann-list">
        <div v-for="ann in latestAnnouncements" :key="ann.id" class="ann-row">
          <div class="ann-info">
            <span v-if="ann.isPinned" class="pin-badge">置顶</span>
            <span class="ann-title">{{ ann.title }}</span>
          </div>
          <span class="ann-date">{{ formatDate(ann.publishedAt) }}</span>
        </div>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="card">
      <h3>快速操作</h3>
      <div class="quick-grid">
        <RouterLink to="/student/counselors" class="quick-card">
          <span class="q-icon">👨‍⚕️</span>
          <span>预约咨询师</span>
        </RouterLink>
        <RouterLink to="/student/ai" class="quick-card">
          <span class="q-icon">🤖</span>
          <span>AI 心理助手</span>
        </RouterLink>
        <RouterLink to="/student/profile" class="quick-card">
          <span class="q-icon">👤</span>
          <span>完善档案</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import { studentApi } from '@/api/student'

const { user } = storeToRefs(useAuthStore())
const loading = ref(false)
const allList = ref([])
const announcementsLoading = ref(false)
const latestAnnouncements = ref([])

const today = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  })
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

const statusLabel = {
  pending: '待确认',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消',
}

const stats = computed(() => {
  const list = allList.value
  return [
    { label: '待确认', value: list.filter(a => a.status === 'pending').length, color: '#f59e0b' },
    { label: '已确认', value: list.filter(a => a.status === 'confirmed').length, color: '#667eea' },
    { label: '已完成', value: list.filter(a => a.status === 'completed').length, color: '#10b981' },
    { label: '全部预约', value: list.length, color: '#64748b' },
  ]
})

const recentList = computed(() => allList.value.slice(0, 5))

onMounted(async () => {
  loading.value = true
  announcementsLoading.value = true
  try {
    const [aptRes, annRes] = await Promise.all([
      studentApi.getAppointments({ pageSize: 20 }),
      studentApi.getAnnouncements({ pageSize: 3 }),
    ])
    allList.value = aptRes.data?.list || []
    latestAnnouncements.value = annRes.data?.list || []
  } catch {
    // ignore
  } finally {
    loading.value = false
    announcementsLoading.value = false
  }
})
</script>

<style scoped>
.page {
  padding: 32px;
  max-width: 900px;
}

.page-header {
  margin-bottom: 28px;
}

h2 {
  font-size: 24px;
  color: #1a1a2e;
  margin: 0 0 4px;
  font-weight: 700;
}

.date {
  color: #94a3b8;
  font-size: 14px;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  color: #94a3b8;
  font-size: 13px;
  margin-top: 6px;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

h3 {
  font-size: 16px;
  color: #1a1a2e;
  margin: 0 0 16px;
  font-weight: 600;
}

.card-header h3 {
  margin: 0;
}

.link-more {
  font-size: 13px;
  color: #667eea;
  text-decoration: none;
}

.link-more:hover {
  text-decoration: underline;
}

.inline-link {
  color: #667eea;
}

.state-text {
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
  padding: 20px 0;
}

.apt-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.apt-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: #f8fafc;
  border-radius: 8px;
}

.apt-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.counselor-name {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
}

.apt-time {
  font-size: 12px;
  color: #94a3b8;
}

.status-badge {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 20px;
  font-weight: 500;
  flex-shrink: 0;
}

.s-pending  { background: #fef3c7; color: #d97706; }
.s-confirmed { background: #ede9fe; color: #7c3aed; }
.s-completed { background: #d1fae5; color: #059669; }
.s-cancelled { background: #f1f5f9; color: #94a3b8; }

.quick-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.quick-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 32px;
  background: #f8fafc;
  border-radius: 12px;
  text-decoration: none;
  color: #1a1a2e;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  min-width: 120px;
}

.quick-card:hover {
  background: #ede9fe;
  color: #667eea;
}

.q-icon {
  font-size: 28px;
}

.ann-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ann-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #f8fafc;
  border-radius: 8px;
}

.ann-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.pin-badge {
  flex-shrink: 0;
  font-size: 11px;
  background: #fef3c7;
  color: #d97706;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.ann-title {
  font-size: 14px;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 520px;
}

.ann-date {
  flex-shrink: 0;
  font-size: 12px;
  color: #94a3b8;
  margin-left: 12px;
}
</style>
