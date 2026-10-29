---
title: 207 · 课程表
---

# 207 · 课程表

<ProblemMeta id="207" difficulty="中等" title="课程表" :tags="['有向图判环', '三色标记', '邻接表']" url="https://leetcode.cn/problems/course-schedule/" />

::: cheat 速查卡
- **什么时候用**：一堆"要先做 A 才能做 B"的依赖，问能不能全部完成
- **核心不变式**：`color == 1` 的点恰好是**当前递归路径上的祖先**，回到它就是环
- **一句话模板**：进函数染 `1`，撞到 `1` 立刻 `false`，退出前染 `2`
- **复杂度**：时间 **O(V + E)**、空间 **O(V + E)**
:::

## 题意重述

`numCourses` 门课，`prerequisites[i] = [a, b]` 表示"学 `a` 之前必须先学 `b`"，即存在有向边 `b → a`。问能不能学完全部课程。

```
输入: numCourses = 2, prerequisites = [[1,0]]
输出: true        ← 先学 0，再学 1

输入: numCourses = 2, prerequisites = [[1,0],[0,1]]
输出: false       ← 0 要求 1，1 要求 0，互相等待

输入: numCourses = 1, prerequisites = []
输出: true        ← 一门课，没有依赖
```

第一个和第二个只差一条边 `[0,1]`，答案却相反。这条边把两个点**连成了环**：

```
[1,0]          [1,0] + [0,1]
0 → 1          0 → 1
               1 → 0   ← 绕回来了
```

所以问题的数学形式是：**这张有向图里有没有环？** 有环则无解（环上的课谁都不能先学），无环则有解（按拓扑序学即可）。

::: tip 提示
边数组是 `[a, b]` 的顺序 —— **后学者在前**。建图时容易顺手写成 `graph[course].push_back(prerequisite)`。

**这里有个反直觉的事实**：如果**所有**边都统一反向，环的集合不变（把环 `c1 → c2 → … → c1` 每条边翻过来，仍是同一个环的反向遍历），所以本题答案**照样正确**。我拿 4000 组随机图验证过，全部反向的版本与原版结论零差异。

方向必须写对，是为了两件事：一是**只反了一部分边**时答案会错（这才是真会踩的坑，拿三元环把其中一条边翻过来，答案就从 `false` 变成 `true`）；二是 210 题要输出拓扑序，方向错了整个序列就反了。
:::

## 从朴素到最优

最直接的想法：反复扫，把"入度为 0"的课（没依赖）删掉，看最后能不能删空。这就是 **Kahn 算法**（拓扑排序），能解，但需要一个入度数组 + 队列。

DFS 的想法更直接：

> 从某门课出发，一路往下追先修。**如果能追回自己，就是环。**

朴素 DFS 用一个 `bool visited` 记录"去过没有"。这在无向图（网格）里足够，因为无向边的两个方向等价，"来过"就等于"这条边走过"。**有向图不行。**

```
图 1：菱形，无环
0 → 1 → 3
0 → 2 → 3        ← 3 被两条路径到达，正常汇合

图 2：三元环
0 → 1 → 2 → 0    ← 走回起点，环闭合
```

两种情况都是"走到一个已经访问过的点时停"。图 1 里 `3` 被两条路径到达，是正常的汇合；图 2 里绕一圈回到 `0`，是环。**`visited` 在两种情形下的值完全一样**，光靠它无法区分。

关键的观察在这一句：

> 环的定义不是"回到了一个去过的点"，而是"**回到了一个还没走完的点**"。

图 1 里第二次到达 `3` 时，从 `3` 出发的子树已经走完并返回了，它是"已完成的"。图 2 里回到 `0` 时，`0` 的 DFS 还没返回，它还挂在递归栈上，是"访问中的"。

于是把状态从 2 种扩到 3 种：

| 颜色 | 含义 | 撞上它说明 |
|---|---|---|
| `0` | 没进过 | 正常递归 |
| `1` | 在递归栈上（**访问中**） | 它是我当前的祖先 → 环闭合 → `false` |
| `2` | 子树走完（**已完成**） | 它跟我这条路无关了 → 跳过 |

一个 `vector<int> color` 代替 `vector<bool> visited`，就这一处改动。**判环能力不是多加了逻辑换来的，是把 `bool` 里丢掉的信息（未完成/已完成）补回来换来的。**

## 模板对照

左栏是无向图（网格）的标记方式，右栏是本题的三色版本。两栏的骨架相同，差别全在标记的**取值**和**写入时机**。

::: compare 两色标记：只够判连通 | 三色标记：够判环
```cpp
// 无向图 / 网格：bool 就够
void dfs(Grid& grid, int row, int col) {
    if (越界) return;
    if (visited[row][col]) return;
    visited[row][col] = true;
    for (邻居 : 四方向)
        dfs(grid, ...);
    // 函数返回，标记保持
}
```
```cpp
// 有向图：必须三种状态
bool dfs(vector<int>& color, int node) {
    if (color[node] == 1)
        return false;    // 还在栈上 → 有环
    if (color[node] == 2)
        return true;     // 已完成 → 安全
    color[node] = 1;     // 进栈
    for (int next : graph[node])
        if (!dfs(color, next))
            return false;
    color[node] = 2;     // 出栈
    return true;
}
```
:::

两行的位置决定了整个算法的正确性：

- `color[node] = 1` 在**进函数之后、展开邻居之前**
- `color[node] = 2` 在**所有邻居都返回之后、函数返回之前**

中间那段就是"这个点在递归栈上"的持续时间。环检测的全部含义就是：**在这段时间里，是否有别的路径回到了它。**

::: warning 坑点
`color[node] = 2` 写到函数**开头**，三色立刻塌成两色：每个点一进来就"已完成"，那么撞到任何点都会走 `== 2` 分支返回 `true`，包括真正的环。

**`1` 在前，`2` 在后，中间夹着 `for` 循环。** 这个夹层结构错了，代码不会报错，只会返回 `true`。
:::

### 建图：`vector<vector<int>>`

```cpp
vector<vector<int>> graph(numCourses);
for (const auto& edge : prerequisites) {
    int course = edge[0];    // 后学的
    int prerequisite = edge[1];       // 先学的
    graph[prerequisite].push_back(course);   // 边：prerequisite → course
}
```

三个要点：

1. **`vector<vector<int>>(numCourses)` 预设大小** —— 下标直接就是课程编号，不需要哈希，`graph[node]` 是 O(1) 的。这点是邻接表相对于 `map<int, vector<int>>` 的核心优势。
2. **方向**：题目给的 `[a, b]` 是"a 依赖 b"，在图上画箭头是 `b → a`。写作 `graph[prerequisite].push_back(course)`。
3. **有向图只存一个方向**。无向图要 `push_back` 两次（`graph[u].push_back(v)` 和 `graph[v].push_back(u)`），这里**只存一次**。多存一次等于把图变成无向的，每条边都成了二元环 —— 力扣第一个示例 `[[1,0]]` 就会从 `true` 变成 `false`。

## 完整可编译代码

```cpp
#include <cassert>
#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {
        // 邻接表：graph[prerequisite] 存所有"把 prerequisite 当先修"的课
        vector<vector<int>> graph(numCourses);
        for (const auto& edge : prerequisites) {
            int course = edge[0];   // 后学的
            int prerequisite = edge[1];      // 先学的
            graph[prerequisite].push_back(course);   // 有向边 prerequisite → course
        }

        // color: 0 未访问，1 在当前递归栈上，2 已完成
        vector<int> color(numCourses, 0);

        // 图可能不连通，每个点都要当一次起点
        for (int course = 0; course < numCourses; ++course) {
            if (color[course] == 0 && !dfs(graph, color, course)) {
                return false;
            }
        }
        return true;
    }

private:
    bool dfs(const vector<vector<int>>& graph,
             vector<int>& color, int course) {
        // 撞上"访问中"：它在当前路径上，环闭合
        if (color[course] == 1) return false;
        // 已完成：这棵子树整体无环，不必再走
        if (color[course] == 2) return true;

        color[course] = 1;  // 进栈：标记为"访问中"
        for (int next : graph[course]) {
            if (!dfs(graph, color, next)) return false;
        }
        color[course] = 2;  // 出栈：标记为"已完成"
        return true;
    }
};

int main() {
    Solution sol;

    {
        // 0 -> 1，一条边，能学完
        vector<vector<int>> prerequisites{{1, 0}};
        assert(sol.canFinish(2, prerequisites) == true);
    }
    {
        // 0 -> 1 -> 0，二元环
        vector<vector<int>> prerequisites{{1, 0}, {0, 1}};
        assert(sol.canFinish(2, prerequisites) == false);
    }
    {
        // 没有先修关系：单课 / 零课都要能过
        vector<vector<int>> prerequisites;
        assert(sol.canFinish(1, prerequisites) == true);
        assert(sol.canFinish(0, prerequisites) == true);
    }
    {
        // 自环：课 0 要求自己先修
        vector<vector<int>> prerequisites{{0, 0}};
        assert(sol.canFinish(1, prerequisites) == false);
    }
    {
        // 一条长链 2 -> 1 -> 0，无环
        vector<vector<int>> prerequisites{{0, 1}, {1, 2}};
        assert(sol.canFinish(3, prerequisites) == true);
    }
    {
        // 三元环 0 -> 1 -> 2 -> 0
        vector<vector<int>> prerequisites{{0, 1}, {1, 2}, {2, 0}};
        assert(sol.canFinish(3, prerequisites) == false);
    }
    {
        // 不连通：两条互不相干的边，都无环
        vector<vector<int>> prerequisites{{1, 0}, {3, 2}};
        assert(sol.canFinish(4, prerequisites) == true);
    }
    {
        // 不连通：环藏在不连通的子图里，必须外层循环才查得到
        vector<vector<int>> prerequisites{{1, 0}, {2, 3}, {3, 2}};
        assert(sol.canFinish(4, prerequisites) == false);
    }
    {
        // 菱形：0 -> 1、0 -> 2、1 -> 3、2 -> 3
        // 3 被两次到达，但第二次撞上的是颜色 2，不是环
        vector<vector<int>> prerequisites{{1, 0}, {2, 0}, {3, 1}, {3, 2}};
        assert(sol.canFinish(4, prerequisites) == true);
    }
    {
        // 压栈深度：2000 门课串成一条链
        vector<vector<int>> prerequisites;
        for (int course = 1; course < 2000; ++course) {
            prerequisites.push_back({course, course - 1});
        }
        assert(sol.canFinish(2000, prerequisites) == true);
    }

    cout << "all tests passed" << endl;
    return 0;
}
```

十个用例分三组，各自验证一件事：

| 组 | 用例 | 验证什么 |
|---|---|---|
| 无环 | 单边、长链、菱形、不连通无环 | 不该误判成有环（尤其**菱形**） |
| 有环 | 二元环、三元环、自环 | 环能被检出 |
| 边界 | `numCourses = 0`、不连通藏环、2000 层长链 | 空图、外层循环、递归深度 |

**菱形那个用例是整份测试里最重要的**：它证明三色真的在区分"汇合"和"环"。如果你不小心把 `color 2` 分支删掉（只判 `1`，其余全递归），菱形仍然返回 `true`，但**节点 3 会被重复展开** —— 小图上没感觉，大图上是指数级的重复访问（实测数据见下面「为什么 `== 2` 那行可以 `return true`」）。

## 逐段拆解

::: semantics
| 字段 | 含义 | 在代码里怎么用 |
| --- | --- | --- |
| `graph` | 邻接表，`graph[u]` = `u` 的所有后继 | 下标即课程编号；**只存方向 `prerequisite → course` 一次** |
| `color` | 三色状态数组，长度 `numCourses` | `0` 未访问 / `1` 栈上 / `2` 完成，替代 `bool visited` |
| `color[node] == 1` | 它在当前递归路径上是我的祖先 | 立刻 `return false`，这是判环**唯一**的出口 |
| `color[node] == 2` | 它及其子树已经验证无环 | `return true`，剪枝；没有它也能出正确答案，但会重复展开 |
| `color[course] = 1` | 进函数、展开邻居之前 | 这行到 `= 2` 之间是"我是栈上节点"的时间窗 |
| `color[course] = 2` | 所有邻居返回之后 | 同时表示"这条路径不再经过我"和"我的子树无环" |
| 外层 `for` | 对每个未访问点起一次 DFS | 图不连通是常态，漏了就会漏环 |
| `numCourses = 0` | 空图 | 外层循环不进，返回 `true`（没有课要上，当然能上完） |

:::

### 为什么 `== 2` 那行可以 `return true`

严格说，`color[next] == 2` 时直接跳过，和递归进去走一遍，**结论一样**——因为它已经是完成状态，说明从它出发的所有路径都验证过无环了。

删掉这行会怎样？`color[next]` 是 `2`，不是 `0` 也不是 `1`，接着被重新染成 `1` 再走一遍。正确性还在（因为它确实无环，走完又回到 `2`），但**同一棵子树被反复展开**。

我实测过这件事。构造每层 2 个节点、全互连的"分层菱形"（`n` 层共 `2n` 个节点、`4(n-1)` 条边），统计 `dfs` 被调用的次数：

| 层数 | 节点数 | 有 `== 2` 剪枝 | 删掉剪枝 |
|---|---|---|---|
| 5 | 10 | 15 | 31 |
| 10 | 20 | 35 | 1023 |
| 15 | 30 | 55 | 32767 |
| 20 | 40 | 75 | **1048575** |

有剪枝是 **`4L - 5`**（`L` 是层数，上表 5/10/15/20 对应 15/35/55/75），线性；删掉之后是 **`2^L - 1`**（31/1023/32767/1048575），指数爆炸 —— 40 个节点的图要跑一百万次递归。所以这一行是**复杂度保证**，不是正确性保证。写的时候别把它当装饰。

（这组数字是**从单个起点**出发统计的；外层 `for` 每个点都当一次起点时，入口调用会多算一遍，系数略有不同。要记的是"有剪枝线性、无剪枝指数"这个量级差，别背系数。）

### 自环为什么也被检出

`prerequisites = [[0,0]]` 表示 `0` 依赖 `0`，建图得到 `graph[0] = {0}`，一条自己指向自己的边。

DFS 走一遍：`color[0] = 1` → 遍历邻居 `0` → `color[0] == 1` → `false`。

**不需要为自环写特判。** 因为自环就是最短的环，"撞到祖先"这个判据天然覆盖了它。这也说明三色法的判据是紧的：环长 1、2、n 都用同一个 `if`。

### 递归深度

`numCourses <= 2000`，一条链最坏 2000 层。前面在 8 MB 栈下实测的临界点是约 13 万层（**针对本页这个 `dfs` 的栈帧**，换函数要重测），**本题深度完全安全**（测试里那个 2000 层的用例就是在压这条边界）。

真正要注意的是：如果题目放宽到 10 万门课，递归版就危险了（8 MB 栈下临界约 13 万层），得换 Kahn 算法（BFS 拓扑排序，显式队列，无递归栈）。

::: info 补充
Kahn 算法是 DFS 的对称方案：反复把入度为 0 的点入队、出队，并把它指向的点的入度减一；**最后出队的点数少于 `numCourses`** 就说明有环。

| | 三色 DFS | Kahn（BFS） |
|---|---|---|
| 判据 | 撞到"访问中"的点 | 有点永远入不了队（入度降不到 0） |
| 额外空间 | 递归栈 O(V) | 入度数组 + 队列 |
| 顺带得到拓扑序 | 出栈顺序的逆序 | 出队顺序本身就是 |
| 栈溢出风险 | 链状图上有 | 没有 |

两者都是 O(V + E)。DFS 写起来短，Kahn 更"无脑"（不需要区分三种状态）。
:::

## 坑点

::: warning 坑点
1. **用 `bool visited` 判环**：`A → B → A` 里 `A` 访问过了但仍在当前路径上，`bool` 分不出"栈上"和"完成" → 返回 `true`。必须有第三种状态。

2. **`color[course] = 2` 写到函数开头**：见上面「模板对照」的警告，全图恒返回 `true`。

3. **只反了一部分边**：把 `graph[prerequisite].push_back(course)` 写对，却在另一处（比如另一段循环、或手写 `prerequisites` 测试数据时）用了相反方向。**部分反转才是真错误**；如果所有边统一反向，环的集合不变，本题答案照样正确（见上面「题意重述」的提示）。写的时候念一遍"prerequisite 指向 course"。

4. **无向图那样加双向边**：`graph[u].push_back(v)` 和 `graph[v].push_back(u)` 都写。每一条边都变成二元环 —— 实测 4000 组随机图里有 324 组答案从 `true` 变成 `false`，纯链 `0 → 1 → 2` 也会被判成有环。

5. **忘了外层 `for`**：只 `dfs(0)`。环藏在 `{2,3}` 那个不连通分量里就查不到 —— 测试里第 8 个用例专门测这个。

6. **`color` 初始化成 `-1`**：后续判断 `== 0` 时新点被当成"已完成"跳过，整个算法变成空转，恒返回 `true`。初始值必须是 `0`（未访问）。
:::

::: danger 易错
第 4 条（双向建边）的症状**看起来完全正常**：不报错、没警告，而且力扣两个官方示例里**只有第一个**能抓住它。

| 用例 | 正确方向 | 双向建边 |
|---|---|---|
| `[[1,0]]`，期望 `true` | `true` | **`false`** ← 能抓住 |
| `[[1,0],[0,1]]`，期望 `false` | `false` | `false` ← 抓不住 |

也就是说，如果你先跑第二个示例、或者自己随手造了个带环的用例，就会以为代码是对的。

更要紧的是，**"所有边统一反向"这个看似严重的错误其实不影响本题答案**（环集合不变），真正会错的是"只反了一部分边"。两者的区别是：前者静默且正确，后者静默且错误。所以不要指望用测试用例来确认方向 —— 正确做法是**让代码输出一个拓扑序**（210 题），肉眼检查顺序，或者在建图时就把变量命名成 `prerequisite` 和 `course`，边写成 `graph[prerequisite].push_back(course)` 并读作"先修指向后学"。
:::

## 变体与练习

| 变化 | 改什么 |
|---|---|
| 输出任意一个拓扑序（[210](https://leetcode.cn/problems/course-schedule-ii/)） | `color = 2` 时 `order.push_back(course)`，最后 `reverse` |
| 判断无环但要求 BFS 写法 | Kahn：入度数组 + 队列，出队计数 `< numCourses` 即有环 |
| 无向图判环（[261](https://leetcode.cn/problems/graph-valid-tree/)） | 三色可以退化成两色，但递归要带上 `parent`，跳过父亲那条边 |
| 只想知道某两门课有没有依赖 | 从起点 DFS，命中目标即返回，不必走完全图 |
| 图无环但要求最少学期数（[1136](https://leetcode.cn/problems/parallel-courses/)） | 无环判定后改求最长路径（DFS 返回子树深度，取 `max`） |
| 边有多个前置条件、可并发 | 拓扑排序 + 按层推进，等于在 DAG 上跑 BFS |

::: details 为什么"撞到访问中的点"恰好等价于"存在环"
设 DFS 在时刻 `t` 走到 `v`，且 `color[v] == 1`。`1` 的含义是"`v` 的 DFS 已进入但未返回"，也就是 `v` 还在递归栈上。递归栈里从 `v` 到当前节点 `u` 的每一层都是一条边（调用 `dfs(邻居)` 就是走一条边），于是存在路径 `v → ... → u`。而当前正要从 `u` 看向 `v`，说明存在边 `u → v`。合起来是一条从 `v` 出发回到 `v` 的路径 —— 环。

反过来，若图有环 `c1 → c2 → ... → ck → c1`，考虑其中**第一个被访问**的节点 `c1`（按 DFS 开始时间）。从 `c1` 出发沿环走，`c1` 一定还在栈上（它还没返回，因为路径没走完），所以走到 `ck → c1` 这条边时 `color[c1] == 1`，算法返回 `false`。

两个方向都成立，所以 `color == 1` 是**充要**判据，不会漏也不会误报。
:::

::: info 补充
三色标记其实是"**DFS 时间戳**"的简化版。严谨地说，`1` 对应"`discover` 已完成、`finish` 未完成"，`2` 对应"两者都完成"。在有向图上：

- `u → v` 且 `v` 是 `u` 的后代 → **前向边**
- `u → v` 且 `v` 是 `u` 的祖先（`color[v] == 1`）→ **回边**，环
- `u → v` 且 `v` 已完成且非后代 → **横叉边**，无环

判环只看**回边**。`color` 数组用一个 `int` 就同时编码了这三类信息，换成 `bool` 就只剩"访问没访问过"，`discover` / `finish` 的区分丢了，回边和横叉边就混在一起了。
:::

回到 [专题总览](/topics/graph-dfs/)，那里还有网格 DFS 和邻接表 DFS 的并排模板；或者去 [200 岛屿数量](/topics/graph-dfs/200-number-of-islands)看看同一个骨架在无向网格上的形态。
