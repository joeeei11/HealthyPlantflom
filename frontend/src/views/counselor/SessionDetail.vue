<template>
  <div class="page">
    <!-- 顶部导航 -->
    <div class="back-bar">
      <button class="back-btn" @click="router.push('/counselor/sessions')">← 返回会话列表</button>
    </div>

    <div v-if="!session" class="state-text">
      会话数据不可用，请从<RouterLink to="/counselor/sessions" class="inline-link">会话列表</RouterLink>重新进入。
    </div>

    <div v-else class="content">
      <!-- 会话信息头 -->
      <div class="card session-header">
        <div class="header-left">
          <div class="student-avatar">{{ getAvatar(session) }}</div>
          <div>
            <div class="student-name">{{ session.student?.studentProfile?.realName || session.student?.username }}</div>
            <div class="session-info-row">
              <span :class="['status-badge', `ss-${session.status}`]">{{ statusLabel[session.status] }}</span>
              <span class="info-sep">·</span>
              <span class="info-text">{{ typeLabel[session.type] || session.type }}</span>
              <span v-if="session.appointment" class="info-sep">·</span>
              <span v-if="session.appointment" class="info-text">
                {{ session.appointment.appointmentDate }}
                {{ session.appointment.startTime?.slice(0, 5) }}–{{ session.appointment.endTime?.slice(0, 5) }}
              </span>
            </div>
            <div class="time-row">
              <span>开始：{{ formatDt(session.startedAt) }}</span>
              <span v-if="session.endedAt"> &nbsp;·&nbsp; 结束：{{ formatDt(session.endedAt) }}</span>
            </div>
          </div>
        </div>
        <button
          v-if="session.status === 'in_progress'"
          class="btn-end"
          :disabled="ending"
          @click="openEndDialog"
        >
          {{ ending ? '处理中...' : '结束会话' }}
        </button>
      </div>

      <!-- 案例笔记列表 -->
      <div class="card">
        <div class="card-header">
          <h3>案例笔记</h3>
          <button class="btn-add-note" @click="showNoteForm = !showNoteForm">
            {{ showNoteForm ? '收起' : '+ 添加笔记' }}
          </button>
        </div>

        <!-- 新增笔记表单 -->
        <div v-if="showNoteForm" class="note-form">
          <div class="form-item">
            <label>笔记内容 <span class="required">*</span></label>
            <textarea v-model="noteForm.content" rows="5" placeholder="记录本次咨询内容、学生状态、干预措施等..."></textarea>
          </div>
          <div class="form-row">
            <div class="form-item">
              <label>风险等级</label>
              <select v-model="noteForm.riskLevel">
                <option value="low">低风险</option>
                <option value="medium">中风险</option>
                <option value="high">高风险</option>
                <option value="crisis">危机</option>
              </select>
            </div>
            <div class="form-item form-check">
              <label>
                <input type="checkbox" v-model="noteForm.followUpRequired" />
                需要跟进
              </label>
            </div>
            <div class="form-item form-check">
              <label>
                <input type="checkbox" v-model="noteForm.isPrivate" />
                仅自己可见（私密）
              </label>
            </div>
          </div>
          <p v-if="noteError" class="error-msg">{{ noteError }}</p>
          <div class="form-actions">
            <button class="btn-outline" @click="showNoteForm = false">取消</button>
            <button class="btn-primary" :disabled="savingNote" @click="submitNote">
              {{ savingNote ? '保存中...' : '保存笔记' }}
            </button>
          </div>
        </div>

        <!-- 笔记列表 -->
        <div v-if="loadingNotes" class="state-text">加载中...</div>
        <div v-else-if="notes.length === 0 && !showNoteForm" class="state-text">暂无案例笔记，点击「添加笔记」开始记录</div>
        <div v-else class="notes-list">
          <div v-for="note in notes" :key="note.id" class="note-item">
            <div class="note-header">
              <div class="note-meta-left">
                <span :class="['risk-badge', `risk-${note.riskLevel}`]">{{ riskLabel[note.riskLevel] }}</span>
                <span v-if="note.followUpRequired" class="tag-followup">需跟进</span>
                <span v-if="note.isPrivate" class="tag-private">私密</span>
              </div>
              <span class="note-time">{{ formatDt(note.createdAt) }}</span>
            </div>
            <div class="note-content">{{ note.content }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 结束会话确认弹窗 -->
    <div v-if="endDialogOpen" class="modal-mask" @click.self="endDialogOpen = false">
      <div class="modal">
        <div class="modal-header">
          <h3>结束会话</h3>
          <button class="modal-close" @click="endDialogOpen = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-tip">确定结束当前会话吗？结束后将无法恢复进行中状态。</p>
          <p v-if="endError" class="error-msg">{{ endError }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-outline" :disabled="ending" @click="endDialogOpen = false">返回</button>
          <button class="btn-primary" :disabled="ending" @click="confirmEnd">
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
import { useRoute, useRouter } from 'vue-router'
import { counselorApi } from '@/api/counselor'

const route = useRoute()
const router = useRouter()

const sessionId = route.params.id

// Load session from navigation state (passed via router.push state)
const session = ref(history.state?.session || null)

const loadingNotes = ref(false)
const notes = ref([])
const showNoteForm = ref(false)
const savingNote = ref(false)
const noteError = ref('')
const ending = ref(false)
const endDialogOpen = ref(false)
const endError = ref('')
const toast = ref('')

const noteForm = reactive({
  content: '',
  riskLevel: 'low',
  followUpRequired: false,
  isPrivate: true,
})

const statusLabel = { in_progress: '进行中', completed: '已完成' }
const typeLabel = {
  individual: '个体咨询',
  group: '团体咨询',
  offline: '线下面谈',
  online: '线上视频',
}
const riskLabel = { low: '低风险', medium: '中风险', high: '高风险', crisis: '危机' }

function getAvatar(s) {
  const name = s?.student?.studentProfile?.realName || s?.student?.username || '?'
  return name.charAt(0).toUpperCase()
}

function formatDt(t) {
  if (!t) return '—'
  return new Date(t).toLocaleString('zh-CN', {
    year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function showToast(msg) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 3000)
}

async function loadNotes() {
  loadingNotes.value = true
  try {
    const res = await counselorApi.getNotes(sessionId)
    notes.value = res.data || []
  } catch {
    notes.value = []
  } finally {
    loadingNotes.value = false
  }
}

async function submitNote() {
  if (!noteForm.content.trim()) {
    noteError.value = '笔记内容不能为空'
    return
  }
  savingNote.value = true
  noteError.value = ''
  try {
    const res = await counselorApi.createNote(sessionId, { ...noteForm })
    notes.value.push(res.data)
    noteForm.content = ''
    noteForm.riskLevel = 'low'
    noteForm.followUpRequired = false
    noteForm.isPrivate = true
    showNoteForm.value = false
    showToast('笔记已保存')
  } catch (e) {
    noteError.value = e.message || '保存失败，请重试'
  } finally {
    savingNote.value = false
  }
}

function openEndDialog() {
  endDialogOpen.value = true
  endError.value = ''
}

async function confirmEnd() {
  ending.value = true
  endError.value = ''
  try {
    const res = await counselorApi.endSession(sessionId)
    // Update local session status
    if (session.value) {
      session.value = { ...session.value, status: 'completed', endedAt: res.data?.endedAt }
    }
    endDialogOpen.value = false
    showToast('会话已结束')
  } catch (e) {
    endError.value = e.message || '操作失败，请重试'
  } finally {
    ending.value = false
  }
}

onMounted(loadNotes)
</script>

<style scoped>
.page {
  padding: 32px;
  max-width: 860px;
  position: relative;
}

.back-bar {
  margin-bottom: 24px;
}

.back-btn {
  background: none;
  border: none;
  color: #48bb78;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  font-weight: 500;
}

.back-btn:hover {
  text-decoration: underline;
}

.state-text {
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
  padding: 60px 0;
}

.inline-link {
  color: #48bb78;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.header-left {
  display: flex;
  gap: 16px;
  align-items: center;
}

.student-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #48bb78, #2f855a);
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.student-name {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 6px;
}

.session-info-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.status-badge {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 20px;
  font-weight: 500;
}

.ss-in_progress { background: #f0fff4; color: #38a169; }
.ss-completed { background: #f1f5f9; color: #64748b; }

.info-sep {
  color: #cbd5e1;
  font-size: 12px;
}

.info-text {
  font-size: 13px;
  color: #64748b;
}

.time-row {
  font-size: 12px;
  color: #94a3b8;
}

.btn-end {
  background: none;
  border: 1px solid #fca5a5;
  color: #ef4444;
  border-radius: 8px;
  padding: 9px 18px;
  font-size: 13px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
}

.btn-end:hover:not(:disabled) {
  background: #fef2f2;
}

.btn-end:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

h3 {
  font-size: 16px;
  color: #1a1a2e;
  margin: 0;
  font-weight: 600;
}

.btn-add-note {
  background: #48bb78;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-add-note:hover {
  background: #38a169;
}

/* Note form */
.note-form {
  background: #f8fafc;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
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

.form-item textarea,
.form-item select {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 14px;
  color: #1a1a2e;
  outline: none;
  transition: border-color 0.2s;
  background: #fff;
  font-family: inherit;
}

.form-item textarea:focus,
.form-item select:focus {
  border-color: #48bb78;
}

.form-item textarea {
  resize: vertical;
}

.form-row {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.form-check {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.form-check label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #64748b;
}

.form-check input[type="checkbox"] {
  width: 15px;
  height: 15px;
  cursor: pointer;
  accent-color: #48bb78;
}

.required {
  color: #ef4444;
  margin-left: 2px;
}

.error-msg {
  background: #fef2f2;
  color: #ef4444;
  border-radius: 6px;
  padding: 8px 14px;
  font-size: 13px;
  margin-bottom: 12px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-primary {
  background: #48bb78;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 9px 22px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #38a169;
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

/* Notes list */
.notes-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.note-item {
  padding: 16px;
  background: #f8fafc;
  border-radius: 10px;
  border-left: 4px solid #e2e8f0;
}

.note-item:has(.risk-medium) {
  border-left-color: #f59e0b;
}

.note-item:has(.risk-high) {
  border-left-color: #ef4444;
}

.note-item:has(.risk-crisis) {
  border-left-color: #7c3aed;
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  gap: 8px;
}

.note-meta-left {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.risk-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 500;
}

.risk-low { background: #d1fae5; color: #059669; }
.risk-medium { background: #fef3c7; color: #d97706; }
.risk-high { background: #fef2f2; color: #ef4444; }
.risk-crisis { background: #ede9fe; color: #7c3aed; }

.tag-followup {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 20px;
  background: #ebf8ff;
  color: #2b6cb0;
  font-weight: 500;
}

.tag-private {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 20px;
  background: #f1f5f9;
  color: #64748b;
  font-weight: 500;
}

.note-time {
  font-size: 12px;
  color: #94a3b8;
  flex-shrink: 0;
}

.note-content {
  font-size: 14px;
  color: #374151;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px 20px;
  border-top: 1px solid #f1f5f9;
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
