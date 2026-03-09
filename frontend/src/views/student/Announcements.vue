<template>
  <div class="page">
    <div class="page-header">
      <h2>学校公告</h2>
    </div>

    <div v-if="loading" class="state-text">加载中...</div>
    <div v-else-if="list.length === 0" class="state-text">暂无公告</div>
    <div v-else class="ann-list">
      <div v-for="ann in list" :key="ann.id" class="ann-card" :class="{ pinned: ann.isPinned }">
        <div class="ann-card-header">
          <div class="ann-title-row">
            <span v-if="ann.isPinned" class="pin-badge">📌 置顶</span>
            <h3 class="ann-title">{{ ann.title }}</h3>
          </div>
          <div class="ann-meta">
            <span class="ann-author">{{ ann.author?.username }}</span>
            <span class="ann-date">{{ formatDate(ann.publishedAt) }}</span>
          </div>
        </div>
        <p class="ann-content">{{ ann.content }}</p>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="pagination">
      <button :disabled="page <= 1" @click="changePage(page - 1)">上一页</button>
      <span>{{ page }} / {{ totalPages }}</span>
      <button :disabled="page >= totalPages" @click="changePage(page + 1)">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { studentApi } from '@/api/student'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 10

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'numeric', day: 'numeric',
  })
}

async function fetchList() {
  loading.value = true
  try {
    const res = await studentApi.getAnnouncements({ page: page.value, pageSize })
    list.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

function changePage(p) {
  page.value = p
  fetchList()
}

onMounted(fetchList)
</script>

<style scoped>
.page {
  padding: 32px;
  max-width: 860px;
}

.page-header {
  margin-bottom: 24px;
}

h2 {
  font-size: 24px;
  color: #1a1a2e;
  margin: 0;
  font-weight: 700;
}

.state-text {
  color: #94a3b8;
  font-size: 14px;
  text-align: center;
  padding: 48px 0;
}

.ann-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ann-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.ann-card.pinned {
  border-left: 4px solid #f59e0b;
}

.ann-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 12px;
}

.ann-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.pin-badge {
  flex-shrink: 0;
  font-size: 11px;
  background: #fef3c7;
  color: #d97706;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.ann-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
  word-break: break-word;
}

.ann-meta {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.ann-author {
  font-size: 12px;
  color: #64748b;
}

.ann-date {
  font-size: 12px;
  color: #94a3b8;
}

.ann-content {
  font-size: 14px;
  color: #475569;
  line-height: 1.7;
  margin: 0;
  white-space: pre-wrap;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}

.pagination button {
  padding: 6px 16px;
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination button:hover:not(:disabled) {
  background: #667eea;
  color: #fff;
  border-color: #667eea;
}

.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination span {
  font-size: 13px;
  color: #64748b;
}
</style>
