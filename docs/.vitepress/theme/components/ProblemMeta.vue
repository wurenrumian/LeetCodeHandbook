<script setup lang="ts">
/**
 * 题目页头部的元信息条。
 *
 * 写作时的用法：
 * <ProblemMeta id="34" difficulty="中等" title="查找第一个和最后一个位置" :tags="['二分', '边界']" />
 */
import { computed } from 'vue'

const props = defineProps<{
  id: number | string
  difficulty: '简单' | '中等' | '困难'
  title?: string
  tags?: string[]
  /** 力扣原题地址；不填则用下面的 url 兜底 */
  url?: string
}>()

const lcUrl = computed(
  () => props.url ?? `https://leetcode.cn/problemset/?search=${props.id}`
)
</script>

<template>
  <div class="pm">
    <span class="pm-id">#{{ id }}</span>
    <span v-if="title" class="pm-title">{{ title }}</span>
    <span class="pm-diff" :class="'d-' + difficulty">
      {{ difficulty }}
    </span>
    <span v-for="t in tags" :key="t" class="pm-tag">{{ t }}</span>
    <span class="pm-spacer" />
    <a v-if="url" class="pm-lc" :href="lcUrl" target="_blank" rel="noreferrer">原题 ↗</a>
  </div>
</template>

<style scoped>
.pm {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin: 18px 0 26px;
  padding: 10px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}

.pm-id {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  color: var(--vp-c-brand-1);
  font-weight: 600;
}

.pm-title {
  font-weight: 600;
  font-size: 14px;
}

.pm-diff {
  font-size: 11.5px;
  padding: 2px 7px;
  border-radius: 4px;
}

.d-简单 {
  color: #1a7f37;
  background: rgba(26, 127, 55, 0.1);
}

.d-中等 {
  color: #b7791f;
  background: rgba(183, 121, 31, 0.12);
}

.d-困难 {
  color: #cf222e;
  background: rgba(207, 34, 46, 0.1);
}

.dark .d-简单 {
  color: #3fb950;
  background: rgba(63, 185, 80, 0.12);
}

.dark .d-中等 {
  color: #d29922;
  background: rgba(210, 153, 34, 0.12);
}

.dark .d-困难 {
  color: #f85149;
  background: rgba(248, 81, 73, 0.12);
}

.pm-tag {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
}

.pm-spacer {
  flex: 1;
}

@media (max-width: 640px) {
  .pm-spacer {
    display: none;
  }
}
</style>
