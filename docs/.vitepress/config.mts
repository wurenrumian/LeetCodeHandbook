import { defineConfig } from 'vitepress'
import container from 'markdown-it-container'
import type Token from 'markdown-it/lib/token.mjs'

/**
 * 三个自定义容器，对应讲解里的三种固定结构。
 * 用容器而不是裸 HTML，是为了让 Markdown 内容仍然能被解析和搜索索引。
 */
function cheatContainer(md: any) {
  return {
    validate: (info: string) => info.trim().startsWith('cheat'),
    render: (tokens: Token[], idx: number) => {
      const token = tokens[idx]
      if (token.nesting !== 1) return '</div>\n'
      const raw = token.info.trim().slice('cheat'.length).trim()
      const title = raw || '速查卡'
      return `<div class="cheat"><p>${md.utils.escapeHtml(title)}</p>\n`
    }
  }
}

function plainContainer(name: string, className: string) {
  return {
    validate: (info: string) => info.trim() === name,
    render: (tokens: Token[], idx: number) =>
      tokens[idx].nesting === 1 ? `<div class="${className}">\n` : '</div>\n'
  }
}

/**
 * 模板对照：左模板 / 右本题。
 *
 * 写法：::: compare 通用模板 | 本题改动
 * 两个标题先输出，markdown 的两段代码块随后输出，在 2 列网格里自然落成
 *   第 1 行 = 两个标题，第 2 行 = 两段代码，不会错位。
 */
function compareContainer(md: any) {
  return {
    validate: (info: string) => /^compare(\s|$)/.test(info.trim()),
    render: (tokens: Token[], idx: number) => {
      const token = tokens[idx]
      if (token.nesting !== 1) return '</div>\n'

      const raw = token.info.trim().slice('compare'.length).trim()
      const [left, right] = raw.split('|').map((s: string) => s.trim())
      const l = md.utils.escapeHtml(left || '通用模板')
      const r = md.utils.escapeHtml(right || '本题改动')

      return (
        '<div class="compare">' +
        `<div class="cmp-head cmp-head-l">${l}</div>` +
        `<div class="cmp-head cmp-head-r">${r}</div>\n`
      )
    }
  }
}

export default defineConfig({
  lang: 'zh-CN',
  title: 'LeetCode 算法手册',
  description: '从代码形态讲清 LeetCode 常见算法：模板、变体、字段语义与边界坑点',

  // 部署到内网子目录（如 http://host/handbook/）时改成 '/handbook/'
  base: '/',
  cleanUrls: false,
  lastUpdated: true,

  markdown: {
    lineNumbers: true,
    theme: { light: 'github-light', dark: 'github-dark' },
    container: {
      tipLabel: '提示',
      warningLabel: '坑点',
      dangerLabel: '易错',
      infoLabel: '补充',
      detailsLabel: '展开细节'
    },
    config(md) {
      md.use(container, 'cheat', cheatContainer(md))
      md.use(container, 'compare', compareContainer(md))
      md.use(container, 'semantics', plainContainer('semantics', 'semantics'))
    }
  },

  themeConfig: {
    logo: '/logo.svg',
    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    darkModeSwitchLabel: '主题',
    sidebarMenuLabel: '目录',
    returnToTopLabel: '回到顶部',
    lastUpdatedText: '最后更新',

    nav: [
      { text: '开始', link: '/guide/' },
      { text: '专题', link: '/topics/' },
      { text: '题目索引', link: '/problems/' },
      { text: '写作约定', link: '/guide/conventions' }
    ],

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
          modal: {
            noResultsText: '没有找到结果',
            resetButtonTitle: '清除条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭'
            }
          }
        }
      }
    },

    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '这份手册怎么用', link: '/guide/' },
            { text: '写作与代码约定', link: '/guide/conventions' }
          ]
        }
      ],
      '/topics/binary-search/': [
        {
          text: '二分查找',
          items: [
            { text: '专题总览 · 模板与变体', link: '/topics/binary-search/' },
            { text: '704 · 二分查找', link: '/topics/binary-search/704-binary-search' },
            {
              text: '34 · 第一个和最后一个位置',
              link: '/topics/binary-search/34-first-last-position'
            }
          ]
        }
      ],
      '/topics/sliding-window/': [
        {
          text: '滑动窗口',
          items: [
            { text: '专题总览 · 模板与变体', link: '/topics/sliding-window/' },
            { text: '3 · 无重复字符的最长子串', link: '/topics/sliding-window/3-longest-substring' }
          ]
        }
      ],
      '/topics/two-pointers/': [
        {
          text: '双指针',
          items: [
            { text: '专题总览 · 模板与变体', link: '/topics/two-pointers/' },
            { text: '26 · 删除有序数组中的重复项', link: '/topics/two-pointers/26-remove-duplicates' }
          ]
        }
      ],
      '/topics/dp/': [
        {
          text: '动态规划',
          items: [
            { text: '专题总览 · 模板与变体', link: '/topics/dp/' },
            { text: '322 · 零钱兑换', link: '/topics/dp/322-coin-change' }
          ]
        }
      ],
      '/topics/graph-bfs/': [
        {
          text: '树的遍历 · BFS',
          items: [
            { text: '专题总览 · 模板与变体', link: '/topics/graph-bfs/' },
            { text: '102 · 二叉树的层序遍历', link: '/topics/graph-bfs/102-level-order' }
          ]
        }
      ],
      '/topics/hash-table/': [
        {
          text: '哈希表',
          items: [
            { text: '专题总览 · 模板与变体', link: '/topics/hash-table/' },
            { text: '1 · 两数之和', link: '/topics/hash-table/1-two-sum' },
            { text: '49 · 字母异位词分组', link: '/topics/hash-table/49-group-anagrams' }
          ]
        }
      ],
      '/topics/linked-list/': [
        {
          text: '链表',
          items: [
            { text: '专题总览 · 模板与变体', link: '/topics/linked-list/' },
            { text: '206 · 反转链表', link: '/topics/linked-list/206-reverse-list' },
            { text: '146 · LRU 缓存', link: '/topics/linked-list/146-lru-cache' }
          ]
        }
      ],
      '/topics/stack/': [
        {
          text: '栈与单调栈',
          items: [
            { text: '专题总览 · 模板与变体', link: '/topics/stack/' },
            { text: '20 · 有效的括号', link: '/topics/stack/20-valid-parentheses' },
            { text: '739 · 每日温度', link: '/topics/stack/739-daily-temperatures' }
          ]
        }
      ],
      '/topics/backtracking/': [
        {
          text: '回溯',
          items: [
            { text: '专题总览 · 模板与变体', link: '/topics/backtracking/' },
            { text: '46 · 全排列', link: '/topics/backtracking/46-permutations' },
            { text: '78 · 子集', link: '/topics/backtracking/78-subsets' }
          ]
        }
      ],
      '/topics/graph-dfs/': [
        {
          text: '图的遍历 · DFS',
          items: [
            { text: '专题总览 · 模板与变体', link: '/topics/graph-dfs/' },
            { text: '200 · 岛屿数量', link: '/topics/graph-dfs/200-number-of-islands' },
            { text: '207 · 课程表', link: '/topics/graph-dfs/207-course-schedule' }
          ]
        }
      ],
      '/topics/': [
        {
          text: '专题',
          items: [
            { text: '专题总览', link: '/topics/' },
            { text: '二分查找', link: '/topics/binary-search/' },
            { text: '滑动窗口', link: '/topics/sliding-window/' },
            { text: '双指针', link: '/topics/two-pointers/' },
            { text: '哈希表', link: '/topics/hash-table/' },
            { text: '链表', link: '/topics/linked-list/' },
            { text: '栈与单调栈', link: '/topics/stack/' },
            { text: '动态规划', link: '/topics/dp/' },
            { text: '回溯', link: '/topics/backtracking/' },
            { text: '树的遍历 · BFS', link: '/topics/graph-bfs/' },
            { text: '图的遍历 · DFS', link: '/topics/graph-dfs/' }
          ]
        }
      ],
      '/problems/': [
        {
          text: '题目索引',
          items: [{ text: '全部题目 · 可筛选', link: '/problems/' }]
        }
      ]
    },

    socialLinks: [],
    footer: {
      message: '本地内网站点 · 内容面向 C++ 面试与算法训练',
      copyright: 'LeetCode Handbook'
    }
  }
})
