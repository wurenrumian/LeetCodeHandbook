<script setup lang="ts">
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
import { PROBLEMS, TOPICS, type Difficulty } from '../data/problems'
import { useProgress } from '../composables/useProgress'

const { get, next, stats, reset } = useProgress()

const keyword = ref('')
const difficulty = ref<'all' | Difficulty>('all')
const topic = ref<string>('all')
const onlyUnfinished = ref(false)

const allIds = PROBLEMS.map((p) => p.id.toString())
const stat = computed(() => stats(allIds))

const allTags = computed(() => {
  const set = new Set<string>()
  PROBLEMS.forEach((p) => p.tags.forEach((t) => set.add(t)))
  return [...set]
})
const activeTag = ref<string | null>(null)

const rows = computed(() =>
  PROBLEMS.filter((p) => {
    if (difficulty.value !== 'all' && p.difficulty !== difficulty.value) return false
    if (topic.value !== 'all' && p.topic !== topic.value) return false
    if (activeTag.value && !p.tags.includes(activeTag.value)) return false
    if (onlyUnfinished.value && get(p.id.toString()) === 'done') return false
    if (keyword.value.trim()) {
      const k = keyword.value.trim().toLowerCase()
      const hay = `${p.id} ${p.title} ${p.tags.join(' ')} ${p.topicLabel}`.toLowerCase()
      if (!hay.includes(k)) return false
    }
    return true
  })
)

const diffClass = (d: Difficulty) =>
  d === '简单' ? 'is-easy' : d === '中等' ? 'is-medium' : 'is-hard'

const stateLabel = (key: string) => {
  const s = get(key)
  return s === 'done' ? '已掌握' : s === 'learning' ? '待复习' : '未开始'
}

const resetAll = () => {
  if (confirm('清空全部刷题进度？此操作不可撤销。')) reset()
}
</script>

<template>
  <div class="pi">
    <div class="pi-stats">
      <div class="pi-bar">
        <div class="pi-bar-done" :style="{ width: (stat.done / stat.total) * 100 + '%' }" />
        <div class="pi-bar-learning" :style="{ width: (stat.learning / stat.total) * 100 + '%' }" />
      </div>
      <span class="pi-stat-text">
        已掌握 <b>{{ stat.done }}</b> · 待复习 <b>{{ stat.learning }}</b> · 共
        <b>{{ stat.total }}</b> 题
      </span>
    </div>

    <div class="pi-controls">
      <input v-model="keyword" class="pi-search" type="search" placeholder="搜索题号 / 标题 / 标签…" />
      <select v-model="difficulty">
        <option value="all">全部难度</option>
        <option value="简单">简单</option>
        <option value="中等">中等</option>
        <option value="困难">困难</option>
      </select>
      <select v-model="topic">
        <option value="all">全部专题</option>
        <option v-for="t in TOPICS" :key="t.slug" :value="t.slug">{{ t.label }}</option>
      </select>
      <label class="pi-check">
        <input v-model="onlyUnfinished" type="checkbox" />
        只看未掌握
      </label>
      <button class="pi-reset" @click="resetAll">清空进度</button>
    </div>

    <div class="pi-tags">
      <button
        class="pi-tag"
        :class="{ active: activeTag === null }"
        @click="activeTag = null"
      >
        全部标签
      </button>
      <button
        v-for="t in allTags"
        :key="t"
        class="pi-tag"
        :class="{ active: activeTag === t }"
        @click="activeTag = activeTag === t ? null : t"
      >
        {{ t }}
      </button>
    </div>

    <table class="pi-table">
      <thead>
        <tr>
          <th class="col-state">进度</th>
          <th class="col-id">题号</th>
          <th>题目</th>
          <th class="col-diff">难度</th>
          <th class="col-topic">专题</th>
          <th class="col-tags">标签</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in rows" :key="p.id" :class="'state-' + get(p.id.toString())">
          <td class="col-state">
            <button
              class="pi-check-btn"
              :class="'is-' + get(p.id.toString())"
              :title="stateLabel(p.id.toString()) + ' — 点击切换'"
              @click="next(p.id.toString())"
            >
              <span v-if="get(p.id.toString()) === 'done'">✓</span>
              <span v-else-if="get(p.id.toString()) === 'learning'">•</span>
              <span v-else>○</span>
            </button>
          </td>
          <td class="col-id">{{ p.id }}</td>
          <td>
            <a v-if="p.link" :href="withBase(p.link)">{{ p.title }}</a>
            <span v-else class="pi-plain">{{ p.title }}</span>
          </td>
          <td class="col-diff">
            <span class="pi-diff" :class="diffClass(p.difficulty)">{{ p.difficulty }}</span>
          </td>
          <td class="col-topic">{{ p.topicLabel }}</td>
          <td class="col-tags">
            <span v-for="t in p.tags" :key="t" class="pi-chip">{{ t }}</span>
          </td>
        </tr>
        <tr v-if="rows.length === 0">
          <td colspan="6" class="pi-empty">没有匹配的题目，换个筛选条件试试。</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.pi {
  margin: 24px 0;
}

.pi-stats {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.pi-bar {
  display: flex;
  width: 180px;
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--vp-c-divider);
}

.pi-bar-done {
  background: var(--vp-c-brand-1);
  transition: width 0.25s ease;
}

.pi-bar-learning {
  background: var(--vp-c-warning-1);
  transition: width 0.25s ease;
}

.pi-stat-text {
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.pi-stat-text b {
  color: var(--vp-c-text-1);
}

.pi-controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 12px;
}

.pi-controls input[type='search'],
.pi-controls select {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 13px;
  outline: none;
}

.pi-controls input[type='search'] {
  flex: 1 1 220px;
  min-width: 160px;
}

.pi-controls input[type='search']:focus,
.pi-controls select:focus {
  border-color: var(--vp-c-brand-1);
}

.pi-check {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  user-select: none;
}

.pi-reset {
  margin-left: auto;
  height: 32px;
  padding: 0 10px;
  font-size: 12px;
  color: var(--vp-c-text-3);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
}

.pi-reset:hover {
  color: var(--vp-c-danger-1);
  border-color: var(--vp-c-danger-1);
}

.pi-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.pi-tag {
  font-size: 12px;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.15s;
}

.pi-tag:hover {
  border-color: var(--vp-c-brand-2);
  color: var(--vp-c-brand-1);
}

.pi-tag.active {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: #fff;
}

.pi-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
  /* 别写 display: table —— 同上，会废掉横向滚动 */
  display: block;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* display:block 后表头和表体需要显式成组，否则列宽对不齐 */
.pi-table thead,
.pi-table tbody {
  display: table;
  width: 100%;
  table-layout: auto;
}

.pi-table th {
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-3);
  padding: 6px 8px;
  border-bottom: 1px solid var(--vp-c-divider);
  white-space: nowrap;
}

.pi-table td {
  padding: 8px;
  border-bottom: 1px solid var(--vp-c-divider);
  vertical-align: middle;
}

.pi-table tr.state-done td {
  opacity: 0.62;
}

.col-state,
.col-id,
.col-diff {
  width: 1%;
  white-space: nowrap;
}

.col-id {
  font-variant-numeric: tabular-nums;
  color: var(--vp-c-text-3);
}

.col-topic {
  white-space: nowrap;
  color: var(--vp-c-text-2);
  font-size: 12.5px;
}

.pi-check-btn {
  width: 22px;
  height: 22px;
  line-height: 1;
  border-radius: 50%;
  border: 1.5px solid var(--vp-c-divider);
  background: transparent;
  color: var(--vp-c-text-3);
  font-size: 11px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.pi-check-btn.is-learning {
  border-color: var(--vp-c-warning-1);
  color: var(--vp-c-warning-1);
}

.pi-check-btn.is-done {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-1);
  color: #fff;
}

.pi-diff {
  font-size: 11.5px;
  padding: 2px 7px;
  border-radius: 4px;
  white-space: nowrap;
}

.pi-diff.is-easy {
  color: #1a7f37;
  background: rgba(26, 127, 55, 0.1);
}

.pi-diff.is-medium {
  color: #b7791f;
  background: rgba(183, 121, 31, 0.12);
}

.pi-diff.is-hard {
  color: #cf222e;
  background: rgba(207, 34, 46, 0.1);
}

.dark .pi-diff.is-easy {
  color: #3fb950;
  background: rgba(63, 185, 80, 0.12);
}

.dark .pi-diff.is-medium {
  color: #d29922;
  background: rgba(210, 153, 34, 0.12);
}

.dark .pi-diff.is-hard {
  color: #f85149;
  background: rgba(248, 81, 73, 0.12);
}

.pi-chips {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.pi-chip {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
  margin-right: 4px;
  white-space: nowrap;
}

.pi-link {
  color: inherit;
}

.pi-plain {
  color: var(--vp-c-text-2);
}

.pi-empty {
  text-align: center;
  color: var(--vp-c-text-3);
  padding: 28px 0;
}
</style>
