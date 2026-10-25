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
  { slug: 'dp', label: '动态规划' },
  { slug: 'graph-bfs', label: '树的遍历 · BFS' }
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
