/**
 * 题目索引的单一数据源。
 *
 * 加题时只改这里 + 写对应 md，题目表格和侧边栏之外的入口都自动跟上。
 * link 指向专题页里的具体题目地址，没有讲解的题留空即可。
 */

export type Difficulty = '简单' | '中等' | '困难'

export interface Problem {
  /** LeetCode 题号，作为进度存储的 key */
  id: number
  title: string
  difficulty: Difficulty
  /** 所属专题，与 /topics/<slug>/ 对应 */
  topic: string
  topicLabel: string
  tags: string[]
  /** 站点内讲解页；为空表示尚未讲解 */
  link?: string
}

export const TOPICS = [
  { slug: 'binary-search', label: '二分查找' },
  { slug: 'sliding-window', label: '滑动窗口' },
  { slug: 'two-pointers', label: '双指针' },
  { slug: 'hash-table', label: '哈希表' },
  { slug: 'linked-list', label: '链表' },
  { slug: 'stack', label: '栈与单调栈' },
  { slug: 'dp', label: '动态规划' },
  { slug: 'backtracking', label: '回溯' },
  { slug: 'graph-bfs', label: '树的遍历 · BFS' },
  { slug: 'graph-dfs', label: '图的遍历 · DFS' }
] as const

export const PROBLEMS: Problem[] = [
  {
    id: 704,
    title: '二分查找',
    difficulty: '简单',
    topic: 'binary-search',
    topicLabel: '二分查找',
    tags: ['数组', '左闭右闭', '模板入门'],
    link: '/topics/binary-search/704-binary-search'
  },
  {
    id: 34,
    title: '在排序数组中查找元素的第一个和最后一个位置',
    difficulty: '中等',
    topic: 'binary-search',
    topicLabel: '二分查找',
    tags: ['数组', '边界收缩', 'lower_bound'],
    link: '/topics/binary-search/34-first-last-position'
  },
  {
    id: 3,
    title: '无重复字符的最长子串',
    difficulty: '中等',
    topic: 'sliding-window',
    topicLabel: '滑动窗口',
    tags: ['哈希表', '窗口计数', '同向双指针'],
    link: '/topics/sliding-window/3-longest-substring'
  },
  {
    id: 1,
    title: '两数之和',
    difficulty: '简单',
    topic: 'hash-table',
    topicLabel: '哈希表',
    tags: ['数组', '边遍历边记录', '哈希表'],
    link: '/topics/hash-table/1-two-sum'
  },
  {
    id: 49,
    title: '字母异位词分组',
    difficulty: '中等',
    topic: 'hash-table',
    topicLabel: '哈希表',
    tags: ['字符串', '分组', 'key 归一化'],
    link: '/topics/hash-table/49-group-anagrams'
  },
  {
    id: 20,
    title: '有效的括号',
    difficulty: '简单',
    topic: 'stack',
    topicLabel: '栈与单调栈',
    tags: ['字符串', '栈', '配对匹配'],
    link: '/topics/stack/20-valid-parentheses'
  },
  {
    id: 739,
    title: '每日温度',
    difficulty: '中等',
    topic: 'stack',
    topicLabel: '栈与单调栈',
    tags: ['数组', '单调栈', '下一个更大'],
    link: '/topics/stack/739-daily-temperatures'
  },
  {
    id: 206,
    title: '反转链表',
    difficulty: '简单',
    topic: 'linked-list',
    topicLabel: '链表',
    tags: ['链表', '三指针', '递归'],
    link: '/topics/linked-list/206-reverse-list'
  },
  {
    id: 146,
    title: 'LRU 缓存',
    difficulty: '中等',
    topic: 'linked-list',
    topicLabel: '链表',
    tags: ['链表', '哈希表', '双向链表'],
    link: '/topics/linked-list/146-lru-cache'
  },
  {
    id: 46,
    title: '全排列',
    difficulty: '中等',
    topic: 'backtracking',
    topicLabel: '回溯',
    tags: ['回溯', 'used 数组', '排列'],
    link: '/topics/backtracking/46-permutations'
  },
  {
    id: 78,
    title: '子集',
    difficulty: '中等',
    topic: 'backtracking',
    topicLabel: '回溯',
    tags: ['回溯', 'start 参数', '子集'],
    link: '/topics/backtracking/78-subsets'
  },
  {
    id: 200,
    title: '岛屿数量',
    difficulty: '中等',
    topic: 'graph-dfs',
    topicLabel: '图的遍历 · DFS',
    tags: ['网格', 'DFS', '连通分量'],
    link: '/topics/graph-dfs/200-number-of-islands'
  },
  {
    id: 207,
    title: '课程表',
    difficulty: '中等',
    topic: 'graph-dfs',
    topicLabel: '图的遍历 · DFS',
    tags: ['有向图', '判环', '三色标记'],
    link: '/topics/graph-dfs/207-course-schedule'
  },
  {
    id: 26,
    title: '删除有序数组中的重复项',
    difficulty: '简单',
    topic: 'two-pointers',
    topicLabel: '双指针',
    tags: ['数组', '原地修改', '快慢指针'],
    link: '/topics/two-pointers/26-remove-duplicates'
  },
  {
    id: 322,
    title: '零钱兑换',
    difficulty: '中等',
    topic: 'dp',
    topicLabel: '动态规划',
    tags: ['完全背包', '状态定义', '不可达标记'],
    link: '/topics/dp/322-coin-change'
  },
  {
    id: 102,
    title: '二叉树的层序遍历',
    difficulty: '中等',
    topic: 'graph-bfs',
    topicLabel: '树的遍历 · BFS',
    tags: ['队列', '层界快照', '二叉树'],
    link: '/topics/graph-bfs/102-level-order'
  }
]
