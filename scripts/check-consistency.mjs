#!/usr/bin/env node
/**
 * 文档库一致性检查。
 *
 * 这个站点卖的是"同一个算法、同一个概念、同一个字段，全站长得一样"。
 * 那句话如果不落到脚本上，加三题之后就会变成三种写法。
 *
 * 四类检查，任一不过就非零退出：
 *   1. 注册一致  problems.ts ↔ sidebar ↔ topics/index.md 题数 ↔ 实际 md 文件
 *   2. 结构一致  ProblemMeta / cheat / 七个固定小节 / compare·semantics·warning
 *   3. 命名一致  cpp 代码块里不许出现 l / r / m / c / q 这类单字母名
 *   4. 术语一致  正文不许出现 glossary.md 里列出的"禁止写法"
 *
 * 用法:
 *   node scripts/check-consistency.mjs
 *   node scripts/check-consistency.mjs --verbose    # 打印每个文件通过了什么
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, basename } from 'node:path'

const verbose = process.argv.includes('--verbose')

const DOCS = 'docs'
const DATA = join(DOCS, '.vitepress/theme/data/problems.ts')
const CONFIG = join(DOCS, '.vitepress/config.mts')
const TOPIC_INDEX = join(DOCS, 'topics/index.md')
const GLOSSARY = join(DOCS, 'guide/glossary.md')

const problems = []

function fail(check, file, line, msg) {
  problems.push({ check, file, line, msg })
}

function read(path, label) {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    fail(label, path, 0, '文件读不到')
    return null
  }
}

/** 行尾统一成 \n 再按行切，避免 CRLF 检出把行号算歪 */
function lines(text) {
  return text.replace(/\r\n/g, '\n').split('\n')
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (name.endsWith('.md')) out.push(p)
  }
  return out
}

// ── 1. 注册一致 ────────────────────────────────────────────────────────────

const dataText = read(DATA, '注册一致')
const configText = read(CONFIG, '注册一致')
const indexText = read(TOPIC_INDEX, '注册一致')

/** problems.ts 里的 PROBLEMS 数组：按 id: 切块，逐块取字段 */
function parseProblems(text) {
  const body = text.slice(text.indexOf('export const PROBLEMS'))
  const chunks = body.split(/\n\s*\{\s*\n/).slice(1)
  const out = []
  for (const chunk of chunks) {
    const id = chunk.match(/id:\s*(\d+)/)
    const topic = chunk.match(/topic:\s*'([^']+)'/)
    const link = chunk.match(/link:\s*'([^']+)'/)
    if (!id || !topic) continue
    out.push({
      id: id[1],
      topic: topic[1],
      link: link ? link[1] : null
    })
  }
  return out
}

/** config.mts 里的 sidebar：所有 link: '/topics/<slug>/<page>' */
function parseSidebarTopics(text) {
  const out = new Map() // slug -> Set(page)
  for (const m of text.matchAll(/link:\s*'\/topics\/([a-z-]+)\/([^']+)'/g)) {
    const slug = m[1]
    const page = m[2]
    if (page.endsWith('/')) continue // 专题首页
    if (!out.has(slug)) out.set(slug, new Set())
    out.get(slug).add(page)
  }
  return out
}

/** topics/index.md 的表格：| [名字](/topics/slug/) | ... | 题数 | */
function parseTopicCounts(text) {
  const out = new Map()
  for (const m of text.matchAll(/^\|\s*\[[^\]]+\]\(\/topics\/([a-z-]+)\/\)\s*\|.*\|\s*(\d+)\s*\|\s*$/gm)) {
    out.set(m[1], Number(m[2]))
  }
  return out
}

if (dataText && configText && indexText) {
  const entries = parseProblems(dataText)
  const sidebar = parseSidebarTopics(configText)
  const counts = parseTopicCounts(indexText)

  if (entries.length === 0) {
    fail('注册一致', DATA, 0, '解析不到任何题目记录 —— 数据格式变了？门禁静默失效比报警更危险')
  }

  const pageFiles = walk(join(DOCS, 'topics'))
    .filter((p) => /^[0-9]/.test(basename(p)))
    .map((p) => relative(DOCS, p).replace(/\\/g, '/'))

  const byFile = new Map(pageFiles.map((f) => [f, f]))

  /** 题目页 → 所在专题 slug、题号 */
  const pageInfo = new Map()
  for (const file of pageFiles) {
    const name = basename(file, '.md')
    const m = name.match(/^(\d+)-/)
    pageInfo.set(file, {
      id: m ? m[1] : null,
      topic: file.split('/')[1]
    })
  }

  // 1a. 每条注册记录都要有真实页面，且页面必须在同一个专题目录下
  for (const e of entries) {
    if (!e.link) continue
    const rel = e.link.replace(/^\//, '').replace(/\.html$/, '') + '.md'
    if (!byFile.has(rel)) {
      fail('注册一致', DATA, 0, `#${e.id} 的 link 指向不存在的页面：${e.link}`)
      continue
    }
    if (!rel.startsWith(`topics/${e.topic}/`)) {
      fail('注册一致', DATA, 0, `#${e.id} 声明 topic 为 ${e.topic}，页面却在 ${rel}`)
    }
  }

  // 1b. 每个题目页都要有注册记录（漏注册 = 索引搜不到）
  const registered = new Set(
    entries.filter((e) => e.link).map((e) => e.link.replace(/^\//, '').replace(/\.html$/, '') + '.md')
  )
  for (const file of pageFiles) {
    if (!registered.has(file)) {
      fail('注册一致', file, 0, '页面存在但 problems.ts 里没有对应记录')
    }
  }

  // 1c. sidebar 必须覆盖每个题目页，且不能指向不存在的页
  const allSidebar = new Set()
  for (const [, pages] of sidebar) for (const p of pages) allSidebar.add(p)
  for (const file of pageFiles) {
    const m = file.match(/^topics\/([^/]+)\/(.+)\.md$/)
    if (!m) continue
    const [, topic, name] = m
    const entry = sidebar.get(topic)
    if (!entry || !entry.has(name)) {
      fail('注册一致', CONFIG, 0, `${topic} 的 sidebar 里没有 ${name}`)
    }
  }
  for (const [topic, pages] of sidebar) {
    for (const page of pages) {
      if (!byFile.has(`topics/${topic}/${page}.md`)) {
        fail('注册一致', CONFIG, 0, `sidebar 指向不存在的页面：/topics/${topic}/${page}`)
      }
    }
  }

  // 1d. topics/index.md 的题数列，必须和实际页面数一致
  const actual = new Map()
  for (const [, info] of pageInfo) {
    actual.set(info.topic, (actual.get(info.topic) ?? 0) + 1)
  }
  for (const [topic, count] of actual) {
    const declared = counts.get(topic)
    if (declared === undefined) {
      fail('注册一致', TOPIC_INDEX, 0, `专题 ${topic} 在总览表里没有行`)
    } else if (declared !== count) {
      const line = lines(indexText).findIndex((l) => l.includes(`/topics/${topic}/`)) + 1
      fail('注册一致', TOPIC_INDEX, line, `专题 ${topic} 写的是 ${declared} 题，实际有 ${count} 个页面`)
    }
  }
  for (const [topic] of counts) {
    if (!actual.has(topic)) {
      fail('注册一致', TOPIC_INDEX, 0, `专题 ${topic} 在总览表里列了，但没有任何题目页`)
    }
  }

  if (verbose) {
    console.log(`  注册：${entries.length} 条记录 / ${pageFiles.length} 个页面 / ${counts.size} 个专题`)
  }
}

// ── 2. 结构一致 + 4. 术语一致（逐页）────────────────────────────────────────

/** 题目页必须有的小节，按这个顺序出现；中间允许插别的 `##` */
const REQUIRED_SECTIONS = [
  { key: '题意重述', test: (h) => h === '题意重述' },
  { key: '从朴素到…', test: (h) => h.startsWith('从') },
  { key: '模板对照', test: (h) => h === '模板对照' },
  { key: '完整可编译代码', test: (h) => h === '完整可编译代码' },
  { key: '逐段拆解', test: (h) => h === '逐段拆解' },
  { key: '坑点', test: (h) => h === '坑点' },
  { key: '变体与练习', test: (h) => h === '变体与练习' }
]

const REQUIRED_BLOCKS = [
  { key: '<ProblemMeta>', re: /<ProblemMeta\b/ },
  { key: '::: cheat', re: /::: cheat\b/ },
  { key: '::: compare', re: /::: compare\b/ },
  { key: '::: semantics', re: /::: semantics\b/ },
  { key: '::: warning', re: /::: warning\b/ }
]

const pageFilesAll = walk(join(DOCS, 'topics')).filter((p) => /^[0-9]/.test(basename(p)))
if (pageFilesAll.length === 0) {
  fail('结构一致', join(DOCS, 'topics'), 0, '一个题目页都找不到，检查脚本的数法是否还成立')
}

for (const file of pageFilesAll) {
  const text = read(file, '结构一致')
  if (!text) continue

  for (const block of REQUIRED_BLOCKS) {
    if (!block.re.test(text)) {
      fail('结构一致', file, 0, `缺少 ${block.key}`)
    }
  }

  const headings = [...text.matchAll(/^## (.+)$/gm)].map((m) => ({
    text: m[1].trim(),
    line: lineOf(text, m.index)
  }))

  let cursor = 0
  for (const want of REQUIRED_SECTIONS) {
    const found = headings.findIndex((h, i) => i >= cursor && want.test(h.text))
    if (found === -1) {
      fail('结构一致', file, 0, `缺少小节「${want.key}」或在顺序上跑到了别人的后面`)
      break
    }
    cursor = found + 1
  }

  // 页头题号必须和文件名一致 —— 复制上一题最容易忘的就是这里
  const metaId = text.match(/<ProblemMeta[^>]*\bid="([^"]+)"/)
  const fileId = basename(file).match(/^(\d+)/)
  if (metaId && fileId && metaId[1] !== fileId[1]) {
    fail('结构一致', file, lineOf(text, metaId.index), `页头题号 ${metaId[1]} 与文件名 ${fileId[1]} 不一致`)
  }

  if (verbose) console.log(`  结构：${basename(file)} ok`)
}

// ── 2b. 三要素表：同专题各页必须是同一张表的同一批要素 ──────────────────────

/**
 * 三要素表用 `::: params <专题名>`，表体第一列是要素名。
 * 不管取值，只管**要素名和顺序**：同一专题下有两页把"循环条件"写成"终止条件"，
 * 横向对比就失效了 —— 那正是这张表存在的理由。
 */
const paramsByTopic = new Map() // topic -> Map(file -> keys[])

for (const file of pageFilesAll) {
  const text = readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
  const block = text.match(/^::: params[^\n]*\n([\s\S]*?)^:::/m)
  if (!block) continue

  const keys = []
  for (const line of lines(block[1])) {
    const m = line.match(/^\|\s*([^|]+?)\s*\|/)
    if (!m) continue
    const key = m[1].trim()
    if (!key || key === '要素' || /^-+$/.test(key)) continue
    keys.push(key)
  }

  const topic = relative(DOCS, file).replace(/\\/g, '/').split('/')[1]
  if (!paramsByTopic.has(topic)) paramsByTopic.set(topic, new Map())
  paramsByTopic.get(topic).set(file, keys)
}

for (const [topic, pages] of paramsByTopic) {
  // 同一专题里"有的页有、有的页没有"是最糟的状态：读者会以为那页忘了写
  const topicPages = pageFilesAll.filter(
    (f) => relative(DOCS, f).replace(/\\/g, '/').split('/')[1] === topic
  )
  for (const page of topicPages) {
    if (!pages.has(page)) {
      fail('三要素一致', page, 0, `${topic} 的其他页面都有 \`::: params\` 三要素表，这页没有`)
    }
  }

  const [firstFile, firstKeys] = pages.entries().next().value
  for (const [file, keys] of pages) {
    if (keys.join('|') !== firstKeys.join('|')) {
      fail(
        '三要素一致',
        file,
        0,
        `要素是 [${keys.join(', ')}]，与 ${basename(firstFile)} 的 [${firstKeys.join(', ')}] 不一致`
      )
    }
  }
}

if (verbose) console.log(`  三要素：${paramsByTopic.size} 个专题已启用`)

// ── 3. 命名一致 ────────────────────────────────────────────────────────────

/** conventions.md 里明令禁止的单字母名（i/j/k/n 是约定俗成的循环变量，放行） */
const BANNED_NAMES = ['l', 'r', 'm', 'c', 'q']
const BANNED_RE = new RegExp(`\\b(${BANNED_NAMES.join('|')})\\b`, 'g')

/** 去掉注释和字符串字面量，避免把英文注释里的 c 当成变量名 */
function stripCommentsAndStrings(code) {
  return code
    .split('\n')
    .map((line) => {
      // 行注释整行砍掉（含 URL 里的 // 也没关系，宁可漏报不误报）
      const commentAt = line.indexOf('//')
      let body = commentAt >= 0 ? line.slice(0, commentAt) : line
      body = body.replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/'(?:[^'\\]|\\.)*'/g, "''")
      return body
    })
}

let cppBlocksChecked = 0

for (const file of walk(join(DOCS, 'topics'))) {
  const text = read(file, '命名一致')
  if (!text) continue
  const norm = text.replace(/\r\n/g, '\n')

  for (const m of norm.matchAll(/```cpp\n([\s\S]*?)```/g)) {
    cppBlocksChecked++
    const startLine = lineOf(norm, m.index)
    const body = stripCommentsAndStrings(m[1])
    body.forEach((line, i) => {
      if (/^\s*#include/.test(line)) return
      for (const hit of line.matchAll(BANNED_RE)) {
        fail(
          '命名一致',
          file,
          startLine + 1 + i,
          `用了 ${BANNED_NAMES.includes(hit[1]) ? '`' + hit[1] + '`' : hit[1]}，约定见 guide/conventions.md「变量命名速查」`
        )
      }
    })
  }
}

if (verbose) console.log(`  命名：扫了 ${cppBlocksChecked} 个 cpp 代码块`)

// ── 4. 术语一致 ────────────────────────────────────────────────────────────

/**
 * glossary.md 里允许写这样一张机器可读的表：
 *
 * | 唯一写法 | 禁止写成 |
 * | --- | --- |
 * | 左闭右开 | 半开区间, 左开右闭 |
 *
 * 没有这张表就跳过（术语表还没建），有表就强制。
 */
function parseBannedTerms(text) {
  const out = []
  const section = text.split(/^## 禁止写法/m)[1]
  if (!section) return out
  for (const line of lines(section)) {
    const m = line.match(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/)
    if (!m) continue
    if (/^-+$/.test(m[1]) || m[1] === '写法' || m[1] === '唯一写法') continue
    const terms = m[2]
      .split(/[,，、]/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (terms.length) out.push({ canonical: m[1], banned: terms })
  }
  return out
}

if (existsSync(GLOSSARY)) {
  const glossaryText = read(GLOSSARY, '术语一致')
  const banned = glossaryText ? parseBannedTerms(glossaryText) : []
  if (banned.length > 0) {
    for (const file of walk(DOCS).filter((f) => !/(\.vitepress|node_modules)/.test(f))) {
      const text = read(file, '术语一致')
      if (!text || text.includes('## 禁止写法')) continue // 术语表自己不算
      for (const { canonical, banned: variants } of banned) {
        for (const v of variants) {
          let idx = text.indexOf(v)
          while (idx !== -1) {
            fail('术语一致', file, lineOf(text, idx), `应写作「${canonical}」，不要写「${v}」`)
            idx = text.indexOf(v, idx + v.length)
          }
        }
      }
    }
    if (verbose) console.log(`  术语：${banned.length} 组替代表达`)
  }
} else if (verbose) {
  console.log('  术语：还没有 guide/glossary.md，跳过')
}

// ── 汇总 ──────────────────────────────────────────────────────────────────

if (problems.length === 0) {
  console.log(`一致性检查通过：${pageFilesAll.length} 个题目页 / ${cppBlocksChecked} 段 cpp`)
  process.exit(0)
}

const groups = new Map()
for (const p of problems) {
  if (!groups.has(p.check)) groups.set(p.check, [])
  groups.get(p.check).push(p)
}

for (const [check, items] of groups) {
  console.log(`\n✗ ${check}（${items.length}）`)
  for (const p of items) {
    const where = p.line ? `${p.file}:${p.line}` : p.file
    console.log(`  ${where}  ${p.msg}`)
  }
}

console.log(`\n共 ${problems.length} 处问题`)
process.exit(1)
