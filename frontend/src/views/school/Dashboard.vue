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
        <div class="stat-value" :style="{ color: s.color }">
          <span v-if="loading">—</span>
          <span v-else>{{ s.value ?? '—' }}</span>
        </div>
        <div class="stat-label">{{ s.label }}</div>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="card">
      <h3>快速操作</h3>
      <div class="quick-grid">
        <RouterLink to="/school/counselors" class="quick-card">
          <span class="q-icon">👨‍⚕️</span>
          <span>咨询师管理</span>
        </RouterLink>
        <RouterLink to="/school/announcements" class="quick-card">
          <span class="q-icon">📢</span>
          <span>公告管理</span>
        </RouterLink>
      </div>
    </div>

    <!-- 平台简介 -->
    <div class="card info-card">
      <h3>平台说明</h3>
      <ul class="info-list">
        <li>学生通过学生端预约咨询师，咨询师确认或拒绝后可开始会话。</li>
        <li>咨询师在会话中可录入案例笔记，并评估风险等级。</li>
        <li>管理端可添加咨询师账号、发布全平台公告。</li>
        <li>平均评分来自学生在会话结束后的反馈（1–5 星）。</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import { schoolApi } from '@/api/school'

const { user } = storeToRefs(useAuthStore())
const loading = ref(false)
const stats = ref(null)

const today = computed(() =>
  new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
)

const statCards = computed(() => [
  { label: '在读学生数', value: stats.value?.studentCount, color: '#667eea' },
  { label: '在职咨询师数', value: stats.value?.counselorCount, color: '#48bb78' },
  { label: '累计预约数', value: stats.value?.appointmentCount, color: '#f59e0b' },
  { label: '已完成会话数', value: stats.value?.completedSessionCount, color: '#e94560' },
  {
    label: '平均满意度',
    value: stats.value?.avgRating != null ? `${stats.value.avgRating} ★` : null,
    color: '#0ea5e9',
  },
])

async function loadStats() {
  loading.value = true
  try {
    const res = await schoolApi.getStats()
    stats.value = res.data
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

onMounted(loadStats)
</script>

<style scoped>
.page {
  padding: 32px;
  max-width: 960px;
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
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  color: #94a3b8;
  font-size: 12px;
  margin-top: 6px;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}

h3 {
  font-size: 16px;
  color: #1a1a2e;
  margin: 0 0 16px;
  font-weight: 600;
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
  padding: 20px 40px;
  background: #f8fafc;
  border-radius: 12px;
  text-decoration: none;
  color: #1a1a2e;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  min-width: 140px;
}

.quick-card:hover {
  background: #fef2f4;
  color: #e94560;
}

.q-icon {
  font-size: 28px;
}

.info-card .info-list {
  margin: 0;
  padding-left: 20px;
  color: #64748b;
  font-size: 14px;
  line-height: 2;
}
</style>
