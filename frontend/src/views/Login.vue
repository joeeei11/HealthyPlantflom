<template>
  <div class="login-wrapper">
    <div class="login-card">
      <h1 class="title">心理健康咨询平台</h1>
      <p class="subtitle">大学生心理健康支持服务</p>

      <!-- 角色选择 -->
      <div class="role-tabs">
        <button
          v-for="r in roles"
          :key="r.value"
          :class="['role-tab', { active: selectedRole === r.value }]"
          @click="selectedRole = r.value"
        >
          {{ r.label }}
        </button>
      </div>

      <!-- 登录表单 -->
      <form class="form" @submit.prevent="handleLogin">
        <div class="field">
          <label>账号</label>
          <input
            v-model="form.username"
            type="text"
            placeholder="请输入用户名或邮箱"
            autocomplete="username"
            required
          />
        </div>
        <div class="field">
          <label>密码</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            autocomplete="current-password"
            required
          />
        </div>

        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </form>

      <p class="register-hint">
        没有账号？
        <button class="link-btn" @click="showRegister = true">立即注册</button>
      </p>
    </div>

    <!-- 注册弹窗 -->
    <div v-if="showRegister" class="modal-overlay" @click.self="showRegister = false">
      <div class="modal-card">
        <h2>注册账号</h2>
        <form @submit.prevent="handleRegister">
          <div class="field">
            <label>用户名</label>
            <input v-model="regForm.username" type="text" placeholder="4-20位字母数字" required />
          </div>
          <div class="field">
            <label>邮箱</label>
            <input v-model="regForm.email" type="email" placeholder="请输入邮箱" required />
          </div>
          <div class="field">
            <label>密码</label>
            <input v-model="regForm.password" type="password" placeholder="至少6位" required />
          </div>
          <div class="field">
            <label>角色</label>
            <select v-model="regForm.role">
              <option value="student">学生</option>
              <option value="counselor">咨询师</option>
              <option value="school">学校管理员</option>
            </select>
          </div>
          <p v-if="regError" class="error">{{ regError }}</p>
          <div class="modal-actions">
            <button type="button" class="cancel-btn" @click="showRegister = false">取消</button>
            <button type="submit" class="submit-btn" :disabled="regLoading">
              {{ regLoading ? '注册中...' : '注册' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api/auth'

const router = useRouter()
const authStore = useAuthStore()

const roles = [
  { label: '学生', value: 'student' },
  { label: '咨询师', value: 'counselor' },
  { label: '学校管理', value: 'school' },
]

const roleHomeMap = {
  student: '/student',
  counselor: '/counselor',
  school: '/school',
}

const selectedRole = ref('student')
const loading = ref(false)
const errorMsg = ref('')
const showRegister = ref(false)

const form = reactive({ username: '', password: '' })

async function handleLogin() {
  errorMsg.value = ''
  loading.value = true
  try {
    await authStore.login({ username: form.username, password: form.password })
    const userRole = authStore.role
    router.push(roleHomeMap[userRole] || '/login')
  } catch (err) {
    errorMsg.value = err.message || '登录失败，请检查账号密码'
  } finally {
    loading.value = false
  }
}

// 注册
const regLoading = ref(false)
const regError = ref('')
const regForm = reactive({ username: '', email: '', password: '', role: 'student' })

async function handleRegister() {
  regError.value = ''
  regLoading.value = true
  try {
    await authApi.register(regForm)
    showRegister.value = false
    // 注册成功后自动填入用户名
    form.username = regForm.username
    form.password = ''
    errorMsg.value = ''
    alert('注册成功，请登录')
  } catch (err) {
    regError.value = err.message || '注册失败'
  } finally {
    regLoading.value = false
  }
}
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px;
  width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  text-align: center;
  margin: 0 0 6px;
}

.subtitle {
  font-size: 13px;
  color: #888;
  text-align: center;
  margin: 0 0 24px;
}

.role-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.role-tab {
  flex: 1;
  padding: 8px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: #f5f5f5;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.2s;
}

.role-tab.active {
  border-color: #667eea;
  background: #f0f0ff;
  color: #667eea;
  font-weight: 600;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 13px;
  color: #555;
  font-weight: 500;
}

.field input,
.field select {
  padding: 10px 12px;
  border: 1.5px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.field input:focus,
.field select:focus {
  border-color: #667eea;
}

.error {
  font-size: 13px;
  color: #e53e3e;
  margin: 0;
}

.submit-btn {
  padding: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.register-hint {
  text-align: center;
  margin: 16px 0 0;
  font-size: 13px;
  color: #888;
}

.link-btn {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 13px;
  padding: 0;
  text-decoration: underline;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  width: 360px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-card h2 {
  margin: 0 0 20px;
  font-size: 18px;
  color: #1a1a2e;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.cancel-btn {
  flex: 1;
  padding: 10px;
  border: 1.5px solid #ddd;
  border-radius: 8px;
  background: #f5f5f5;
  cursor: pointer;
  font-size: 14px;
}

.modal-actions .submit-btn {
  flex: 1;
}
</style>
