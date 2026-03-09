<template>
  <div class="page">
    <h2>个人档案</h2>

    <div v-if="loading" class="state-text">加载中...</div>
    <div v-else class="content">
      <!-- 账号信息 -->
      <div class="card">
        <h3>账号信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">用户名</span>
            <span class="value">{{ userData.username }}</span>
          </div>
          <div class="info-item">
            <span class="label">邮箱</span>
            <span class="value">{{ userData.email }}</span>
          </div>
          <div class="info-item">
            <span class="label">注册时间</span>
            <span class="value">{{ formatDate(userData.createdAt) }}</span>
          </div>
        </div>
      </div>

      <!-- 个人档案 -->
      <div class="card">
        <div class="card-header">
          <h3>个人信息</h3>
          <div class="btn-group">
            <template v-if="!editing">
              <button class="btn-primary" @click="startEdit">编辑</button>
            </template>
            <template v-else>
              <button class="btn-outline" @click="cancelEdit" :disabled="saving">取消</button>
              <button class="btn-primary" @click="saveProfile" :disabled="saving">
                {{ saving ? '保存中...' : '保存' }}
              </button>
            </template>
          </div>
        </div>

        <p v-if="saveError" class="error-msg">{{ saveError }}</p>

        <!-- 查看模式 -->
        <div v-if="!editing" class="info-grid">
          <div v-for="f in displayFields" :key="f.key" class="info-item">
            <span class="label">{{ f.label }}</span>
            <span class="value">{{ getDisplayValue(f) || '—' }}</span>
          </div>
        </div>

        <!-- 编辑模式 -->
        <div v-else class="form-grid">
          <div v-for="f in editFields" :key="f.key" class="form-item">
            <label>
              {{ f.label }}
              <span v-if="f.required" class="required">*</span>
            </label>
            <select v-if="f.type === 'select'" v-model="form[f.key]">
              <option value="">请选择</option>
              <option v-for="opt in f.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <input
              v-else
              :type="f.inputType || 'text'"
              v-model="form[f.key]"
              :placeholder="f.placeholder || ''"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { studentApi } from '@/api/student'

const loading = ref(false)
const editing = ref(false)
const saving = ref(false)
const saveError = ref('')

const userData = ref({})
const profileData = ref(null)

const form = reactive({
  realName: '',
  studentNo: '',
  gender: '',
  grade: '',
  major: '',
  college: '',
  phone: '',
  emergencyContact: '',
  emergencyPhone: '',
})

const displayFields = [
  { key: 'realName', label: '真实姓名' },
  { key: 'studentNo', label: '学号' },
  { key: 'gender', label: '性别', map: { male: '男', female: '女', other: '其他' } },
  { key: 'grade', label: '年级' },
  { key: 'major', label: '专业' },
  { key: 'college', label: '学院' },
  { key: 'phone', label: '手机号' },
  { key: 'emergencyContact', label: '紧急联系人' },
  { key: 'emergencyPhone', label: '紧急联系电话' },
]

const editFields = [
  { key: 'realName', label: '真实姓名', required: true, placeholder: '请输入真实姓名' },
  { key: 'studentNo', label: '学号', placeholder: '请输入学号' },
  {
    key: 'gender', label: '性别', type: 'select',
    options: [{ value: 'male', label: '男' }, { value: 'female', label: '女' }, { value: 'other', label: '其他' }],
  },
  { key: 'grade', label: '年级', placeholder: '如：大三' },
  { key: 'major', label: '专业', placeholder: '如：计算机科学与技术' },
  { key: 'college', label: '学院', placeholder: '如：信息工程学院' },
  { key: 'phone', label: '手机号', inputType: 'tel', placeholder: '请输入手机号' },
  { key: 'emergencyContact', label: '紧急联系人', placeholder: '姓名' },
  { key: 'emergencyPhone', label: '紧急联系电话', inputType: 'tel', placeholder: '手机号' },
]

function getDisplayValue(field) {
  const val = profileData.value?.[field.key]
  if (!val) return ''
  return field.map ? (field.map[val] || val) : val
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN')
}

function startEdit() {
  for (const f of editFields) {
    form[f.key] = profileData.value?.[f.key] || ''
  }
  editing.value = true
  saveError.value = ''
}

function cancelEdit() {
  editing.value = false
  saveError.value = ''
}

async function saveProfile() {
  if (!form.realName) {
    saveError.value = '真实姓名不能为空'
    return
  }
  saving.value = true
  saveError.value = ''
  try {
    const res = await studentApi.updateProfile({ ...form })
    profileData.value = res.data
    editing.value = false
  } catch (e) {
    saveError.value = e.message || '保存失败，请重试'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await studentApi.getProfile()
    userData.value = res.data || {}
    profileData.value = res.data?.profile || null
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page {
  padding: 32px;
  max-width: 860px;
}

h2 {
  font-size: 22px;
  color: #1a1a2e;
  margin: 0 0 24px;
  font-weight: 700;
}

.state-text {
  color: #94a3b8;
  font-size: 14px;
  padding: 40px 0;
  text-align: center;
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

h3 {
  font-size: 16px;
  color: #1a1a2e;
  margin: 0 0 20px;
  font-weight: 600;
}

.card-header h3 {
  margin: 0;
}

.btn-group {
  display: flex;
  gap: 8px;
}

.btn-primary {
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 18px;
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
  padding: 8px 18px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline:hover:not(:disabled) {
  border-color: #94a3b8;
  color: #1a1a2e;
}

.error-msg {
  background: #fef2f2;
  color: #ef4444;
  border-radius: 6px;
  padding: 8px 14px;
  font-size: 13px;
  margin-bottom: 16px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 12px;
  color: #94a3b8;
}

.value {
  font-size: 14px;
  color: #1a1a2e;
  font-weight: 500;
}

.required {
  color: #ef4444;
  margin-left: 2px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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

.form-item input,
.form-item select {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 14px;
  color: #1a1a2e;
  outline: none;
  transition: border-color 0.2s;
  background: #fff;
}

.form-item input:focus,
.form-item select:focus {
  border-color: #667eea;
}
</style>
