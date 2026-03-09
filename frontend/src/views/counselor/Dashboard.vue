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
      <div class="stat-card" v-for="s in statCards" :key="s.label">
        <div class="stat-value" :style="{ color: s.color }">{{ s.value }}</div>
        <div class="stat-label">{{ s.label }}</div>
      </div>
    </div>

    <!-- 待确认预约 -->
    <div class="card">
      <div class="card-header">
        <h3>待确认预约</h3>
        <RouterLink to="/counselor/appointments" class="link-more">查看全部 →</RouterLink>
      </div>
      <div v-if="loading" class="state-text">加载中...</div>
      <div v-else-if="pendingList.length === 0" class="state-text">暂无待确认预约</div>
      <div v-else class="row-list">
        <div v-for="apt in pendingList" :key="apt.id" class="row-item">
          <div class="row-info">
            <span class="name">{{ apt.student?.studentProfile?.realName || apt.student?.username }}</span>
            <span class="sub">
              {{ apt.appointmentDate }} &nbsp;{{ apt.startTime?.slice(0, 5) }}–{{ apt.endTime?.slice(0, 5) }}
            </span>
          </div>
          <div class="row-actions">
            <button class="btn-sm btn-green" :disabled="actionId === apt.id" @click="quickAction(apt, 'confirm')">确认</button>
            <button class="btn-sm btn-red" :disabled="actionId === apt.id" @click="quickAction(apt, 'reject')">拒绝</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 进行中会话 -->
    <div class="card">
      <div class="card-header">
        <h3>进行中会话</h3>
        <RouterLink to="/counselor/sessions" class="link-more">查看全部 →</RouterLink>
      </div>
      <div v-if="loading" class="state-text">加载中...</div>
      <div v-else-if="activeList.length === 0" class="state-text">暂无进行中会话</div>
      <div v-else class="row-list">
        <div v-for="s in activeList" :key="s.id" class="row-item">
          <div class="row-info">
            <span class="name">{{ s.student?.studentProfile?.realName || s.student?.username }}</span>
            <span class="sub">{{ formatDt(s.startedAt) }} 开始</span>
          </div>
          <button class="btn-sm btn-outline-green" @click="goToSession(s)">查看</button>
        </div>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="card">
      <h3>快速操作</h3>
      <div class="quick-grid">
        <RouterLink to="/counselor/appointments" class="quick-card">
          <span class="q-icon">📅</span>
          <span>预约管理</span>
        </RouterLink>
        <RouterLink to="/counselor/sessions" class="quick-card">
          <span class="q-icon">💬</span>
          <span>咨询会话</span>
        </RouterLink>
        <RouterLink to="/counselor/profile" class="quick-card">
          <span class="q-icon">👤</span>
          <span>个人档案</span>
        </RouterLink>
      </div>
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import { counselorApi } from '@/api/counselor'

const router = useRouter()
const { user } = storeToRefs(useAuthStore())

const loading = ref(false)
const actionId = ref(null)
const toast = ref('')

const pendingTotal = ref(0)
const confirmedTotal = ref(0)
const activeTotal = ref(0)
const completedTotal = ref(0)
const pendingList = ref([])
const activeList = ref([])

const today = computed(() =>
  new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
)

const statCards = computed(() => [
  { label: '待确认预约', value: pendingTotal.value, color: '#f59e0b' },
  { label: '已确认预约', value: confirmedTotal.value, color: '#48bb78' },
  { label: '进行中会话', value: activeTotal.value, color: '#667eea' },
  { label: '已完成会话', value: completedTotal.value, color: '#10b981' },
])

function formatDt(t) {
  if (!t) return ''
  return new Date(t).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function showToast(msg) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 3000)
}

function goToSession(session) {
  router.push({ path: `/counselor/sessions/${session.id}`, state: { session } })
}

async function quickAction(apt, action) {
  actionId.value = apt.id
  try {
    await counselorApi.updateAppointmentStatus(apt.id, { action })
    showToast(action === 'confirm' ? '预约已确认' : '预约已拒绝')
    await loadData()
  } catch (e) {
    showToast(e.message || '操作失败')
  } finally {
    actionId.value = null
  }
}

async function loadData() {
  loading.value = true
  try {
    const [p, c, a, d] = await Promise.all([
      counselorApi.getAppointments({ status: 'pending', pageSize: 5 }),
      counselorApi.getAppointments({ status: 'confirmed', pageSize: 1 }),
      counselorApi.getSessions({ status: 'in_progress', pageSize: 5 }),
      counselorApi.getSessions({ status: 'completed', pageSize: 1 }),
    ])
    pendingList.value = p.data?.list || []
    pendingTotal.value = p.data?.total || 0
    confirmedTotal.value = c.data?.total || 0
    activeList.value = a.data?.list || []
    activeTotal.value = a.data?.total || 0
    completedTotal.value = d.data?.total || 0
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.page {
  padding: 32px;
  max-width: 900px;
  position: relative;
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
  color: #48bb78;
  text-decoration: none;
}

.link-more:hover {
  text-decoration: underline;
}

.state-text {
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
  padding: 20px 0;
}

.row-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: #f8fafc;
  border-radius: 8px;
}

.row-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.name {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a2e;
}

.sub {
  font-size: 12px;
  color: #94a3b8;
}

.row-actions {
  display: flex;
  gap: 6px;
}

.btn-sm {
  font-size: 12px;
  padding: 5px 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-sm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-green {
  background: #48bb78;
  color: #fff;
}

.btn-green:hover:not(:disabled) {
  background: #38a169;
}

.btn-red {
  background: #fff;
  color: #ef4444;
  border: 1px solid #fca5a5 !important;
}

.btn-red:hover:not(:disabled) {
  background: #fef2f2;
}

.btn-outline-green {
  background: #fff;
  color: #48bb78;
  border: 1px solid #9ae6b4 !important;
}

.btn-outline-green:hover:not(:disabled) {
  background: #f0fff4;
}

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
  background: #f0fff4;
  color: #48bb78;
}

.q-icon {
  font-size: 28px;
}

.toast {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: #1a1a2e;
  color: #fff;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  z-index: 2000;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}
</style>
