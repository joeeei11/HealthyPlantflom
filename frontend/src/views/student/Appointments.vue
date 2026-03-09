<template>
  <div class="page">
    <div class="page-header">
      <h2>我的预约</h2>
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
    <div v-else-if="list.length === 0" class="state-text">暂无预约记录</div>
    <div v-else class="apt-list">
      <div v-for="apt in list" :key="apt.id" class="apt-card">
        <div class="apt-main">
          <div class="counselor-info">
            <div class="counselor-avatar">{{ getAvatarLetter(apt) }}</div>
            <div>
              <div class="counselor-name">{{ apt.counselor?.counselorProfile?.realName || apt.counselor?.username }}</div>
              <div class="counselor-title">{{ apt.counselor?.counselorProfile?.title || '咨询师' }}</div>
            </div>
          </div>
          <span :class="['status-badge', `s-${apt.status}`]">{{ statusLabel[apt.status] }}</span>
        </div>

        <div class="apt-detail">
          <div class="detail-item">
            <span class="detail-icon">📅</span>
            <span>{{ apt.appointmentDate }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-icon">🕐</span>
            <span>{{ apt.startTime?.slice(0, 5) }} – {{ apt.endTime?.slice(0, 5) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-icon">📍</span>
            <span>{{ typeLabel[apt.type] || apt.type }}</span>
          </div>
        </div>

        <div v-if="apt.reason" class="apt-reason">
          <span class="reason-label">预约说明：</span>{{ apt.reason }}
        </div>

        <div v-if="apt.status === 'cancelled' && apt.cancelReason" class="apt-reason cancel">
          <span class="reason-label">取消原因：</span>{{ apt.cancelReason }}
        </div>

        <!-- 已评价展示 -->
        <div v-if="apt.session?.feedback" class="feedback-display">
          <span class="feedback-stars">{{ renderStars(apt.session.feedback.rating) }}</span>
          <span class="feedback-rated">已评价</span>
          <span v-if="apt.session.feedback.content" class="feedback-text">{{ apt.session.feedback.content }}</span>
        </div>

        <div class="apt-actions">
          <!-- 取消按钮 -->
          <button
            v-if="canCancel(apt)"
            class="btn-cancel-apt"
            @click="openCancelDialog(apt)"
          >
            取消预约
          </button>
          <!-- 评分按钮：已完成、有 session、未评价 -->
          <button
            v-if="canRate(apt)"
            class="btn-rate"
            @click="openRateDialog(apt)"
          >
            评分
          </button>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="pagination">
      <button :disabled="page <= 1" @click="changePage(page - 1)" class="page-btn">上一页</button>
      <span class="page-info">第 {{ page }} 页 / 共 {{ Math.ceil(total / pageSize) }} 页</span>
      <button :disabled="page >= Math.ceil(total / pageSize)" @click="changePage(page + 1)" class="page-btn">下一页</button>
    </div>

    <!-- 取消确认弹窗 -->
    <div v-if="cancelDialog.open" class="modal-mask" @click.self="closeCancelDialog">
      <div class="modal">
        <div class="modal-header">
          <h3>取消预约</h3>
          <button class="modal-close" @click="closeCancelDialog">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-tip">确定取消与 <strong>{{ cancelDialog.apt?.counselor?.counselorProfile?.realName || cancelDialog.apt?.counselor?.username }}</strong> 于 {{ cancelDialog.apt?.appointmentDate }} 的预约吗？</p>
          <div class="form-item">
            <label>取消原因（选填）</label>
            <textarea v-model="cancelDialog.reason" rows="3" placeholder="请简述取消原因..."></textarea>
          </div>
          <p v-if="cancelError" class="error-msg">{{ cancelError }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-outline" @click="closeCancelDialog" :disabled="cancelling">返回</button>
          <button class="btn-danger" @click="confirmCancel" :disabled="cancelling">
            {{ cancelling ? '处理中...' : '确认取消' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 评分弹窗 -->
    <div v-if="rateDialog.open" class="modal-mask" @click.self="closeRateDialog">
      <div class="modal">
        <div class="modal-header">
          <h3>咨询评价</h3>
          <button class="modal-close" @click="closeRateDialog">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-tip">
            请对与 <strong>{{ rateDialog.apt?.counselor?.counselorProfile?.realName || rateDialog.apt?.counselor?.username }}</strong>
            于 {{ rateDialog.apt?.appointmentDate }} 的咨询进行评价
          </p>
          <!-- 星级选择 -->
          <div class="form-item">
            <label>评分（必填）</label>
            <div class="star-picker">
              <button
                v-for="n in 5"
                :key="n"
                :class="['star-btn', { active: rateDialog.rating >= n }]"
                @click="rateDialog.rating = n"
                type="button"
              >★</button>
              <span class="star-hint">{{ rateHint[rateDialog.rating] || '请选择星级' }}</span>
            </div>
          </div>
          <!-- 文字评价 -->
          <div class="form-item">
            <label>评价内容（选填）</label>
            <textarea v-model="rateDialog.content" rows="3" placeholder="请分享您的咨询体验..."></textarea>
          </div>
          <!-- 匿名选项 -->
          <div class="form-item checkbox-item">
            <label>
              <input type="checkbox" v-model="rateDialog.isAnonymous" />
              匿名提交
            </label>
          </div>
          <p v-if="rateError" class="error-msg">{{ rateError }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-outline" @click="closeRateDialog" :disabled="rating">取消</button>
          <button class="btn-primary" @click="confirmRate" :disabled="rating || !rateDialog.rating">
            {{ rating ? '提交中...' : '提交评价' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 成功提示 -->
    <div v-if="successMsg" class="toast">{{ successMsg }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { studentApi } from '@/api/student'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const currentTab = ref('')

const cancelling = ref(false)
const cancelError = ref('')
const rating = ref(false)
const rateError = ref('')
const successMsg = ref('')

const cancelDialog = reactive({
  open: false,
  apt: null,
  reason: '',
})

const rateDialog = reactive({
  open: false,
  apt: null,
  rating: 0,
  content: '',
  isAnonymous: false,
})

const tabs = [
  { label: '全部', value: '' },
  { label: '待确认', value: 'pending' },
  { label: '已确认', value: 'confirmed' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
]

const statusLabel = {
  pending: '待确认',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消',
}

const typeLabel = {
  offline: '线下面谈',
  online: '线上视频',
  phone: '电话',
}

const rateHint = {
  1: '很差',
  2: '较差',
  3: '一般',
  4: '满意',
  5: '非常满意',
}

function getAvatarLetter(apt) {
  const name = apt.counselor?.counselorProfile?.realName || apt.counselor?.username || '?'
  return name.charAt(0).toUpperCase()
}

function canCancel(apt) {
  return ['pending', 'confirmed'].includes(apt.status)
}

function canRate(apt) {
  return apt.status === 'completed' && apt.session && !apt.session.feedback
}

function renderStars(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}

async function loadList() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
    }
    if (currentTab.value) params.status = currentTab.value
    const res = await studentApi.getAppointments(params)
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

function openCancelDialog(apt) {
  cancelDialog.open = true
  cancelDialog.apt = apt
  cancelDialog.reason = ''
  cancelError.value = ''
}

function closeCancelDialog() {
  cancelDialog.open = false
  cancelDialog.apt = null
}

async function confirmCancel() {
  cancelling.value = true
  cancelError.value = ''
  try {
    await studentApi.cancelAppointment(cancelDialog.apt.id, {
      cancelReason: cancelDialog.reason || undefined,
    })
    closeCancelDialog()
    showSuccess('预约已取消')
    loadList()
  } catch (e) {
    cancelError.value = e.message || '取消失败，请重试'
  } finally {
    cancelling.value = false
  }
}

function openRateDialog(apt) {
  rateDialog.open = true
  rateDialog.apt = apt
  rateDialog.rating = 0
  rateDialog.content = ''
  rateDialog.isAnonymous = false
  rateError.value = ''
}

function closeRateDialog() {
  rateDialog.open = false
  rateDialog.apt = null
}

async function confirmRate() {
  if (!rateDialog.rating) return
  rating.value = true
  rateError.value = ''
  try {
    await studentApi.submitFeedback({
      sessionId: rateDialog.apt.session.id,
      rating: rateDialog.rating,
      content: rateDialog.content || undefined,
      isAnonymous: rateDialog.isAnonymous,
    })
    closeRateDialog()
    showSuccess('评价提交成功，感谢您的反馈！')
    loadList()
  } catch (e) {
    rateError.value = e.message || '提交失败，请重试'
  } finally {
    rating.value = false
  }
}

function showSuccess(msg) {
  successMsg.value = msg
  setTimeout(() => { successMsg.value = '' }, 3000)
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
  background: #667eea;
  color: #fff;
}

.state-text {
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
  padding: 60px 0;
}

.apt-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.apt-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.apt-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.counselor-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.counselor-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 17px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.counselor-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
}

.counselor-title {
  font-size: 13px;
  color: #94a3b8;
  margin-top: 2px;
}

.status-badge {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 500;
  flex-shrink: 0;
}

.s-pending  { background: #fef3c7; color: #d97706; }
.s-confirmed { background: #ede9fe; color: #7c3aed; }
.s-completed { background: #d1fae5; color: #059669; }
.s-cancelled { background: #f1f5f9; color: #94a3b8; }

.apt-detail {
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
  font-size: 14px;
}

.apt-reason {
  font-size: 13px;
  color: #64748b;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  margin-bottom: 12px;
}

.apt-reason.cancel {
  background: #fef2f2;
  color: #ef4444;
}

.reason-label {
  font-weight: 500;
}

/* 已评价展示 */
.feedback-display {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f0fdf4;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 13px;
}

.feedback-stars {
  color: #f59e0b;
  font-size: 15px;
  letter-spacing: 1px;
}

.feedback-rated {
  color: #059669;
  font-weight: 500;
}

.feedback-text {
  color: #64748b;
  border-left: 1px solid #d1fae5;
  padding-left: 10px;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.apt-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-cancel-apt {
  background: none;
  border: 1px solid #fca5a5;
  color: #ef4444;
  border-radius: 7px;
  padding: 7px 16px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel-apt:hover {
  background: #fef2f2;
}

.btn-rate {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border: none;
  border-radius: 7px;
  padding: 7px 18px;
  font-size: 13px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-rate:hover {
  opacity: 0.88;
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
  margin: 0 0 16px;
  line-height: 1.6;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.form-item label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.form-item textarea {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 14px;
  color: #1a1a2e;
  outline: none;
  font-family: inherit;
  resize: vertical;
  background: #fff;
}

.form-item textarea:focus {
  border-color: #667eea;
}

.checkbox-item label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #475569;
  cursor: pointer;
  font-weight: normal;
}

/* 星级选择器 */
.star-picker {
  display: flex;
  align-items: center;
  gap: 4px;
}

.star-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #d1d5db;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
  transition: color 0.15s, transform 0.1s;
}

.star-btn:hover,
.star-btn.active {
  color: #f59e0b;
}

.star-btn:hover {
  transform: scale(1.15);
}

.star-hint {
  font-size: 13px;
  color: #94a3b8;
  margin-left: 8px;
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

.btn-danger {
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 9px 22px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 9px 22px;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.88;
}

.btn-primary:disabled {
  opacity: 0.5;
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
