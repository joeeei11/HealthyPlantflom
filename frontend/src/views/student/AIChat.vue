<template>
  <div class="chat-layout">
    <!-- 左侧：对话列表 -->
    <div class="sidebar">
      <div class="sidebar-top">
        <button class="btn-new" @click="createNewConv">
          <span>＋</span> 新对话
        </button>
      </div>
      <div class="conv-list">
        <div v-if="convsLoading" class="conv-loading">加载中...</div>
        <div
          v-for="conv in conversations"
          :key="conv.id"
          :class="['conv-item', { active: currentConvId === conv.id }]"
          @click="selectConv(conv.id)"
        >
          <div class="conv-title">{{ conv.title || '新对话' }}</div>
          <div class="conv-time">{{ formatTime(conv.updatedAt || conv.createdAt) }}</div>
        </div>
        <div v-if="!convsLoading && conversations.length === 0" class="conv-empty">
          暂无对话记录
        </div>
      </div>
    </div>

    <!-- 右侧：聊天区域 -->
    <div class="chat-area">
      <!-- 未选中状态 -->
      <div v-if="!currentConvId" class="empty-chat">
        <div class="empty-icon">🤖</div>
        <p class="empty-title">AI 心理助手</p>
        <p class="empty-desc">我是您的专属心理健康陪伴助手，随时倾听您的心声。</p>
        <button class="btn-start" @click="createNewConv">开始对话</button>
      </div>

      <template v-else>
        <!-- 顶部标题 -->
        <div class="chat-header">
          <span class="chat-title">{{ currentTitle }}</span>
        </div>

        <!-- 消息列表 -->
        <div class="messages" ref="messagesEl">
          <div v-if="msgsLoading" class="msg-loading">加载中...</div>
          <template v-else>
            <div
              v-for="msg in messages"
              :key="msg.id || msg._tmpId"
              :class="['msg-wrap', msg.role]"
            >
              <div v-if="msg.role === 'assistant'" class="msg-avatar">🤖</div>
              <div :class="['bubble', msg.role]">
                <span v-if="msg.role === 'assistant'" class="msg-text" v-html="renderText(msg.content)"></span>
                <span v-else class="msg-text">{{ msg.content }}</span>
                <span v-if="msg._streaming" class="cursor">▋</span>
              </div>
              <div v-if="msg.role === 'user'" class="msg-avatar user-av">我</div>
            </div>
          </template>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
          <textarea
            ref="inputEl"
            v-model="inputText"
            :disabled="streaming"
            placeholder="输入您想说的话，按 Enter 发送，Shift+Enter 换行"
            rows="3"
            @keydown.enter.exact.prevent="sendMsg"
          ></textarea>
          <button
            class="btn-send"
            :disabled="streaming || !inputText.trim()"
            @click="sendMsg"
          >
            <span v-if="streaming" class="stop-icon" @click.stop="stopStreaming">■ 停止</span>
            <span v-else>发送</span>
          </button>
        </div>
      </template>
    </div>

    <!-- 新建对话弹窗 -->
    <div v-if="newConvDialog" class="modal-mask" @click.self="newConvDialog = false">
      <div class="modal">
        <div class="modal-header">
          <h3>新建对话</h3>
          <button class="modal-close" @click="newConvDialog = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-item">
            <label>对话标题（选填）</label>
            <input
              v-model="newConvTitle"
              placeholder="例如：情绪困扰、学业压力..."
              @keyup.enter="confirmNewConv"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-outline" @click="newConvDialog = false">取消</button>
          <button class="btn-primary" @click="confirmNewConv" :disabled="creatingConv">
            {{ creatingConv ? '创建中...' : '开始对话' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { aiApi } from '@/api/ai'

const conversations = ref([])
const currentConvId = ref(null)
const messages = ref([])
const convsLoading = ref(false)
const msgsLoading = ref(false)

const inputText = ref('')
const streaming = ref(false)
const stopFn = ref(null)

const messagesEl = ref(null)
const inputEl = ref(null)

const newConvDialog = ref(false)
const newConvTitle = ref('')
const creatingConv = ref(false)

const currentTitle = computed(() => {
  const conv = conversations.value.find(c => c.id === currentConvId.value)
  return conv?.title || '新对话'
})

function formatTime(d) {
  if (!d) return ''
  const date = new Date(d)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

function renderText(text) {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>')
}

async function scrollToBottom() {
  await nextTick()
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  }
}

async function loadConversations() {
  convsLoading.value = true
  try {
    const res = await aiApi.getConversations({ pageSize: 50 })
    conversations.value = res.data?.list || res.data || []
  } catch {
    conversations.value = []
  } finally {
    convsLoading.value = false
  }
}

async function selectConv(id) {
  if (currentConvId.value === id) return
  if (streaming.value) stopStreaming()
  currentConvId.value = id
  messages.value = []
  msgsLoading.value = true
  try {
    const res = await aiApi.getMessages(id)
    messages.value = res.data?.list || res.data || []
  } catch {
    messages.value = []
  } finally {
    msgsLoading.value = false
    scrollToBottom()
  }
}

function createNewConv() {
  newConvTitle.value = ''
  newConvDialog.value = true
}

async function confirmNewConv() {
  creatingConv.value = true
  try {
    const res = await aiApi.createConversation({ title: newConvTitle.value || '新对话' })
    const newConv = res.data
    conversations.value.unshift(newConv)
    newConvDialog.value = false
    messages.value = []
    currentConvId.value = newConv.id
    await nextTick()
    inputEl.value?.focus()
  } catch {
    // ignore
  } finally {
    creatingConv.value = false
  }
}

async function sendMsg() {
  const content = inputText.value.trim()
  if (!content || streaming.value || !currentConvId.value) return

  inputText.value = ''

  // 立即显示用户消息
  const userMsg = { _tmpId: Date.now(), role: 'user', content }
  messages.value.push(userMsg)

  // 占位 AI 消息
  const assistantMsg = { _tmpId: Date.now() + 1, role: 'assistant', content: '', _streaming: true }
  messages.value.push(assistantMsg)
  streaming.value = true
  await scrollToBottom()

  stopFn.value = aiApi.sendMessage(currentConvId.value, content, {
    onDelta(delta) {
      assistantMsg.content += delta
      scrollToBottom()
    },
    onDone(event) {
      assistantMsg._streaming = false
      streaming.value = false
      stopFn.value = null
      // 替换临时消息为服务端返回的真实消息
      if (event?.userMessageId || event?.assistantMessageId) {
        loadConversationMessages()
      }
      scrollToBottom()
    },
    onError(err) {
      assistantMsg._streaming = false
      assistantMsg.content = assistantMsg.content || `[错误：${err || '请求失败'}]`
      streaming.value = false
      stopFn.value = null
      scrollToBottom()
    },
  })
}

async function loadConversationMessages() {
  try {
    const res = await aiApi.getMessages(currentConvId.value)
    messages.value = res.data?.list || res.data || []
    scrollToBottom()
  } catch {
    // keep current messages
  }
}

function stopStreaming() {
  if (stopFn.value) {
    stopFn.value()
    stopFn.value = null
  }
  streaming.value = false
  const last = messages.value[messages.value.length - 1]
  if (last?._streaming) {
    last._streaming = false
    if (!last.content) last.content = '[已停止]'
  }
}

onMounted(async () => {
  await loadConversations()
  if (conversations.value.length > 0) {
    await selectConv(conversations.value[0].id)
  }
})

onUnmounted(() => {
  if (stopFn.value) stopFn.value()
})
</script>

<style scoped>
.chat-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* 左侧对话列表 */
.sidebar {
  width: 240px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-top {
  padding: 16px 12px;
  border-bottom: 1px solid #f1f5f9;
}

.btn-new {
  width: 100%;
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 9px;
  padding: 10px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-new:hover {
  background: #5a6fd6;
}

.conv-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.conv-loading,
.conv-empty {
  color: #94a3b8;
  font-size: 13px;
  text-align: center;
  padding: 20px 12px;
}

.conv-item {
  padding: 10px 16px;
  cursor: pointer;
  border-radius: 0;
  transition: background 0.15s;
  border-left: 3px solid transparent;
}

.conv-item:hover {
  background: #f8fafc;
}

.conv-item.active {
  background: #ede9fe;
  border-left-color: #667eea;
}

.conv-title {
  font-size: 14px;
  color: #1a1a2e;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-item.active .conv-title {
  color: #667eea;
}

.conv-time {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 3px;
}

/* 右侧聊天区域 */
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f8fafc;
}

/* 空状态 */
.empty-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  text-align: center;
}

.empty-icon {
  font-size: 60px;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}

.empty-desc {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  max-width: 320px;
  line-height: 1.6;
}

.btn-start {
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 12px 32px;
  font-size: 15px;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.2s;
}

.btn-start:hover {
  background: #5a6fd6;
}

/* 顶部标题 */
.chat-header {
  padding: 14px 24px;
  background: #fff;
  border-bottom: 1px solid #f1f5f9;
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
}

/* 消息列表 */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.msg-loading {
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
  padding: 20px 0;
}

.msg-wrap {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.msg-wrap.user {
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #ede9fe;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.msg-avatar.user-av {
  background: #667eea;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
}

.bubble {
  max-width: 68%;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;
}

.bubble.assistant {
  background: #fff;
  border: 1px solid #f1f5f9;
  color: #1a1a2e;
  border-radius: 4px 12px 12px 12px;
}

.bubble.user {
  background: #667eea;
  color: #fff;
  border-radius: 12px 4px 12px 12px;
}

.msg-text {
  white-space: pre-wrap;
}

.cursor {
  display: inline-block;
  color: #667eea;
  animation: blink 0.8s step-end infinite;
  margin-left: 2px;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* 输入区域 */
.input-area {
  padding: 16px 24px;
  background: #fff;
  border-top: 1px solid #f1f5f9;
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-area textarea {
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  resize: none;
  line-height: 1.6;
  color: #1a1a2e;
  background: #f8fafc;
  transition: border-color 0.2s;
  max-height: 120px;
}

.input-area textarea:focus {
  border-color: #667eea;
  background: #fff;
}

.input-area textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-send {
  background: #667eea;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
  white-space: nowrap;
  align-self: flex-end;
  height: 42px;
}

.btn-send:hover:not(:disabled) {
  background: #5a6fd6;
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stop-icon {
  cursor: pointer;
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
  width: 420px;
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

.form-item input {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 14px;
  color: #1a1a2e;
  outline: none;
  background: #fff;
}

.form-item input:focus {
  border-color: #667eea;
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
</style>
