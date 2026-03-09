import request from '@/utils/request'

export const aiApi = {
  // 对话管理
  getConversations: (params) =>
    request.get('/api/v1/student/ai/conversations', { params }),
  createConversation: (data) =>
    request.post('/api/v1/student/ai/conversations', data),
  getMessages: (conversationId) =>
    request.get(`/api/v1/student/ai/conversations/${conversationId}/messages`),

  /**
   * 发送消息（SSE 流式）
   * @param {number} conversationId
   * @param {string} content
   * @param {object} callbacks - { onDelta, onDone, onError }
   * @returns {() => void} 关闭函数
   */
  sendMessage(conversationId, content, { onDelta, onDone, onError } = {}) {
    const token = localStorage.getItem('token')
    const url = `/api/v1/student/ai/conversations/${conversationId}/messages`

    // 使用 fetch + ReadableStream 发送 POST SSE 请求
    const controller = new AbortController()

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          onError?.(data.message || '请求失败')
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() // 保留不完整的最后一行

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (!raw) continue
            try {
              const event = JSON.parse(raw)
              if (event.type === 'delta') {
                onDelta?.(event.content)
              } else if (event.type === 'done') {
                onDone?.(event)
              } else if (event.type === 'error') {
                onError?.(event.message)
              }
            } catch {
              // 忽略解析异常行
            }
          }
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          onError?.(err.message || '连接失败')
        }
      })

    return () => controller.abort()
  },
}
