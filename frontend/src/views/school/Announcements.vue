<template>
  <div class="page">
    <div class="page-header">
      <h2>公告管理</h2>
      <button class="btn-primary" @click="openCreate">+ 发布公告</button>
    </div>

    <!-- 筛选 Tab -->
    <div class="tabs">
      <button
        v-for="t in tabs"
        :key="t.value"
        class="tab"
        :class="{ 'tab--active': statusFilter === t.value }"
        @click="switchTab(t.value)"
      >{{ t.label }}</button>
    </div>

    <!-- 列表 -->
    <div class="card">
      <div v-if="loading" class="state-text">加载中...</div>
      <div v-else-if="list.length === 0" class="state-text">暂无公告</div>
      <div v-else class="ann-list">
        <div v-for="a in list" :key="a.id" class="ann-item">
          <div class="ann-main">
            <div class="ann-title-row">
              <span v-if="a.isPinned" class="badge-pin">置顶</span>
              <span class="ann-title">{{ a.title }}</span>
              <span :class="a.publishedAt ? 'badge-published' : 'badge-draft'">
                {{ a.publishedAt ? '已发布' : '草稿' }}
              </span>
              <span v-if="a.targetRole !== 'all'" class="badge-target">{{ targetLabel(a.targetRole) }}</span>
            </div>
            <p class="ann-content">{{ a.content }}</p>
            <div class="ann-meta">
              <span>作者：{{ a.author?.username || '—' }}</span>
              <span v-if="a.publishedAt">发布于 {{ formatDt(a.publishedAt) }}</span>
              <span v-else>创建于 {{ formatDt(a.createdAt) }}</span>
              <span v-if="a.expiresAt">过期：{{ formatDt(a.expiresAt) }}</span>
            </div>
          </div>
          <button
            class="btn-del"
            :disabled="deletingId === a.id"
            @click="askDelete(a)"
          >删除</button>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="total > pageSize" class="pagination">
        <button :disabled="page === 1" @click="goPage(page - 1)">上一页</button>
        <span>第 {{ page }} / {{ totalPages }} 页，共 {{ total }} 条</span>
        <button :disabled="page >= totalPages" @click="goPage(page + 1)">下一页</button>
      </div>
    </div>

    <!-- 新建公告弹窗 -->
    <div v-if="showCreate" class="modal-mask" @click.self="showCreate = false">
      <div class="modal">
        <div class="modal-header">
          <h3>发布公告</h3>
          <button class="close-btn" @click="showCreate = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-item">
            <label>标题 <span class="required">*</span></label>
            <input v-model="form.title" placeholder="公告标题" />
          </div>
          <div class="form-item">
            <label>内容 <span class="required">*</span></label>
            <textarea v-model="form.content" rows="5" placeholder="公告内容..."></textarea>
          </div>
          <div class="form-row">
            <div class="form-item">
              <label>目标受众</label>
              <select v-model="form.targetRole">
                <option value="all">全部</option>
                <option value="student">仅学生</option>
                <option value="counselor">仅咨询师</option>
              </select>
            </div>
            <div class="form-item">
              <label>过期时间</label>
              <input v-model="form.expiresAt" type="datetime-local" />
            </div>
          </div>
          <div class="form-row">
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.isPinned" />
              置顶公告
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.publish" />
              立即发布（否则保存为草稿）
            </label>
          </div>
          <p v-if="createError" class="error-text">{{ createError }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showCreate = false">取消</button>
          <button class="btn-primary" :disabled="creating" @click="submitCreate">
            {{ creating ? '提交中...' : (form.publish ? '立即发布' : '保存草稿') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="deleteTarget" class="modal-mask" @click.self="deleteTarget = null">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h3>确认删除</h3>
          <button class="close-btn" @click="deleteTarget = null">✕</button>
        </div>
        <div class="modal-body">
          <p class="confirm-text">确定要删除公告「{{ deleteTarget.title }}」吗？此操作不可撤销。</p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="deleteTarget = null">取消</button>
          <button class="btn-danger" :disabled="!!deletingId" @click="confirmDelete">
            {{ deletingId ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { schoolApi } from '@/api/school'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 15
const totalPages = computed(() => Math.ceil(total.value / pageSize))
const statusFilter = ref('all')

const tabs = [
  { label: '全部', value: 'all' },
  { label: '已发布', value: 'published' },
  { label: '草稿', value: 'draft' },
]

const showCreate = ref(false)
const creating = ref(false)
const createError = ref('')
const form = ref({ title: '', content: '', targetRole: 'all', isPinned: false, publish: true, expiresAt: '' })

const deleteTarget = ref(null)
const deletingId = ref(null)
const toast = ref('')

function formatDt(t) {
  if (!t) return ''
  return new Date(t).toLocaleString('zh-CN', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function targetLabel(role) {
  return { student: '仅学生', counselor: '仅咨询师', all: '全部' }[role] || role
}

function showToast(msg) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 3000)
}

function openCreate() {
  form.value = { title: '', content: '', targetRole: 'all', isPinned: false, publish: true, expiresAt: '' }
  createError.value = ''
  showCreate.value = true
}

async function loadList() {
  loading.value = true
  try {
    const res = await schoolApi.getAnnouncements({ page: page.value, pageSize, status: statusFilter.value })
    list.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

async function switchTab(val) {
  statusFilter.value = val
  page.value = 1
  await loadList()
}

async function goPage(p) {
  page.value = p
  await loadList()
}

async function submitCreate() {
  createError.value = ''
  if (!form.value.title.trim() || !form.value.content.trim()) {
    createError.value = '标题和内容为必填项'
    return
  }
  creating.value = true
  try {
    const payload = {
      title: form.value.title.trim(),
      content: form.value.content.trim(),
      targetRole: form.value.targetRole,
      isPinned: form.value.isPinned,
      publish: form.value.publish,
      expiresAt: form.value.expiresAt || undefined,
    }
    await schoolApi.createAnnouncement(payload)
    showCreate.value = false
    showToast(form.value.publish ? '公告已发布' : '草稿已保存')
    page.value = 1
    await loadList()
  } catch (e) {
    createError.value = e.response?.data?.message || e.message || '提交失败'
  } finally {
    creating.value = false
  }
}

function askDelete(ann) {
  deleteTarget.value = ann
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deletingId.value = deleteTarget.value.id
  try {
    await schoolApi.deleteAnnouncement(deleteTarget.value.id)
    showToast('公告已删除')
    deleteTarget.value = null
    await loadList()
  } catch (e) {
    showToast(e.response?.data?.message || e.message || '删除失败')
  } finally {
    deletingId.value = null
  }
}

onMounted(loadList)
</script>

<style scoped>
.page {
  padding: 32px;
  max-width: 960px;
  position: relative;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

h2 {
  font-size: 22px;
  color: #1a1a2e;
  margin: 0;
  font-weight: 700;
}

h3 {
  font-size: 16px;
  color: #1a1a2e;
  margin: 0;
  font-weight: 600;
}

.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
}

.tab {
  padding: 7px 18px;
  border: none;
  border-radius: 20px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab--active {
  background: #e94560;
  color: #fff;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.state-text {
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
  padding: 40px 0;
}

.ann-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ann-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  gap: 16px;
}

.ann-main {
  flex: 1;
  min-width: 0;
}

.ann-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.ann-title {
  font-weight: 600;
  color: #1a1a2e;
  font-size: 15px;
}

.ann-content {
  color: #475569;
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 8px;
  white-space: pre-wrap;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ann-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #94a3b8;
}

.badge-pin       { background: #fff7ed; color: #ea580c; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
.badge-published { background: #d1fae5; color: #059669; padding: 2px 8px; border-radius: 10px; font-size: 11px; }
.badge-draft     { background: #f1f5f9; color: #94a3b8; padding: 2px 8px; border-radius: 10px; font-size: 11px; }
.badge-target    { background: #ede9fe; color: #7c3aed; padding: 2px 8px; border-radius: 10px; font-size: 11px; }

.btn-del {
  flex-shrink: 0;
  font-size: 12px;
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid #fca5a5;
  background: #fff;
  color: #ef4444;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  align-self: flex-start;
}

.btn-del:hover:not(:disabled) { background: #fef2f2; }
.btn-del:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-danger {
  background: #ef4444;
  color: #fff;
  border: none;
  padding: 9px 20px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-danger:hover:not(:disabled) { background: #dc2626; }

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
  font-size: 13px;
  color: #64748b;
}

.pagination button {
  padding: 6px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
}

.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }

/* Modal */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 16px;
  width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

.modal-sm { width: 400px; }

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 16px;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.close-btn:hover { background: #f1f5f9; }

.modal-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-item label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.form-item input,
.form-item select,
.form-item textarea {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
  resize: vertical;
}

.form-item input:focus,
.form-item select:focus,
.form-item textarea:focus {
  border-color: #e94560;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-item {
  flex: 1;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  user-select: none;
}

.required { color: #e94560; }

.error-text {
  color: #ef4444;
  font-size: 13px;
  margin: 0;
}

.confirm-text {
  color: #475569;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 24px 20px;
}

.btn-primary {
  background: #e94560;
  color: #fff;
  border: none;
  padding: 9px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) { background: #c73652; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-cancel {
  background: #f1f5f9;
  color: #64748b;
  border: none;
  padding: 9px 20px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.btn-cancel:hover { background: #e2e8f0; }

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
