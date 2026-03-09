<template>
  <div class="page">
    <div class="page-header">
      <h2>咨询师管理</h2>
      <button class="btn-primary" @click="openCreate">+ 添加咨询师</button>
    </div>

    <!-- 列表 -->
    <div class="card">
      <div v-if="loading" class="state-text">加载中...</div>
      <div v-else-if="list.length === 0" class="state-text">暂无咨询师账号</div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>账号 / 姓名</th>
            <th>邮箱</th>
            <th>职称</th>
            <th>擅长方向</th>
            <th>接诊状态</th>
            <th>账号状态</th>
            <th>最后登录</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in list" :key="c.id">
            <td>
              <div class="cell-name">{{ c.counselorProfile?.realName || '—' }}</div>
              <div class="cell-sub">@{{ c.username }}</div>
            </td>
            <td class="cell-sub">{{ c.email }}</td>
            <td class="cell-sub">{{ c.counselorProfile?.title || '—' }}</td>
            <td>
              <span
                v-for="s in (c.counselorProfile?.specialties || [])"
                :key="s"
                class="tag"
              >{{ s }}</span>
              <span v-if="!c.counselorProfile?.specialties?.length" class="cell-sub">—</span>
            </td>
            <td>
              <span :class="c.counselorProfile?.isAccepting ? 'badge-green' : 'badge-gray'">
                {{ c.counselorProfile?.isAccepting ? '接诊中' : '暂停' }}
              </span>
            </td>
            <td>
              <span :class="c.isActive ? 'badge-blue' : 'badge-red'">
                {{ c.isActive ? '正常' : '已禁用' }}
              </span>
            </td>
            <td class="cell-sub">{{ formatDt(c.lastLoginAt) }}</td>
            <td>
              <button
                class="btn-sm"
                :class="c.isActive ? 'btn-outline-red' : 'btn-outline-green'"
                :disabled="toggleId === c.id"
                @click="toggleStatus(c)"
              >{{ c.isActive ? '禁用' : '启用' }}</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页 -->
      <div v-if="total > pageSize" class="pagination">
        <button :disabled="page === 1" @click="goPage(page - 1)">上一页</button>
        <span>第 {{ page }} / {{ totalPages }} 页，共 {{ total }} 条</span>
        <button :disabled="page >= totalPages" @click="goPage(page + 1)">下一页</button>
      </div>
    </div>

    <!-- 添加咨询师弹窗 -->
    <div v-if="showCreate" class="modal-mask" @click.self="showCreate = false">
      <div class="modal">
        <div class="modal-header">
          <h3>添加咨询师账号</h3>
          <button class="close-btn" @click="showCreate = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-item">
            <label>用户名 <span class="required">*</span></label>
            <input v-model="form.username" placeholder="登录用户名" />
          </div>
          <div class="form-item">
            <label>邮箱 <span class="required">*</span></label>
            <input v-model="form.email" type="email" placeholder="登录邮箱" />
          </div>
          <div class="form-item">
            <label>初始密码 <span class="required">*</span></label>
            <input v-model="form.password" type="password" placeholder="至少 6 位" />
          </div>
          <div class="form-item">
            <label>真实姓名</label>
            <input v-model="form.realName" placeholder="可选，填写后自动建立档案" />
          </div>
          <p v-if="createError" class="error-text">{{ createError }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showCreate = false">取消</button>
          <button class="btn-primary" :disabled="creating" @click="submitCreate">
            {{ creating ? '提交中...' : '确认添加' }}
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
const toggleId = ref(null)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 15
const totalPages = computed(() => Math.ceil(total.value / pageSize))

const showCreate = ref(false)
const creating = ref(false)
const createError = ref('')
const form = ref({ username: '', email: '', password: '', realName: '' })

const toast = ref('')

function formatDt(t) {
  if (!t) return '从未'
  return new Date(t).toLocaleString('zh-CN', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function showToast(msg) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 3000)
}

function openCreate() {
  form.value = { username: '', email: '', password: '', realName: '' }
  createError.value = ''
  showCreate.value = true
}

async function loadList() {
  loading.value = true
  try {
    const res = await schoolApi.getCounselors({ page: page.value, pageSize })
    list.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

async function goPage(p) {
  page.value = p
  await loadList()
}

async function toggleStatus(counselor) {
  toggleId.value = counselor.id
  try {
    await schoolApi.updateCounselorStatus(counselor.id, { isActive: !counselor.isActive })
    showToast(counselor.isActive ? '已禁用该账号' : '已启用该账号')
    await loadList()
  } catch (e) {
    showToast(e.response?.data?.message || e.message || '操作失败')
  } finally {
    toggleId.value = null
  }
}

async function submitCreate() {
  createError.value = ''
  const { username, email, password } = form.value
  if (!username.trim() || !email.trim() || !password.trim()) {
    createError.value = '用户名、邮箱、密码为必填项'
    return
  }
  if (password.length < 6) {
    createError.value = '密码至少 6 位'
    return
  }
  creating.value = true
  try {
    await schoolApi.createCounselor({ ...form.value })
    showCreate.value = false
    showToast('咨询师账号已创建')
    page.value = 1
    await loadList()
  } catch (e) {
    createError.value = e.response?.data?.message || e.message || '创建失败'
  } finally {
    creating.value = false
  }
}

onMounted(loadList)
</script>

<style scoped>
.page {
  padding: 32px;
  max-width: 1100px;
  position: relative;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table th {
  text-align: left;
  padding: 10px 12px;
  color: #94a3b8;
  font-weight: 500;
  border-bottom: 1px solid #f1f5f9;
  white-space: nowrap;
}

.table td {
  padding: 12px 12px;
  border-bottom: 1px solid #f8fafc;
  vertical-align: middle;
}

.table tr:last-child td {
  border-bottom: none;
}

.cell-name {
  font-weight: 500;
  color: #1a1a2e;
}

.cell-sub {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.tag {
  display: inline-block;
  font-size: 11px;
  background: #f0f4ff;
  color: #667eea;
  padding: 2px 7px;
  border-radius: 10px;
  margin: 2px 3px 2px 0;
}

.badge-green { background: #d1fae5; color: #059669; padding: 3px 10px; border-radius: 12px; font-size: 12px; }
.badge-gray  { background: #f1f5f9; color: #94a3b8; padding: 3px 10px; border-radius: 12px; font-size: 12px; }
.badge-blue  { background: #dbeafe; color: #2563eb; padding: 3px 10px; border-radius: 12px; font-size: 12px; }
.badge-red   { background: #fee2e2; color: #dc2626; padding: 3px 10px; border-radius: 12px; font-size: 12px; }

.btn-sm {
  font-size: 12px;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  border: 1px solid;
  background: #fff;
  white-space: nowrap;
}

.btn-sm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-outline-red   { color: #ef4444; border-color: #fca5a5; }
.btn-outline-red:hover:not(:disabled)   { background: #fef2f2; }
.btn-outline-green { color: #22c55e; border-color: #86efac; }
.btn-outline-green:hover:not(:disabled) { background: #f0fff4; }

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

.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

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
  width: 440px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

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
}

.form-item input:focus,
.form-item select:focus,
.form-item textarea:focus {
  border-color: #e94560;
}

.required { color: #e94560; }

.error-text {
  color: #ef4444;
  font-size: 13px;
  margin: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 24px 20px;
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
