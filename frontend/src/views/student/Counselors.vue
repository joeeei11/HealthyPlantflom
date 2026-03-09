<template>
  <div class="page">
    <div class="page-header">
      <h2>咨询师列表</h2>
      <div class="search-bar">
        <input
          v-model="keyword"
          placeholder="搜索咨询师姓名..."
          @keyup.enter="loadCounselors"
        />
        <button class="btn-search" @click="loadCounselors">搜索</button>
      </div>
    </div>

    <div v-if="loading" class="state-text">加载中...</div>
    <div v-else-if="counselors.length === 0" class="state-text">未找到符合条件的咨询师</div>
    <div v-else class="counselor-grid">
      <div
        v-for="c in counselors"
        :key="c.id"
        class="counselor-card"
        @click="openModal(c)"
      >
        <div class="avatar">{{ getAvatarLetter(c) }}</div>
        <div class="info">
          <div class="name">{{ c.counselorProfile?.realName || c.username }}</div>
          <div class="title-text">{{ c.counselorProfile?.title || '咨询师' }}</div>
          <div class="specialties" v-if="c.counselorProfile?.specialties?.length">
            <span v-for="s in c.counselorProfile.specialties.slice(0, 3)" :key="s" class="tag">{{ s }}</span>
          </div>
          <p class="bio">{{ c.counselorProfile?.bio || '暂无简介' }}</p>
        </div>
        <button class="btn-book" @click.stop="openModal(c)">预约</button>
      </div>
    </div>

    <!-- 预约弹窗 -->
    <div v-if="modalOpen" class="modal-mask" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>预约咨询 — {{ selected?.counselorProfile?.realName || selected?.username }}</h3>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>

        <div class="modal-body">
          <!-- 咨询师简介 -->
          <div class="counselor-brief">
            <div class="brief-avatar">{{ getAvatarLetter(selected) }}</div>
            <div>
              <div class="brief-name">{{ selected?.counselorProfile?.realName || selected?.username }}</div>
              <div class="brief-title">{{ selected?.counselorProfile?.title || '咨询师' }}</div>
              <div class="specialties mt4" v-if="selected?.counselorProfile?.specialties?.length">
                <span v-for="s in selected.counselorProfile.specialties" :key="s" class="tag">{{ s }}</span>
              </div>
            </div>
          </div>

          <!-- 预约表单 -->
          <div class="form-section">
            <div class="form-item">
              <label>选择日期 <span class="required">*</span></label>
              <input type="date" v-model="bookForm.date" :min="minDate" @change="onDateChange" />
            </div>

            <div class="form-item">
              <label>选择时段 <span class="required">*</span></label>
              <div v-if="!bookForm.date" class="hint">请先选择日期</div>
              <div v-else-if="availableSlots.length === 0" class="hint warn">该日期无可用时段</div>
              <div v-else class="slot-list">
                <button
                  v-for="slot in availableSlots"
                  :key="slot.raw"
                  :class="['slot-btn', { active: bookForm.slot === slot.raw }]"
                  @click="bookForm.slot = slot.raw"
                >
                  {{ slot.raw }}
                </button>
              </div>
            </div>

            <div class="form-item">
              <label>预约方式</label>
              <select v-model="bookForm.type">
                <option value="offline">线下面谈</option>
                <option value="online">线上视频</option>
              </select>
            </div>

            <div class="form-item">
              <label>预约说明（选填）</label>
              <textarea v-model="bookForm.reason" rows="3" placeholder="简单描述您的情况或需求..."></textarea>
            </div>
          </div>

          <p v-if="bookError" class="error-msg">{{ bookError }}</p>
        </div>

        <div class="modal-footer">
          <button class="btn-outline" @click="closeModal" :disabled="booking">取消</button>
          <button class="btn-primary" @click="submitBook" :disabled="booking">
            {{ booking ? '提交中...' : '确认预约' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 成功提示 -->
    <div v-if="successMsg" class="toast">{{ successMsg }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { studentApi } from '@/api/student'

const loading = ref(false)
const keyword = ref('')
const counselors = ref([])

const modalOpen = ref(false)
const selected = ref(null)
const booking = ref(false)
const bookError = ref('')
const successMsg = ref('')

const bookForm = reactive({
  date: '',
  slot: '',
  type: 'offline',
  reason: '',
})

const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const minDate = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
})

const availableSlots = computed(() => {
  if (!bookForm.date || !selected.value?.counselorProfile?.availableSlots) return []
  const day = dayMap[new Date(bookForm.date + 'T00:00:00').getDay()]
  const slots = selected.value.counselorProfile.availableSlots[day] || []
  return slots.map(s => ({ raw: s }))
})

function getAvatarLetter(c) {
  const name = c?.counselorProfile?.realName || c?.username || '?'
  return name.charAt(0).toUpperCase()
}

async function loadCounselors() {
  loading.value = true
  try {
    const res = await studentApi.getCounselors({ keyword: keyword.value || undefined })
    counselors.value = res.data || []
  } catch {
    counselors.value = []
  } finally {
    loading.value = false
  }
}

function openModal(c) {
  selected.value = c
  bookForm.date = ''
  bookForm.slot = ''
  bookForm.type = 'offline'
  bookForm.reason = ''
  bookError.value = ''
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  selected.value = null
}

function onDateChange() {
  bookForm.slot = ''
}

async function submitBook() {
  if (!bookForm.date) {
    bookError.value = '请选择预约日期'
    return
  }
  if (!bookForm.slot) {
    bookError.value = '请选择预约时段'
    return
  }

  const parts = bookForm.slot.split('-')
  const startTime = parts[0] + ':00'
  const endTime = parts[1] + ':00'

  booking.value = true
  bookError.value = ''
  try {
    await studentApi.createAppointment({
      counselorId: selected.value.id,
      appointmentDate: bookForm.date,
      startTime,
      endTime,
      type: bookForm.type,
      reason: bookForm.reason || undefined,
    })
    closeModal()
    showSuccess('预约成功！咨询师确认后将通知您')
  } catch (e) {
    bookError.value = e.message || '预约失败，请重试'
  } finally {
    booking.value = false
  }
}

function showSuccess(msg) {
  successMsg.value = msg
  setTimeout(() => { successMsg.value = '' }, 3000)
}

onMounted(loadCounselors)
</script>

<style scoped>
.page {
  padding: 32px;
  max-width: 1000px;
  position: relative;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 16px;
}

h2 {
  font-size: 22px;
  color: #1a1a2e;
  margin: 0;
  font-weight: 700;
}

.search-bar {
  display: flex;
  gap: 8px;
}

.search-bar input {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 9px 14px;
  font-size: 14px;
  width: 220px;
  outline: none;
}

.search-bar input:focus {
  border-color: #667eea;
}

.btn-search {
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 9px 18px;
  font-size: 14px;
  cursor: pointer;
}

.state-text {
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
  padding: 60px 0;
}

.counselor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.counselor-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.counselor-card:hover {
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.name {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
}

.title-text {
  font-size: 13px;
  color: #667eea;
  margin-top: 2px;
}

.specialties {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.tag {
  font-size: 11px;
  background: #ede9fe;
  color: #7c3aed;
  padding: 2px 8px;
  border-radius: 12px;
}

.bio {
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  margin: 4px 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.btn-book {
  align-self: flex-start;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: auto;
}

.btn-book:hover {
  background: #5a6fd6;
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
  width: 520px;
  max-width: 95vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
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
  padding: 4px;
  line-height: 1;
}

.modal-close:hover {
  color: #1a1a2e;
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.counselor-brief {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 20px;
}

.brief-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brief-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
}

.brief-title {
  font-size: 13px;
  color: #667eea;
  margin-top: 2px;
}

.mt4 {
  margin-top: 6px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-item label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.required {
  color: #ef4444;
  margin-left: 2px;
}

.form-item input[type="date"],
.form-item select,
.form-item textarea {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 14px;
  color: #1a1a2e;
  outline: none;
  background: #fff;
  transition: border-color 0.2s;
  font-family: inherit;
}

.form-item input:focus,
.form-item select:focus,
.form-item textarea:focus {
  border-color: #667eea;
}

.form-item textarea {
  resize: vertical;
  min-height: 72px;
}

.hint {
  font-size: 13px;
  color: #94a3b8;
  padding: 4px 0;
}

.hint.warn {
  color: #f59e0b;
}

.slot-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.slot-btn {
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 13px;
  color: #1a1a2e;
  cursor: pointer;
  transition: all 0.2s;
}

.slot-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.slot-btn.active {
  background: #667eea;
  border-color: #667eea;
  color: #fff;
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

.btn-primary {
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 9px 22px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #5a6fd6;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

/* Toast */
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
