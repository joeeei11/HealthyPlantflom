<template>
  <div class="page">
    <div class="page-header">
      <h2>咨询会话</h2>
    </div>

    <!-- 状态筛选 -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="['tab-btn', { active: currentTab === tab.value }]"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="loading" class="state-text">加载中...</div>
    <div v-else-if="list.length === 0" class="state-text">暂无会话记录</div>
    <div v-else class="session-list">
      <div v-for="s in list" :key="s.id" class="session-card">
        <div class="session-main">
          <div class="student-info">
            <div class="student-avatar">{{ getAvatar(s) }}</div>
            <div>
              <div class="student-name">{{ s.student?.studentProfile?.realName || s.student?.username }}</div>
              <div class="session-meta">
                <span :class="['status-dot', `dot-${s.status}`]"></span>
                {{ sessionStatusLabel[s.status] }}
              </div>
            </div>
          </div>
          <span :class="['status-badge', `ss-${s.status}`]">{{ sessionStatusLabel[s.status] }}</span>
        </div>

        <div class="session-detail">
          <div class="detail-item">
            <span class="detail-icon">▶</span>
            <span>开始：{{ formatDt(s.startedAt) }}</span>
          </div>
          <div v-if="s.endedAt" class="detail-item">
            <span class="detail-icon">■</span>
            <span>结束：{{ formatDt(s.endedAt) }}</span>
          </div>
          <div v-if="s.appointment" class="detail-item">
            <span class="detail-icon">📅</span>
            <span>预约：{{ s.appointment.appointmentDate }} {{ s.appointment.startTime?.slice(0, 5) }}–{{ s.appointment.endTime?.slice(0, 5) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-icon">🔖</span>
            <span>{{ typeLabel[s.type] || s.type }}</span>
          </div>
        </div>

        <div class="session-actions">
          <button
            v-if="s.status === 'in_progress'"
            class="btn-end"
            :disabled="endingId === s.id"
            @click="openEndDialog(s)"
          >
            {{ endingId === s.id ? '处理中...' : '结束会话' }}
          </button>
          <button class="btn-detail" @click="goToDetail(s)">查看详情</button>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="pagination">
      <button :disabled="page <= 1" class="page-btn" @click="changePage(page - 1)">上一页</button>
      <span class="page-info">第 {{ page }} 页 / 共 {{ Math.ceil(total / pageSize) }} 页</span>
      <button :disabled="page >= Math.ceil(total / pageSize)" class="page-btn" @click="changePage(page + 1)">下一页</button>
    </div>

    <!-- 结束确认弹窗 -->
    <div v-if="endDialog.open" class="modal-mask" @click.self="closeEndDialog">
      <div class="modal">
        <div class="modal-header">
          <h3>结束会话</h3>
          <button class="modal-close" @click="closeEndDialog">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-tip">
            确定结束与
            <strong>{{ endDialog.session?.student?.studentProfile?.realName || endDialog.session?.student?.username }}</strong>
            的会话吗？结束后将无法恢复进行中状态。
          </p>
          <p v-if="endError" class="error-msg">{{ endError }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-outline" :disabled="ending" @click="closeEndDialog">返回</button>
          <button class="btn-primary-green" :disabled="ending" @click="confirmEnd">
            {{ ending ? '处理中...' : '确认结束' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { counselorApi } from '@/api/counselor'

const router = useRouter()

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const currentTab = ref('')
const endingId = ref(null)
const ending = ref(false)
const endError = ref('')
const toast = ref('')

const endDialog = reactive({
  open: false,
  session: null,
})

const tabs = [
  { label: '全部', value: '' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
]

const sessionStatusLabel = {
  in_progress: '进行中',
  completed: '已完成',
}

const typeLabel = {
  individual: '个体咨询',
  group: '团体咨询',
  offline: '线下面谈',
  online: '线上视频',
}

function getAvatar(s) {
  const name = s.student?.studentProfile?.realName || s.student?.username || '?'
  return name.charAt(0).toUpperCase()
}

function formatDt(t) {
  if (!t) return '—'
  return new Date(t).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function showToast(msg) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 3000)
}

function goToDetail(session) {
  // JSON roundtrip converts Vue reactive Proxy to plain object,
  // preventing history.pushState serialization failure
  const plainSession = JSON.parse(JSON.stringify(session))
  router.push({ path: `/counselor/sessions/${plainSession.id}`, state: { session: plainSession } })
}

function openEndDialog(session) {
  endDialog.open = true
  endDialog.session = session
  endError.value = ''
}

function closeEndDialog() {
  endDialog.open = false
  endDialog.session = null
}

async function confirmEnd() {
  ending.value = true
  endError.value = ''
  try {
    endingId.value = endDialog.session.id
    await counselorApi.endSession(endDialog.session.id)
    closeEndDialog()
    showToast('会话已结束')
    loadList()
  } catch (e) {
    endError.value = e.message || '操作失败，请重试'
  } finally {
    ending.value = false
    endingId.value = null
  }
}

async function loadList() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (currentTab.value) params.status = currentTab.value
    const res = await counselorApi.getSessions(params)
    list.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function switchTab(val) {
  currentTab.value = val
  page.value = 1
  loadList()
}

function changePage(p) {
  page.value = p
  loadList()
}

onMounted(loadList)
</script>

<style scoped>
.page {
  padding: 32px;
  max-width: 860px;
  position: relative;
}

.page-header {
  margin-bottom: 24px;
}

h2 {
  font-size: 22px;
  color: #1a1a2e;
  margin: 0;
  font-weight: 700;
}

.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  background: #fff;
  border-radius: 10px;
  padding: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  width: fit-content;
}

.tab-btn {
  background: none;
  border: none;
  border-radius: 7px;
  padding: 8px 16px;
  font-size: 14px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #1a1a2e;
  background: #f8fafc;
}

.tab-btn.active {
  background: #48bb78;
  color: #fff;
}

.state-text {
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
  padding: 60px 0;
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.session-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.session-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.student-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.student-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #48bb78, #2f855a);
  color: #fff;
  font-size: 17px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.student-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
}

.session-meta {
  font-size: 13px;
  color: #94a3b8;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-in_progress { background: #48bb78; }
.dot-completed { background: #94a3b8; }

.status-badge {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 500;
  flex-shrink: 0;
}

.ss-in_progress { background: #f0fff4; color: #38a169; }
.ss-completed { background: #f1f5f9; color: #64748b; }

.session-detail {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  padding: 12px 0;
  border-top: 1px solid #f1f5f9;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #64748b;
}

.detail-icon {
  font-size: 11px;
  color: #94a3b8;
}

.session-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-end {
  background: none;
  border: 1px solid #fca5a5;
  color: #ef4444;
  border-radius: 7px;
  padding: 7px 16px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-end:hover:not(:disabled) {
  background: #fef2f2;
}

.btn-end:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-detail {
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  padding: 7px 16px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-detail:hover {
  background: #f0fff4;
  color: #48bb78;
  border-color: #9ae6b4;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}

.page-btn {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: #64748b;
}

/* 弹窗 */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 16px;
  width: 440px;
  max-width: 95vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f1f5f9;
}

.modal-header h3 {
  font-size: 16px;
  color: #1a1a2e;
  margin: 0;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 18px;
  cursor: pointer;
}

.modal-body {
  padding: 20px 24px;
}

.modal-tip {
  font-size: 14px;
  color: #475569;
  margin: 0;
  line-height: 1.6;
}

.error-msg {
  background: #fef2f2;
  color: #ef4444;
  border-radius: 6px;
  padding: 8px 14px;
  font-size: 13px;
  margin-top: 12px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px 20px;
  border-top: 1px solid #f1f5f9;
}

.btn-outline {
  background: transparent;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 9px 22px;
  font-size: 14px;
  cursor: pointer;
}

.btn-outline:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary-green {
  background: #48bb78;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 9px 22px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary-green:hover:not(:disabled) {
  background: #38a169;
}

.btn-primary-green:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
