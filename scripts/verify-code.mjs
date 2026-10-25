#!/usr/bin/env node
/**
 * 抽取 docs 下所有带 main 的 cpp 代码块，逐个编译并运行。
 *
 * 存在的意义：这个站点的承诺是"代码都能跑"。承诺必须可机械验证，
 * 否则改一篇文档就可能悄悄放进一段编译不过的示例。
 *
 * 用法:
 *   node scripts/verify-code.mjs                  # 验证 docs/topics
 *   node scripts/verify-code.mjs <dir>            # 验证指定目录
 *   node scripts/verify-code.mjs <dir> --keep     # 保留中间文件
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, rmSync } from 'node:fs'
import { join, relative, basename } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'

const args = process.argv.slice(2)
const keep = args.includes('--keep')
const root = args.find((a) => !a.startsWith('--')) ?? 'docs/topics'

/** 优先 clang++，回退 g++。都不在就直接失败，不要静默跳过。 */
function pickCompiler() {
  for (const c of ['clang++', 'g++']) {
    const r = spawnSync(c, ['--version'], { encoding: 'utf8' })
    if (r.status === 0) return c
  }
  console.error('找不到 clang++ 或 g++，请先安装编译器并加入 PATH')
  process.exit(2)
}

const compiler = pickCompiler()
const work = 'tmp/verify-code'
rmSync(work, { recursive: true, force: true })
mkdirSync(work, { recursive: true })

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (name.endsWith('.md')) out.push(p)
  }
  return out
}

/** cpp 代码块里如果有 #include <bits/stdc++.h>，直接判失败 */
function findForbiddenIncludes(code) {
  return /#include\s*<bits\/stdc\+\+\.h>/.test(code)
}

const results = []

for (const file of walk(root)) {
  const text = readFileSync(file, 'utf8')
  let idx = 0
  for (const m of text.matchAll(/```cpp\n([\s\S]*?)```/g)) {
    idx++
    const code = m[1]
    if (!/\bint\s+main\s*\(/.test(code)) continue

    const tag = `${relative(root, file).replace(/[\\/]/g, '__').replace(/\.md$/, '')}__${idx}`

    if (findForbiddenIncludes(code)) {
      results.push({ tag, file, ok: false, reason: '使用了 bits/stdc++.h（禁止）' })
      continue
    }

    const src = join(work, `${tag}.cpp`)
    const exe = join(work, tag)
    writeFileSync(src, code)

    const compile = spawnSync(compiler, ['-std=c++17', '-Wall', '-Wextra', '-o', exe, src], {
      encoding: 'utf8'
    })
    if (compile.status !== 0) {
      results.push({
        tag,
        file,
        ok: false,
        reason: '编译失败',
        detail: (compile.stderr || '').split('\n').slice(0, 8).join('\n')
      })
      continue
    }

    const run = spawnSync(exe, [], { encoding: 'utf8', timeout: 10000 })
    if (run.status !== 0) {
      results.push({
        tag,
        file,
        ok: false,
        reason: `运行失败 (exit ${run.status})`,
        detail: (run.stderr || run.stdout || '').split('\n').slice(0, 8).join('\n')
      })
      continue
    }

    const warnings = (compile.stderr || '').trim()
    results.push({
      tag,
      file,
      ok: true,
      out: (run.stdout || '').trim(),
      warnings: warnings || null
    })
  }
}

for (const r of results) {
  if (r.ok) {
    console.log(`OK   ${r.tag}  -> ${r.out}`)
    if (r.warnings) console.log(`     ⚠ 警告:\n${r.warnings}`)
  } else {
    console.log(`FAIL ${r.tag}  ${r.reason}`)
    console.log(`     ${r.file}`)
    if (r.detail) console.log(r.detail.replace(/^/gm, '     '))
  }
}

if (!keep) rmSync(work, { recursive: true, force: true })

const failed = results.filter((r) => !r.ok)
console.log(`\n编译器: ${compiler}`)
console.log(`共 ${results.length} 段，通过 ${results.length - failed.length}，失败 ${failed.length}`)

if (failed.length > 0) process.exit(1)
if (results.length === 0) {
  console.log('没有找到带 main 的 cpp 代码块 —— 检查一下是不是路径写错了')
  process.exit(1)
}
