<script setup lang="ts">
/**
 * 进度切换按钮：三态循环 未开始 → 待复习 → 已掌握。
 * 用 id 作为 key，和题目索引页共用同一份 localStorage。
 */
import { computed } from 'vue'
import { useProgress } from '../composables/useProgress'

const props = defineProps<{
  id: number | string
  /** compact 模式用于题目索引表格，这里默认完整模式 */
  compact?: boolean
}>()

const { get, next } = useProgress()
const key = computed(() => String(props.id))
const state = computed(() => get(key.value))

const label = computed(
  () => ({ todo: '标记为待复习', learning: '标记为已掌握', done: '取消标记' })[state.value]
)
</script>

<template>
  <button class="pt" :class="['pt-' + state, { 'pt-compact': compact }]" :title="label" @click="next(key)">
    <span class="pt-icon">
      <template v-if="state === 'done'">✓</template>
      <template v-else-if="state === 'learning'">•</template>
      <template v-else>○</template>
    </span>
    <span v-if="!compact" class="pt-text">
      <template v-if="state === 'done'">已掌握</template>
      <template v-else-if="state === 'learning'">待复习</template>
      <template v-else>未开始</template>
    </span>
  </button>
</template>

<style scoped>
.pt {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 11px 0 9px;
  font-size: 12.5px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  background: transparent;
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.15s;
  vertical-align: middle;
}

.pt:hover {
  border-color: var(--vp-c-brand-2);
  color: var(--vp-c-brand-1);
}

.pt-icon {
  font-size: 11px;
  line-height: 1;
}

.pt-learning {
  border-color: var(--vp-c-warning-1);
  color: var(--vp-c-warning-1);
}

.pt-done {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-1);
  color: #fff;
}

.pt-done:hover {
  color: #fff;
  opacity: 0.9;
}

.pt-compact {
  width: 22px;
  height: 22px;
  padding: 0;
  justify-content: center;
}
</style>
