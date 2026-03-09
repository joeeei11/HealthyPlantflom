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

      <!-- 基本信息 -->
      <div class="card">
        <div class="card-header">
          <h3>基本信息</h3>
          <div class="btn-group">
            <template v-if="!editing">
              <button class="btn-primary" @click="startEdit">编辑</button>
            </template>
            <template v-else>
              <button class="btn-outline" :disabled="saving" @click="cancelEdit">取消</button>
              <button class="btn-primary" :disabled="saving" @click="saveBasic">
                {{ saving ? '保存中...' : '保存' }}
              </button>
            </template>
          </div>
        </div>

        <p v-if="saveError" class="error-msg">{{ saveError }}</p>

        <!-- 查看模式 -->
        <div v-if="!editing" class="info-grid">
          <div class="info-item">
            <span class="label">真实姓名</span>
            <span class="value">{{ profile?.realName || '—' }}</span>
          </div>
          <div class="info-item">
            <span class="label">性别</span>
            <span class="value">{{ genderMap[profile?.gender] || '—' }}</span>
          </div>
          <div class="info-item">
            <span class="label">职称</span>
            <span class="value">{{ profile?.title || '—' }}</span>
          </div>
          <div class="info-item">
            <span class="label">资质证书</span>
            <span class="value">{{ profile?.qualification || '—' }}</span>
          </div>
          <div class="info-item">
            <span class="label">联系电话</span>
            <span class="value">{{ profile?.phone || '—' }}</span>
          </div>
          <div class="info-item">
            <span class="label">每日接诊上限</span>
            <span class="value">{{ profile?.maxAppointmentsPerDay ?? '—' }} 人</span>
          </div>
          <div class="info-item">
            <span class="label">接受预约</span>
            <span class="value">{{ profile?.isAccepting ? '是' : '否' }}</span>
          </div>
          <div class="info-item full-width">
            <span class="label">个人简介</span>
            <span class="value">{{ profile?.bio || '—' }}</span>
          </div>
        </div>

        <!-- 编辑模式 -->
        <div v-else class="form-grid">
          <div class="form-item">
            <label>真实姓名 <span class="required">*</span></label>
            <input v-model="form.realName" placeholder="请输入真实姓名" />
          </div>
          <div class="form-item">
            <label>性别</label>
            <select v-model="form.gender">
              <option value="">请选择</option>
              <option value="male">男</option>
              <option value="female">女</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div class="form-item">
            <label>职称</label>
            <input v-model="form.title" placeholder="如：心理咨询师" />
          </div>
          <div class="form-item">
            <label>资质证书</label>
            <input v-model="form.qualification" placeholder="如：国家二级心理咨询师" />
          </div>
          <div class="form-item">
            <label>联系电话</label>
            <input v-model="form.phone" type="tel" placeholder="请输入联系电话" />
          </div>
          <div class="form-item">
            <label>每日接诊上限</label>
            <input v-model.number="form.maxAppointmentsPerDay" type="number" min="1" max="20" placeholder="如：5" />
          </div>
          <div class="form-item">
            <label>接受预约</label>
            <select v-model="form.isAccepting">
              <option :value="true">是</option>
              <option :value="false">否</option>
            </select>
          </div>
          <div class="form-item full-width">
            <label>个人简介</label>
            <textarea v-model="form.bio" rows="3" placeholder="请填写您的专业背景、擅长方向等..."></textarea>
          </div>
        </div>
      </div>

      <!-- 擅长方向 -->
      <div class="card">
        <div class="card-header">
          <h3>擅长方向</h3>
          <button class="btn-primary" :disabled="savingSpecialties" @click="saveSpecialties">
            {{ savingSpecialties ? '保存中...' : '保存' }}
          </button>
        </div>
        <p v-if="specialtiesError" class="error-msg">{{ specialtiesError }}</p>
        <div class="tags-area">
          <span
            v-for="(s, i) in specialtiesList"
            :key="i"
            class="tag"
          >
            {{ s }}
            <button class="tag-remove" @click="removeSpecialty(i)">×</button>
          </span>
          <div class="tag-input-wrap" v-if="addingSpecialty">
            <input
              ref="specialtyInput"
              v-model="newSpecialty"
              class="tag-input"
              placeholder="输入方向，按回车确认"
              @keyup.enter="confirmSpecialty"
              @blur="confirmSpecialty"
            />
          </div>
          <button v-else class="btn-add-tag" @click="startAddSpecialty">+ 添加</button>
        </div>
      </div>

      <!-- 可预约时段 -->
      <div class="card">
        <div class="card-header">
          <h3>可预约时段</h3>
          <button class="btn-primary" :disabled="savingSlots" @click="saveSlots">
            {{ savingSlots ? '保存中...' : '保存' }}
          </button>
        </div>
        <p class="slots-hint">设置每周各天的可预约时间段，格式：HH:MM-HH:MM</p>
        <p v-if="slotsError" class="error-msg">{{ slotsError }}</p>
        <div class="slots-grid">
          <div v-for="day in weekDays" :key="day.key" class="day-row">
            <div class="day-label">{{ day.label }}</div>
            <div class="day-slots">
              <span v-for="(slot, i) in slotsEdit[day.key]" :key="i" class="slot-chip">
                {{ slot }}
                <button class="slot-remove" @click="removeSlot(day.key, i)">×</button>
              </span>
              <div v-if="addingSlot?.day === day.key" class="slot-add-form">
                <input v-model="addingSlot.start" type="time" class="time-input" />
                <span class="time-sep">—</span>
                <input v-model="addingSlot.end" type="time" class="time-input" />
                <button class="btn-sm-green" @click="confirmSlot">确定</button>
                <button class="btn-sm-gray" @click="cancelSlot">取消</button>
              </div>
              <button v-else class="btn-add-slot" @click="startAddSlot(day.key)">+ 添加时段</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, onMounted } from 'vue'
import { counselorApi } from '@/api/counselor'

const loading = ref(false)
const editing = ref(false)
const saving = ref(false)
const saveError = ref('')
const savingSpecialties = ref(false)
const specialtiesError = ref('')
const savingSlots = ref(false)
const slotsError = ref('')
const toast = ref('')

const userData = ref({})
const profile = ref(null)

const form = reactive({
  realName: '',
  gender: '',
  title: '',
  qualification: '',
  bio: '',
  phone: '',
  isAccepting: true,
  maxAppointmentsPerDay: 5,
})

const genderMap = { male: '男', female: '女', other: '其他' }

const weekDays = [
  { key: 'Mon', label: '周一' },
  { key: 'Tue', label: '周二' },
  { key: 'Wed', label: '周三' },
  { key: 'Thu', label: '周四' },
  { key: 'Fri', label: '周五' },
  { key: 'Sat', label: '周六' },
  { key: 'Sun', label: '周日' },
]

// Specialties
const specialtiesList = ref([])
const addingSpecialty = ref(false)
const newSpecialty = ref('')
const specialtyInput = ref(null)

// Slots
const slotsEdit = reactive({ Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] })
const addingSlot = ref(null) // { day, start, end }

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN')
}

function showToast(msg) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 3000)
}

// Basic info editing
function startEdit() {
  const p = profile.value || {}
  form.realName = p.realName || ''
  form.gender = p.gender || ''
  form.title = p.title || ''
  form.qualification = p.qualification || ''
  form.bio = p.bio || ''
  form.phone = p.phone || ''
  form.isAccepting = p.isAccepting !== false
  form.maxAppointmentsPerDay = p.maxAppointmentsPerDay ?? 5
  editing.value = true
  saveError.value = ''
}

function cancelEdit() {
  editing.value = false
  saveError.value = ''
}

async function saveBasic() {
  if (!form.realName) {
    saveError.value = '真实姓名不能为空'
    return
  }
  saving.value = true
  saveError.value = ''
  try {
    const res = await counselorApi.updateProfile({ ...form })
    profile.value = res.data
    editing.value = false
    showToast('基本信息已保存')
  } catch (e) {
    saveError.value = e.message || '保存失败，请重试'
  } finally {
    saving.value = false
  }
}

// Specialties
function startAddSpecialty() {
  addingSpecialty.value = true
  newSpecialty.value = ''
  nextTick(() => specialtyInput.value?.focus())
}

function confirmSpecialty() {
  const val = newSpecialty.value.trim()
  if (val && !specialtiesList.value.includes(val)) {
    specialtiesList.value.push(val)
  }
  addingSpecialty.value = false
  newSpecialty.value = ''
}

function removeSpecialty(i) {
  specialtiesList.value.splice(i, 1)
}

async function saveSpecialties() {
  savingSpecialties.value = true
  specialtiesError.value = ''
  try {
    const res = await counselorApi.updateProfile({ specialties: [...specialtiesList.value] })
    profile.value = res.data
    showToast('擅长方向已保存')
  } catch (e) {
    specialtiesError.value = e.message || '保存失败'
  } finally {
    savingSpecialties.value = false
  }
}

// Available slots
function startAddSlot(day) {
  addingSlot.value = { day, start: '09:00', end: '10:00' }
}

function cancelSlot() {
  addingSlot.value = null
}

function confirmSlot() {
  const { day, start, end } = addingSlot.value
  if (!start || !end || start >= end) {
    return
  }
  const slotStr = `${start}-${end}`
  if (!slotsEdit[day].includes(slotStr)) {
    slotsEdit[day].push(slotStr)
  }
  addingSlot.value = null
}

function removeSlot(day, i) {
  slotsEdit[day].splice(i, 1)
}

async function saveSlots() {
  savingSlots.value = true
  slotsError.value = ''
  try {
    const slots = {}
    for (const day of weekDays) {
      if (slotsEdit[day.key].length > 0) {
        slots[day.key] = [...slotsEdit[day.key]]
      }
    }
    const res = await counselorApi.updateProfile({ availableSlots: slots })
    profile.value = res.data
    showToast('可预约时段已保存')
  } catch (e) {
    slotsError.value = e.message || '保存失败'
  } finally {
    savingSlots.value = false
  }
}

function loadSlotsFromProfile(p) {
  for (const day of weekDays) {
    slotsEdit[day.key] = Array.isArray(p?.availableSlots?.[day.key])
      ? [...p.availableSlots[day.key]]
      : []
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await counselorApi.getProfile()
    userData.value = res.data || {}
    profile.value = res.data?.profile || null
    specialtiesList.value = Array.isArray(profile.value?.specialties) ? [...profile.value.specialties] : []
    loadSlotsFromProfile(profile.value)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page {
  padding: 32px;
  max-width: 860px;
  position: relative;
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
  background: #48bb78;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 18px;
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
  padding: 8px 18px;
  font-size: 14px;
  cursor: pointer;
}

.btn-outline:hover:not(:disabled) {
  border-color: #94a3b8;
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

.info-item.full-width {
  grid-column: 1 / -1;
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

.form-item.full-width {
  grid-column: 1 / -1;
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
  color: #1a1a2e;
  outline: none;
  transition: border-color 0.2s;
  background: #fff;
  font-family: inherit;
}

.form-item input:focus,
.form-item select:focus,
.form-item textarea:focus {
  border-color: #48bb78;
}

.form-item textarea {
  resize: vertical;
}

/* Tags / Specialties */
.tags-area {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f0fff4;
  color: #38a169;
  border: 1px solid #9ae6b4;
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 13px;
}

.tag-remove {
  background: none;
  border: none;
  color: #68d391;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
}

.tag-remove:hover {
  color: #ef4444;
}

.tag-input-wrap {
  display: inline-flex;
}

.tag-input {
  border: 1px solid #9ae6b4;
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 13px;
  outline: none;
  width: 120px;
  color: #1a1a2e;
}

.tag-input:focus {
  border-color: #48bb78;
}

.btn-add-tag {
  background: none;
  border: 1px dashed #9ae6b4;
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 13px;
  color: #48bb78;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add-tag:hover {
  background: #f0fff4;
}

/* Slots */
.slots-hint {
  font-size: 13px;
  color: #94a3b8;
  margin: 0 0 16px;
}

.slots-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.day-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.day-label {
  width: 40px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  padding-top: 6px;
  flex-shrink: 0;
}

.day-slots {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.slot-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #ebf8ff;
  color: #2b6cb0;
  border: 1px solid #90cdf4;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  font-family: monospace;
}

.slot-remove {
  background: none;
  border: none;
  color: #90cdf4;
  cursor: pointer;
  font-size: 13px;
  padding: 0;
  line-height: 1;
}

.slot-remove:hover {
  color: #ef4444;
}

.slot-add-form {
  display: flex;
  align-items: center;
  gap: 6px;
}

.time-input {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  color: #1a1a2e;
  outline: none;
  width: 90px;
}

.time-input:focus {
  border-color: #48bb78;
}

.time-sep {
  color: #94a3b8;
  font-size: 12px;
}

.btn-sm-green {
  background: #48bb78;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
}

.btn-sm-green:hover {
  background: #38a169;
}

.btn-sm-gray {
  background: #f1f5f9;
  color: #64748b;
  border: none;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
}

.btn-add-slot {
  background: none;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add-slot:hover {
  border-color: #48bb78;
  color: #48bb78;
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
