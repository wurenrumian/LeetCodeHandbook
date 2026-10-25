/**
 * 刷题进度：localStorage 持久化。
 *
 * 三态而不是两态 —— "会背模板" 和 "能在白板上写对" 是两件事，
 * 中间那个 "看过但没把握" 的状态才是复习队列真正要盯的东西。
 */
import { reactive, watch } from 'vue'

export type ProgressState = 'todo' | 'learning' | 'done'

const STORAGE_KEY = 'lch:progress:v1'

function load(): Record<string, ProgressState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, ProgressState>) : {}
  } catch {
    return {}
  }
}

export const progress = reactive<Record<string, ProgressState>>(load())

let watcherBound = false

function bindWatcher() {
  if (watcherBound) return
  watcherBound = true
  watch(
    () => ({ ...progress }),
    (value) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
      } catch {
        /* 隐私模式下写入会失败，忽略即可 */
      }
    },
    { deep: true }
  )
}

export function useProgress() {
  bindWatcher()

  const get = (key: string): ProgressState => progress[key] ?? 'todo'

  const set = (key: string, state: ProgressState) => {
    progress[key] = state
  }

  const CYCLE: Record<ProgressState, ProgressState> = {
    todo: 'learning',
    learning: 'done',
    done: 'todo'
  }

  const next = (key: string): ProgressState => CYCLE[get(key)]

  const stats = (keys: string[]) => {
    const total = keys.length
    let done = 0
    let learning = 0
    for (const k of keys) {
      const s = get(k)
      if (s === 'done') done++
      else if (s === 'learning') learning++
    }
    return { total, done, learning, todo: total - done - learning }
  }

  const reset = () => {
    for (const k of Object.keys(progress)) delete progress[k]
  }

  return { progress, get, set, next, stats, reset }
}
