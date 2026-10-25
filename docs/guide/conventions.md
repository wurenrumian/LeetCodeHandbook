# 写作与代码约定

加新题、改代码、重写讲解时按这套约定走，保证全站读起来是一个人的口吻、一种代码风格。

## 代码风格

统一 **C++17 + 现代 STL 惯用法**，面向面试白板场景。

### 必须

- 每段代码**完整可编译**：只显式包含真正用到的头文件，带 `using namespace std;`，带 `main` 和至少一个测试用例
- `main` 里用 `assert` 或直接打印结果，跑完 `return 0`
- 变量名用完整单词：`left` / `right` / `mid` / `count` / `window`，**不要** `l` `r` `m` `c`（`l`/`1` 在编辑器里分不清，是真实事故来源）
  - 例外：题目约定俗成的短名，如 `i` `j` 循环变量
- 数值类型明示：下标用 `int`，涉及 `n * m` 或前缀和的用 `long long`
- 容量够就用 `array` 或 `vector`，别用裸指针 `new`

### 禁止

- **`#include <bits/stdc++.h>`** —— 见下面单独一节，这条没有例外
- 不要用 `#define int long long` 这类宏污染
- 不要写 `while(true)` 再靠 `break` 兜底，除非是 BFS 出队式写法
- 不要为了"短"牺牲可读性：`for (int i = 0; i < n; ++i)` 比 `for(auto&x:a)` 在需要下标时更清楚

::: danger 易错
**永远不要用 `#include <bits/stdc++.h>`**

这是 GCC 私有的聚合头，不是 C++ 标准的一部分。三个实际危害：

1. **不可移植**：clang + libc++、MSVC、Apple Clang 都没有这个头。换台机器就编不过。
2. **编译变慢**：一次拉进全部 STL，构建时间随标准库增长而无谓增加。
3. **隐藏依赖**：读代码的人看不出这段用了 `deque` 还是 `set`，也没法判断哪些头是多余的。

每段代码只写它真正用到的头文件。常见的对应关系：

| 用到的 | 需要的头 |
|---|---|
| `vector` | `<vector>` |
| `string` | `<string>` |
| `unordered_map` / `unordered_set` | `<unordered_map>` / `<unordered_set>` |
| `map` / `set` | `<map>` / `<set>` |
| `queue` / `priority_queue` | `<queue>` |
| `stack` | `<stack>` |
| `deque` | `<deque>` |
| `pair` | `<utility>` |
| `array` | `<array>` |
| `sort` / `max` / `reverse` / `lower_bound` | `<algorithm>` |
| `accumulate` | `<numeric>` |
| `INT_MAX` / `INT_MIN` | `<climits>` |
| `assert` | `<cassert>` |
| `cout` / `endl` | `<iostream>` |

漏了 `#include <cassert>` 是常见错误 —— 本地某些编译器的 `assert` 恰好被别的头间接带进来了，换环境才炸。
:::

### 代码块写法

````md
```cpp
// 有重点行时用行号高亮，行号从 1 开始数
int left = 0;
int right = nums.size() - 1;
```
````

行内引用变量用反引号 —— `left`、`dp[i]`、`cnt[128]`，**不要**用加粗代替。

## 讲解结构

每道题页面按下表顺序，缺一项就说明还没写完：

| 顺序 | 小节 | 内容要求 |
|---|---|---|
| 1 | 页头 | `<ProblemMeta>` 组件，题号/难度/标签齐全 |
| 2 | 速查卡 | `::: cheat` 容器，4 行以内 |
| 3 | 题意重述 | 给输入输出示例，不复述题干原文 |
| 4 | 从朴素到最优 | 只说关键转折，不写完整暴力代码 |
| 5 | 模板对照 | `::: compare`，左边模板右边本题 |
| 6 | 完整代码 | 可编译，带 `main` |
| 7 | 逐段拆解 | `::: semantics` 表，讲字段语义 |
| 8 | 坑点 | `::: warning`，每条对应代码位置 |
| 9 | 变体与练习 | 改条件后模板怎么动 |

## 自定义容器

全站有 5 种容器，用途不能混：

::: tip 提示
`::: tip` —— 补充说明、容易被忽略但不算错的地方。
:::

::: info 补充
`::: info` —— 背景知识、术语解释、和其他专题的联系。
:::

::: warning 坑点
`::: warning` —— **会写错**的地方：死循环、越界、重复解、状态误解。每条必须能指到代码里的具体一行。
:::

::: danger 易错
`::: danger` —— 会**静默出错**的地方：结果错了但不报错、不崩溃，最难查。
:::

::: details 展开细节
`::: details` 或原生 `<details>` —— 证明过程、数学推导、可跳过的深入内容。
:::

## 两个自定义块

### 速查卡

```md
::: cheat 速查卡
- **什么时候用**：...
- **核心不变式**：...
- **复杂度**：O(log n) / O(1)
:::
```

### 模板对照

`::: compare` 的容器标签同一行用 `|` 分隔两个栏目标题，**标题必填**：

````md
::: compare 通用模板 [left, right) | 704 本题
```cpp
// 左栏：通用模板
```
```cpp
// 右栏：本题改动
```
:::
````

两条硬规则，都是排版事故换来的：

1. **两段代码的顺序即左右栏顺序**，必须先左后右。容器先输出两个标题，再输出代码块，在 2 列网格里落成「标题行 + 代码行」。
2. **每行不超过约 50 个显示宽度**（中文算 2）。列宽只有 ~336px，超了就折行 —— 折行不报错但很难看。所以对照区里放**骨架**，带完整注释的版本放到下面的「完整可编译代码」。注释优先写在代码行**上方独立一行**，少写行尾注释。

::: warning 坑点
VitePress 给代码块加了 `margin: 16px -24px`（负外边距，让它撑满正文宽度）。放进两列网格后每块向外溢出 24px，**两栏会在中间叠在一起**。`custom.css` 里已把 `.compare > div[class*='language-']` 的 `margin` 归零 —— 别删这条。
:::

### 字段语义表

```md
::: semantics
| 字段 | 含义 | 在代码里怎么用 |
| --- | --- | --- |
| `left` | 候选区间左端（含） | 每次 `mid` 不满足时右移 |
:::
```

## 变量命名速查

同一个概念全站用同一个名字，别一处 `lo` 一处 `left`：

| 概念 | 统一名字 |
|---|---|
| 二分左右边界 | `left` / `right` |
| 中点 | `mid` |
| 滑动窗口 | `left` / `right`（`right` 是"即将加入"的位置） |
| 快慢指针 | `slow` / `fast` |
| DP 表 | `dp`，下标用题目语义命名（`dp[amount]` 而非 `dp[i]` 的裸 `i`） |
| 队列 | `queue`（不用 `q`） |
| 邻接表 | `graph` |
| 访问标记 | `visited` |
| 距离/步数 | `dist` / `steps` |

## 加一道新题的清单

1. `docs/.vitepress/theme/data/problems.ts` 里加一条 `PROBLEMS` 记录（题号作 key，`link` 指向新页面）
2. `docs/.vitepress/config.mts` 的对应专题 `sidebar` 里加一项
3. 新建 `docs/topics/<专题>/<题号>-<slug>.md`
4. 按上面的 9 段结构写完
5. `npm run build` 确认没报死链
