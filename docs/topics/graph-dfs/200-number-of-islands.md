---
title: 200 · 岛屿数量
---

# 200 · 岛屿数量

<ProblemMeta id="200" difficulty="中等" title="岛屿数量" :tags="['网格 DFS', '原地标记', '连通块']" url="https://leetcode.cn/problems/number-of-islands/" />

::: cheat 速查卡
- **什么时候用**：网格里数**互不相连的成片区域**有几块
- **核心不变式**：外层扫到的每个 `'1'` 都是一片**尚未被淹掉**的新岛的第一格
- **一句话模板**：见到 `'1'` → `++count` → DFS 把整片改成 `'0'`
- **复杂度**：时间 **O(rows × cols)**、空间 **O(rows × cols)**（最坏递归深度）
:::

## 题意重述

`'1'` 是陆地，`'0'` 是水。**上下左右**四个方向相连的陆地属于同一座岛（斜对角不算）。求岛屿总数。

```
输入: grid = [["1","1","1","1","0"],
              ["1","1","0","1","0"],
              ["1","1","0","0","0"],
              ["0","0","0","0","0"]]
输出: 1

输入: grid = [["1","1","0","0","0"],
              ["1","1","0","0","0"],
              ["0","0","1","0","0"],
              ["0","0","0","1","1"]]
输出: 3        ← 左上 2×2 一块，中间一块，右下两块连成一块

输入: grid = [["0"]]
输出: 0
```

第二个例子里右下角 `(3,3)` 和 `(3,4)` 才是同一座岛 —— **连通是传递的**，`A` 连 `B`、`B` 连 `C`，则 `A`、`B`、`C` 同属一片。这正是需要 DFS 而不是"数数有几个 `'1'`"的原因。

## 从朴素到最优

朴素做法：对每个格子判断"它左边和上边是不是陆地"，是就不计数。

```cpp
if (grid[row][col] == '1' &&
    (col == 0 || grid[row][col-1] != '1') &&
    (row == 0 || grid[row-1][col] != '1'))
    ++count;
```

**这个做法是错的**，而且错得很隐蔽。它只能识别"左上角起始"的岛，遇到拐弯就崩。看这个形状：

```
1 1 1
0 0 1
1 1 1
```

`(2,0)` 处的 `1` 左边是 `0`、上边是 `0`，于是被算成新岛；但 `(2,0)` 通过 `(2,1)`、`(2,2)`、`(1,2)` 和上面那片连通，其实是同一座岛。真正的连通关系要**沿四个方向一路传下去**，局部看两个邻居永远不够。

关键转折在于换个问法：

> 不问"这个格子是不是岛的一角"，而问"**这个格子属于哪座岛**"。

于是做法变成：扫到一个没被归属过的 `'1'`，就给这片开一个新编号，然后 DFS 把它四个方向能摸到的 `'1'` 全部打上同一编号。打编号的动作可以省掉 —— 直接**把 `'1'` 改成 `'0'`（淹掉）**，因为水本来就"不属于任何岛"，这个值天然表示"已处理"。

一招解决两件事：**计数**（外层遇到几个没被淹的 `'1'` 就是几座岛）和**去重**（淹掉之后不会重复数）。

## 模板对照

左栏是网格 DFS 的通用骨架，右栏是本题填进去的内容。差别只有标记那一行 —— 它直接改了原数组。

::: compare 网格 DFS 骨架 | 200 本题：原地淹掉
```cpp
// 网格 DFS：出口 + 标记 + 四方向
void dfs(Grid& grid,
         int row, int col) {
    // 出口：越界先判
    if (row < 0 || row >= rows) return;
    if (col < 0 || col >= cols) return;
    // 出口：不是目标格
    if (!isTarget(grid[row][col]))
        return;
    // 标记：进入即打
    mark(grid, row, col);
    // 展开四个邻居
    for (const auto& dir : dirs)
        dfs(grid, row + dir[0],
                   col + dir[1]);
}
```
```cpp
// 本题：目标格是 '1'，标记就是改成 '0'
void dfs(Grid& grid,
         int row, int col) {
    if (row < 0 || row >= rows) return;
    if (col < 0 || col >= cols) return;
    if (grid[row][col] != '1')
        return;
    // 淹掉：既表示来过，
    // 也表示这块地已归属
    grid[row][col] = '0';
    for (const auto& dir : dirs)
        dfs(grid, row + dir[0],
                   col + dir[1]);
}
```
:::

外层调用只有五行，但**顺序不能错**：

```cpp
for (int row = 0; row < rows; ++row)
    for (int col = 0; col < cols; ++col) {
        if (grid[row][col] != '1') continue;
        ++count;              // 先计数
        dfs(grid, row, col);  // 再淹掉整片
    }
```

`++count` 在 `dfs` **之前**：能走到这里的格子，一定还没被任何一片淹掉，它必然是一片新区域的入口。反过来把 `++count` 放 `dfs` 后面也**凑巧**对（`dfs` 不会改 `count`），但这个顺序读起来更贴合语义 —— 先认定"这里有个岛"，再去清理它。

## 完整可编译代码

```cpp
#include <cassert>
#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {
        if (grid.empty() || grid[0].empty()) return 0;

        // 行列数存成成员：dfs 每层都要用，不必反复 grid.size()
        rows = static_cast<int>(grid.size());
        cols = static_cast<int>(grid[0].size());

        int count = 0;
        for (int row = 0; row < rows; ++row) {
            for (int col = 0; col < cols; ++col) {
                // 只有还没被淹掉的陆地，才是一片新岛屿的入口
                if (grid[row][col] != '1') continue;
                ++count;
                dfs(grid, row, col);
            }
        }
        return count;
    }

private:
    int rows = 0;
    int cols = 0;

    // 上、下、左、右。加一个对角线方向只需要多一行
    static constexpr int dirs[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    void dfs(vector<vector<char>>& grid, int row, int col) {
        // 第一步：越界检查，必须在取 grid[row][col] 之前
        if (row < 0 || row >= rows || col < 0 || col >= cols) return;
        // 第二步：不是未访问的陆地就停（'0' 是水，也是已访问的标记）
        if (grid[row][col] != '1') return;
        // 第三步：先标记，再递归。顺序反了就会重复进入
        grid[row][col] = '0';
        // 第四步：展开四个邻居
        for (const auto& dir : dirs) {
            dfs(grid, row + dir[0], col + dir[1]);
        }
    }
};

int main() {
    Solution sol;

    {
        // 力扣官方用例：一片大岛
        vector<vector<char>> grid{
            {'1', '1', '1', '1', '0'},
            {'1', '1', '0', '1', '0'},
            {'1', '1', '0', '0', '0'},
            {'0', '0', '0', '0', '0'}};
        assert(sol.numIslands(grid) == 1);
    }
    {
        // 力扣官方用例：三座岛
        vector<vector<char>> grid{
            {'1', '1', '0', '0', '0'},
            {'1', '1', '0', '0', '0'},
            {'0', '0', '1', '0', '0'},
            {'0', '0', '0', '1', '1'}};
        assert(sol.numIslands(grid) == 3);
    }
    {
        // 空网格
        vector<vector<char>> grid;
        assert(sol.numIslands(grid) == 0);
    }
    {
        // 有行但没有列
        vector<vector<char>> grid{{}};
        assert(sol.numIslands(grid) == 0);
    }
    {
        // 单格网格的两种取值
        vector<vector<char>> water{{'0'}};
        assert(sol.numIslands(water) == 0);
        vector<vector<char>> land{{'1'}};
        assert(sol.numIslands(land) == 1);
    }
    {
        // 整片陆地：只有一座岛
        vector<vector<char>> grid{
            {'1', '1', '1'},
            {'1', '1', '1'},
            {'1', '1', '1'}};
        assert(sol.numIslands(grid) == 1);
    }
    {
        // 棋盘格：四联通下五个格子两两不相邻
        vector<vector<char>> grid{
            {'1', '0', '1'},
            {'0', '1', '0'},
            {'1', '0', '1'}};
        assert(sol.numIslands(grid) == 5);
    }
    {
        // 斜对角不算连通
        vector<vector<char>> grid{{'1', '0'}, {'0', '1'}};
        assert(sol.numIslands(grid) == 2);
    }
    {
        // 一整行陆地：横向连通算一座岛
        vector<vector<char>> grid{{'1', '1', '1', '1'}};
        assert(sol.numIslands(grid) == 1);
    }

    cout << "all tests passed" << endl;
    return 0;
}
```

`main` 里的九个用例各盯一个方向：**空输入、单格、全连通、全不连通、斜对角、单行**。棋盘格那个（`5`）尤其值得手推一遍 —— 它验证的是"只有四方向连通"，如果误加了斜线，答案会变成 1。

## 逐段拆解

::: semantics
| 字段 | 含义 | 在代码里怎么用 |
| --- | --- | --- |
| `rows` / `cols` | 网格边界，存成员变量 | `dfs` 每层都要判越界，避免反复 `grid.size()`，也避免 `size_t` 与 `int` 混比 |
| `grid[row][col]` | `'1'` 未访问陆地，`'0'` 水或已访问 | 它同时承担**数据**和**访问标记**两个角色 |
| `count` | 已发现的岛数 | 只在**外层** `++`，`dfs` 内部绝不碰它 |
| `dirs` | 四个方向 `{Δrow, Δcol}` | `static constexpr`，全类共享一份，编译期确定 |
| `row + dir[0]` | 邻居的行下标 | 可能是 `-1` 或 `rows`，所以越界检查必须存在 |
| `grid[r][c] = '0'` | 标记 | 必须在 `for` 之前；它让后续的重复到达立刻返回 |
| 外层双重 `for` | 枚举所有可能的岛入口 | 图（网格）不连通，一座岛都不在别的岛上 |

:::

### 为什么"淹掉"比 `visited` 数组好

两种写法的正确性完全一样。差别在三处：

| | 原地改 `'0'` | 额外 `visited` 数组 |
|---|---|---|
| 空间 | O(1) 额外（递归栈除外） | O(rows × cols) |
| 参数 | 多一层判据复用：`!= '1'` 一句话判完"是水 or 来过" | 要判两个条件：`grid != '1' \|\| visited` |
| 是否要恢复 | **不需要**，归属是终局结论 | 同样不需要（这点两者一致） |
| 副作用 | 破坏输入 | 输入保持原样 |

省空间只是表面理由。真正的好处是**判据归一**：出口里原本要写两个 `if`，现在一个 `if (grid[row][col] != '1') return;` 就覆盖了"越界后的水"和"来过的陆地"。这类"用数据本身表达状态"的写法，出错机会比维护平行数组少。

::: warning 坑点
**这种写法只在"标记值和合法数据可以重合"时成立。** 200 题里 `'0'` 表示水，水不属于任何岛，所以"改成 `'0'`"等于"宣布它不属于任何岛"，语义严密。

换成 695 岛屿的最大面积（值是 `0/1` 的 `int`），把 `1` 改成 `0` 同样成立。但如果题目要求"陆地值不可变"或"要区分原生的水和淹过的水"，就必须另开 `visited`。**先确认标记值不会和有效数据冲突，再考虑原地改。**
:::

### 标记必须在递归之前

把这两行调换：

```cpp
dfs(grid, row + 1, col);      // ✗ 先递归
grid[row][col] = '0';         // 后标记
```

`dfs(A)` 还没标记就去访问邻居 `B`，`B` 又回头访问 `A`（`A` 仍是 `'1'`）→ `A` 再访问 `B` → 无限交替。栈帧无限增长，最后**段错误**。

递归版死循环报的是 `Stack overflow` / `Segmentation fault`，不是转圈，容易误以为是越界问题。**看到段错误，先检查标记那一行的位置。**

### 递归深度：这题的真实风险

DFS 的空间是递归栈，最坏深度等于**一片岛的最大格数** —— 一条蛇形走廊能让路径绕过整个网格。

我在 WSL 里用 `g++ 13.3 -O0`、8 MB 默认栈实测（同一段 `dfs`，蛇形全连通网格）：

| 网格 | 实测最大递归深度 | 结果 |
|---|---|---|
| 300 × 300 全陆地 | 90000 | 通过 |
| 300 × 300 蛇形走廊 | 88804 | 通过 |
| 1000 × 1000 蛇形走廊 | ≈1000000 | `Segmentation fault` |

再单独压栈深得到临界值：**约 13 万层**（12 万通过，14 万段错误，二分定位到 ~130625）。这个数字**只对这段 `dfs` 的栈帧成立**：206 题的递归反转链表达 15–18 万层，是因为它的帧更小；换函数就要重测，别跨页对比。

所以力扣的 `1 <= m, n <= 300` 下最坏 9 万层，**能过，余量约 1.4 倍** —— 不是"理论上可能爆"，是实测离边界不远。注意这是 8 MB 栈的 Linux 环境；Windows 默认栈通常更小，某些 OJ 也一样。

需要更稳时换 BFS，改动很小 —— 递归栈换成显式队列：

```cpp
void flood(vector<vector<char>>& grid, int row, int col) {
    queue<pair<int, int>> queue;
    queue.push({row, col});
    grid[row][col] = '0';              // 入队时就标记！
    while (!queue.empty()) {
        auto [currentRow, currentCol] = queue.front();
        queue.pop();
        for (const auto& dir : dirs) {
            int nextRow = currentRow + dir[0];
            int nextCol = currentCol + dir[1];
            if (nextRow < 0 || nextRow >= rows) continue;
            if (nextCol < 0 || nextCol >= cols) continue;
            if (grid[nextRow][nextCol] != '1') continue;
            grid[nextRow][nextCol] = '0';   // 入队即标记
            queue.push({nextRow, nextCol});
        }
    }
}
```

BFS 版的关键是**入队时就标记**。放到出队时标记，同一格会被多个邻居重复入队，队列可能膨胀到 O(n²) 级别 —— 这个坑在 [BFS 专题](/topics/graph-bfs/)里详细讲过。

## 坑点

::: warning 坑点
1. **`if (grid[row][col] != '1')` 写在越界检查之前**：`row == -1` 时 `grid[-1]` 是未定义行为。四个越界判据必须是函数体最前面的一批语句。

2. **标记写在 `for` 之后**：见上节，爆栈。位置必须是"判完入口 → 立刻标记 → 再展开"。

3. **`dfs` 的参数漏了 `&`**：`void dfs(vector<vector<char>> grid, ...)` 每层递归深拷贝整个网格，标记全丢 → 内存爆 + 无限递归。写成 `vector<vector<char>>&`。

4. **`rows` / `cols` 取成局部变量**：`dfs` 里用不到外层 `for` 里的 `row`/`col` 名，更常见的是忘了传边界。要么做成成员（本题写法），要么两个边界都当参数传下去。

5. **斜对角被当成连通**：写成 8 个方向。棋盘格测试（答案 5）会立刻变成 1。

6. **空网格不特判**：`grid[0].size()` 在 `grid.empty()` 时越界。本题用 `if (grid.empty() || grid[0].empty()) return 0;` 一次挡住空网格和空行两种输入。
:::

::: danger 易错
`grid[0].size()` 的类型是 `size_t`（无符号）。这两个坑的实际触发条件不一样，别记混：

| 写法 | 触发条件 |
|---|---|
| `int cols = grid[0].size();` | 只在 `-Wconversion` 下报收窄警告，`-Wall -Wextra` **不报** |
| `int rows = ...; if (rows < grid[0].size())` | `-Wall -Wextra` 下就报 `-Wsign-compare` |

第一行是"静默"的：不报警告，但 `size()` 超过 `INT_MAX` 时会翻转成负数。第二行更危险 —— 有符号和无符号比较时 `int` 会先转成 `unsigned`，`rows == -1` 就变成巨大的正数，判断结果完全反了。

本题统一 `static_cast<int>(...)` 存进成员变量，之后所有比较都是 `int` 对 `int`，两个坑一起规避。
:::

## 变体与练习

| 变化 | 改什么 |
|---|---|
| 求最大岛屿面积（[695](https://leetcode.cn/problems/max-area-of-island/)） | `dfs` 改成返回 `int`，`1 + 四个方向之和`，外层取 `max` |
| 八联通（含对角线） | `dirs` 从 4 行扩到 8 行，其余不动 |
| 只能向右、向下走 | `dirs` 只留 `{1,0}`、`{0,1}` 两行，连通关系变成有向的 |
| 统计封闭岛屿（[1254](https://leetcode.cn/problems/number-of-closed-islands/)） | 先从四条边界 `dfs` 淹一遍，再数剩下的 |
| 网格太大怕爆栈 | `dfs` 换 BFS，递归栈换队列，其余判断一致 |
| 输入不能改 | 加 `vector<vector<bool>> visited`，出口多判一个条件 |
| 岛屿形状去重（[694](https://leetcode.cn/problems/number-of-distinct-islands/)） | `dfs` 里记录"相对起点的方向序列"，用集合去重 |

::: info 补充
这题的 `dfs` 本质是**flood fill**：从一个种子点出发，把所有连通的同色区域染成另一种颜色。它是"数连通块"这个模式的母版，图形学里的油漆桶、扫雷的空白区展开、图像分割的种子生长，都是同一段代码。

和 [BFS 专题](/topics/graph-bfs/)的 994 腐烂的橘子对比着看更有价值：**两者都能求连通块，但只有 BFS 能求"最短几步"**。DFS 会一路走到底，它不知道当前格离种子有多远；BFS 按层推进，第一次到达就是最短。反过来，只需求"有没有连通"时 DFS 更省事 —— 不用队列，不用记层。
:::

下一题：[207 课程表](/topics/graph-dfs/207-course-schedule) —— 网格换成邻接表，无向换成有向，标记从两色变成三色。
