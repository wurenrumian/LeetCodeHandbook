# LeetCode 算法手册

用 VitePress 构建的 LeetCode 教学站点。不讲"这题答案是什么"，而是讲**这些算法落到代码上长什么样**：模板是什么、变体改了哪几行、每个字段是什么语义、边界改一处会怎样崩。

## 快速开始

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 产出 docs/.vitepress/dist/
npm run preview  # 本地预览构建结果
```

构建产物是纯静态文件，直接丢到内网 nginx 即可：

```nginx
location / {
    root /path/to/docs/.vitepress/dist;
    try_files $uri $uri/ $uri.html /index.html;
}
```

若部署在子目录（如 `http://host/handbook/`），把 `docs/.vitepress/config.mts` 里的 `base: '/'` 改成 `base: '/handbook/'` 后重新构建。

## 内容结构

```
docs/
├── index.md                      首页
├── guide/
│   ├── index.md                  使用方式
│   ├── conventions.md            写作与代码约定（加题前必读）
│   ├── glossary.md               术语表：全站唯一写法
│   └── verification.md           验证与可信度：三道门禁查什么
├── problems/index.md             题目索引（可筛选）
└── topics/
    ├── index.md                  专题总览
    ├── binary-search/            二分查找
    │   ├── index.md              专题：模板与 4 种变体
    │   ├── 704-binary-search.md
    │   └── 34-first-last-position.md
    ├── sliding-window/           滑动窗口
    ├── two-pointers/             双指针
    ├── dp/                       动态规划
    └── graph-bfs/                树的遍历 · BFS

review/                           独立查验报告（不是站点内容，见 review/index.md）
```

## 每道题页的固定结构

| 顺序 | 段落 | 作用 |
|---|---|---|
| 1 | `<ProblemMeta>` | 题号 / 难度 / 标签 / 原题链接 |
| 1b | `::: params` 三要素表 | 本题在"区间约定 / 循环条件 / 边界更新"这类决策点上取什么值，同专题各题填同一张表 |
| 2 | `::: cheat` 速查卡 | 30 秒回顾：信号、不变式、模板、复杂度 |
| 3 | 题意重述 | 输入输出示例，不复述题干 |
| 4 | 从朴素到最优 | 只讲关键转折 |
| 5 | `::: compare` 模板对照 | 左边通用模板，右边本题改动 |
| 6 | 完整可编译代码 | 带 `main` 和断言用例 |
| 7 | `::: semantics` 字段语义表 | 逐字段讲"是什么、在代码里怎么用" |
| 8 | `::: warning` 坑点 | 每条对应代码里一个具体位置 |
| 9 | 变体与练习 | 改条件后模板怎么动 |

## 站点功能

- **本地搜索**：VitePress 内置全文搜索，零配置
- **代码块**：行号、复制按钮、行高亮（` ```cpp{3-5} `）、`[filename]` 标题
- **题目索引**：按难度 / 专题 / 标签 / 关键词筛选
- **明暗主题**：右上角切换
- **无状态**：不登录、不存进度、不做测评，站点内容对所有人一致

## 内容真实性

所有题目页里的 C++ 代码都**实际编译并运行过**（`clang++ -std=c++17 -Wall -Wextra`，零警告，所有 `assert` 通过）。不写"看起来能跑"的伪代码，也不用 `bits/stdc++.h` 这种不可移植的聚合头。

## 验证代码

改完任何页面的代码，跑一次：

```bash
npm run verify          # 等价于 node scripts/verify-code.mjs
npm run check           # 注册 / 结构 / 命名 / 术语 / 三要素 一致性
```

`verify` 会把 `docs/topics/**/*.md` 里所有带 `main` 的 cpp 代码块抽出来，逐个编译运行，**任何一段编译失败或 assert 不通过都会让脚本以非零码退出**。也可以只验一个目录：

```bash
node scripts/verify-code.mjs docs/topics/stack --keep
```

`--keep` 保留中间产物方便排查。需要 `clang++` 或 `g++` 在 PATH 里（脚本会优先用 clang++）。

`check` 会拦住"加了一题但忘了改侧边栏 / 题数 / 页头题号""用了 `l` `r` `c` 这类单字母名""术语写法漂了"这几类不会报错、只会慢慢变形的问题。两条命令都是本地手动跑，没有 CI；细节见 [验证与可信度](docs/guide/verification.md)。

## 加新题

见 [写作与代码约定](docs/guide/conventions.md#加一道新题的清单)。核心是四处：

1. `docs/.vitepress/theme/data/problems.ts` 加一条记录
2. `docs/.vitepress/config.mts` 对应专题的 `sidebar` 加一项
3. `docs/topics/index.md` 总览表里把该专题题数 +1
4. 新建 `docs/topics/<专题>/<题号>-<slug>.md`，按 9 段结构写

第 3 条最容易忘，也最不容易被发现——它是全站唯一一个"数字"形式的冗余，漏改不报错，只会让总览表慢慢说谎。`npm run check` 会盯着它。

## 技术栈

- [VitePress](https://vitepress.dev/) 1.6
- Vue 3 + TypeScript（组件）
- 自定义 markdown-it 容器：`cheat` / `compare` / `semantics` / `params`
