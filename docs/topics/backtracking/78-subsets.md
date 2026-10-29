---
title: 78 · 子集
---

# 78 · 子集

<ProblemMeta id="78" difficulty="中等" title="子集" :tags="['回溯', 'start 参数', '幂集']" url="https://leetcode.cn/problems/subsets/" />

::: params 回溯
| 要素 | 本题取值 |
| --- | --- |
| 一层在决策什么 | 下一个选的数取 `[start, n)` 里的哪个、接到 `path` 末尾；`[0, start)` 已定过"选或不选"，**每个节点都是答案**（含空集） |
| 分支怎么枚举 | `for (int i = start; i < n; ++i)`，递归传 `i + 1` 当下一次的 `start`，只往后扫不回头 |
| 撤销写在哪 | 递归返回后 `path.pop_back()`；没有 `used` 要复位，`start` 是参数、天然回溯 |
:::

::: cheat 速查卡
- **什么时候用**：要枚举"选哪些元素"，而 `{1,2}` 和 `{2,1}` 算同一个答案
- **核心不变式**：递归参数 `start` 之前的下标**已经决定过**，本层只能在 `[start, n)` 里挑
- **一句话模板**：**每个节点都是答案**，收集写在递归入口；递归传 `i + 1`
- **复杂度**：时间 **O(n · 2ⁿ)**、空间 **O(n)**（不含答案本身）
:::

## 题意重述

给一个**互不相同**的整数数组，返回它的全部子集（幂集），顺序随意。

```
输入: nums = [1,2,3]
输出: [[],[1],[2],[1,2],[1,3],[2,3],[1,2,3]]

输入: nums = [0]
输出: [[],[0]]

输入: nums = []
输出: [[]]
```

三个例子的重点：

1. 第一个验证**数量**：`2³ = 8`，且必须包含空集和全集
2. 第二个是**边界**：单元素只有 2 个子集，别写成 0 个或 1 个
3. 第三个验证**空集也是答案** —— `result` 至少要有一个空数组，不能是空的 `result`

## 从朴素到最优

最直接的想法是**对每个元素做"选 / 不选"的二元决策**：`n` 个元素，`2ⁿ` 种组合，用位掩码就能写完。

```cpp
for (int mask = 0; mask < (1 << n); ++mask) {
    vector<int> subset;
    for (int i = 0; i < n; ++i)
        if (mask & (1 << i)) subset.push_back(nums[i]);
    result.push_back(subset);
}
```

它是**对的**，而且没有递归开销。但有两个问题：

1. **只能解子集**。加一个"和等于 `target`"的约束，位掩码要先枚举完再筛；换成组合总和、分割回文串就完全不能用
2. **没法剪枝**。所有 `2ⁿ` 个都要生成完，哪怕其中大部分明显不合法

所以子集题真正要学的是**回溯版本**，因为它是后续所有"枚举组合"题（39 / 40 / 90 / 131 / 77）的母版。位掩码只在这个专题里当验算工具用 —— 两个版本的结果集必须完全相同。

关键转折只有一句话：

> 子集是"从前往后挑"，一旦决定跳过某个下标，**后面就不能回头再选它**。用一个 `start` 参数把这个约束写进递归签名。

## 模板对照

::: compare 回溯通用骨架 | 78 本题：填进子集
```cpp
// 通用骨架：收集 + 循环 + 三段
void backtrack(参数) {
    if (终止条件) {
        result.push_back(path);
        return;
    }
    for (候选 in 本层) {
        做选择;
        backtrack(下一层);
        撤销选择;
    }
}
```
```cpp
// 78 本题：没有终止条件
void backtrack(int start) {
    result.push_back(path);   // 开口就收
    for (int i = start; i < n; ++i) {
        path.push_back(nums[i]);      // 做
        backtrack(i + 1);             // i+1
        path.pop_back();              // 撤
    }
}
```
:::

本题和 46 的差别看着只有两处，实际有三处：

| 差别 | 46 排列 | 78 子集 |
|---|---|---|
| 收集位置 | `return` 之前（叶子） | **函数第一行**（每个节点） |
| 循环起点 | 恒为 `0` | `start`，递归传 `i + 1` |
| 终止条件 | `path.size() == n` | **没有**，靠 `for` 自然结束 |
| 去重手段 | `used` 数组 | `start` 参数 |

第三行最容易被忽略：子集题里 `for` 循环走完就自然返回了，**不需要 `if (...) return;`**。硬加一个 `if (path.size() == n) return;` 会让全集之后的节点不再展开 —— 但全集本来就是叶子，所以不报错；真正出问题的是加上"和为 `target`"之类的条件后，那个 `return` 会挡住更短的合法子集。

## 完整可编译代码

```cpp
#include <cassert>
#include <iostream>
#include <set>
#include <vector>
using namespace std;

class Solution {
public:
    vector<vector<int>> subsets(vector<int>& nums) {
        vector<vector<int>> result;
        vector<int> path;
        backtrack(nums, 0, path, result);
        return result;
    }

private:
    void backtrack(const vector<int>& nums,
                   int start,
                   vector<int>& path,
                   vector<vector<int>>& result) {
        // 每个节点都是答案，所以写在开头，不是写在循环后面
        result.push_back(path);

        // 从 start 开始：只能选下标更大的元素，避免 {2,1} 重复 {1,2}
        for (int i = start; i < static_cast<int>(nums.size()); ++i) {
            path.push_back(nums[i]);    // 做选择
            backtrack(nums, i + 1, path, result);   // 注意是 i + 1
            path.pop_back();            // 撤销选择
        }
    }
};

int main() {
    Solution sol;

    {
        vector<int> nums{1, 2, 3};
        auto result = sol.subsets(nums);
        assert(result.size() == 8);
        assert((result == vector<vector<int>>{{}, {1}, {1, 2}, {1, 2, 3},
                                              {1, 3}, {2}, {2, 3}, {3}}));
    }
    {
        // 空输入：只有一个子集，就是空集
        vector<int> nums{};
        auto result = sol.subsets(nums);
        assert(result.size() == 1);
        assert(result[0].empty());
    }
    {
        vector<int> nums{0};
        auto result = sol.subsets(nums);
        assert(result.size() == 2);
        assert((result == vector<vector<int>>{{}, {0}}));
    }
    {
        vector<int> nums{1, 2};
        auto result = sol.subsets(nums);
        assert(result.size() == 4);
        assert(result[0].empty());
        assert((result[1] == vector<int>{1}));
        assert((result[2] == vector<int>{1, 2}));
        assert((result[3] == vector<int>{2}));
    }
    {
        // 负数与零：值和顺序无关的矛盾都存在
        vector<int> nums{-3, 0};
        auto result = sol.subsets(nums);
        assert(result.size() == 4);
        assert((result == vector<vector<int>>{{}, {-3}, {-3, 0}, {0}}));
    }
    {
        vector<int> nums{1, 2, 3, 4, 5};
        auto result = sol.subsets(nums);
        assert(result.size() == 32);
        set<vector<int>> unique(result.begin(), result.end());
        assert(unique.size() == 32);          // 无重复
        size_t total = 0;
        for (const auto& one : result) total += one.size();
        assert(total == 5 * 16);              // 每个元素出现在一半子集里
    }

    cout << "all tests passed" << endl;
    return 0;
}
```

最后一个用例里的 `total == 5 * 16` 是一条**比数量更强的自检**：`n` 个元素的幂集里，每个元素恰好出现在一半（`2ⁿ⁻¹`）个子集中，所以所有子集的长度之和必须是 `n · 2ⁿ⁻¹`。数量对但内容有偏的 bug 会在这里露出来。

## 逐段拆解

::: semantics
| 字段 | 含义 | 在代码里怎么用 |
| --- | --- | --- |
| `start` | 本层**允许选的最小下标**；`[0, start)` 已经做过"选或不选"的决策 | 不是"从哪开始找"，而是"前面的都翻篇了，别回头" |
| `path` | 当前这条路径选中的元素，即"一个候选子集" | `push` / `pop` 成对，永远不整体赋值 |
| `result.push_back(path)` | 收下当前节点 | 写在**递归第一行**：根节点对应空集，也要收 |
| `i` | 本层挑中 `nums[i]` | 从 `start` 到 `n - 1` |
| `i + 1` | 下一层的 `start` | 保证下标严格递增 ⇒ 每个集合只有一种生成顺序 |
| `n == 0` | 循环一次都不进 | 函数只执行开头那一行收集，于是返回 `[[]]` |
:::

### 为什么每个节点都是答案

排列要求"用完全部元素"，所以只有叶子是答案。子集**任何长度的前缀都合法** —— 选 0 个是空集，选 1 个是单元素子集，选 `n` 个是全集。

看 `nums = [1,2,3]` 的决策树，每个节点都标上它对应的子集：

```
                    path=[]          ← 空集，第 1 个答案
        ┌───────────┼───────────┐
    选 1│        选 2│        选 3│
        │           │           │
     [1] ←ans    [2] ←ans    [3] ←ans      第 2、6、8 个
    ┌───┴───┐       │
 选 2│    选 3│   选 3│
    │       │       │
 [1,2]←ans [1,3]←ans [2,3]←ans            第 3、5、7 个
    │
 选 3│
    │
[1,2,3] ←ans                               第 4 个
```

数一下标记：**8 个节点 = 8 个答案**。而叶子只有 3 个。这也解释了为什么子集没有终止条件：每个节点都要继续展开，唯独"`for` 自然结束"才是真正的停止。

::: danger 易错
把 `result.push_back(path)` 挪到 `for` 循环**之后**，`[1,2,3]` 仍然是 8 个、内容也都对 —— 只是**顺序反了**（`{123}{12}{13}{1}…{}`，从"先根后子"变成"先子后根"）。`main` 里那条整数组比较会炸，`result.size() == 8` 这一句却照样通过。

**别把它和"只在叶子收"混为一谈**：真的写成 `if (start == n) { result.push_back(path); return; }`，`[1,2,3]` 才只剩 4 个（`{123} {13} {23} {3}`）。"只剩 1 个"是 46 的现象（排列要求走满 `n` 步，只有一条路径能到），不是 78 的。
:::

### `start` 怎么保证不重复不遗漏

**不重复**：`start` 让下标**严格递增**。生成 `{1,3}` 的唯一途径是"第 0 层选 1，第 1 层选 3"；想生成 `{3,1}` 得先选 3 再选 1，但那要求下标从 3 回退到 1，被 `start` 挡住了。

**不遗漏**：对任意子集 `S`，把它的下标升序排好，沿着这串下标一路选下去，每一步的下标都 `>= start`，路径合法 ⇒ 一定能走到。所以 `S` 必然被生成，且只被生成一次。

两条合起来，**结果集合恰好等于幂集**。这就是为什么 `unique.size() == 32` 那个断言能过。

反例最能说明问题。把 `i + 1` 写成 `start + 1`（看起来只是个小失误）：

```
dfs(start + 1) → 16 个结果，正确是 8 个
```

因为它让 `start` 不跟着 `i` 走，同一层的多个元素会被反复选中 —— `[2,2]`、`[3,3,3]` 这种含重复下标的"伪子集"就冒出来了。

### 不传 `start` 会怎样

去掉 `start`、每层都从 `0` 扫，再用"值已在 `path` 里就跳过"来去重：

```cpp
for (int i = 0; i < n; ++i) {
    if (find(path.begin(), path.end(), nums[i]) != path.end())
        continue;
    ...
}
```

这条路**也能得到正确答案**（实测 `[1,2,3]` 得到 16 条路径，**每个子集先排序归一化**后去重才是 8 个），但：

- 每条合法子集会被**多种顺序**生成（`[1,2]` 会从 `[1]→2` 和 `[2]→1` 两条路都到达），一半的计算是白做的
- 去重前必须先排序归一化 —— 不排序的话 `set<vector<int>>` 会把 `[1,2]` 和 `[2,1]` 当成两个不同结果，去重完全无效（实测仍得 16）
- 去重靠 `O(n)` 的线性查找，总复杂度多乘以一个 `n`
- 一旦有重复元素，这个"值去重"就彻底失效

所以标准写法永远是 `start`。

::: compare 用 start：每条路径唯一 | 不用 start：靠值查找补锅
```cpp
for (int i = start; i < n; ++i) {
    path.push_back(nums[i]);
    backtrack(i + 1);
    path.pop_back();
}
// {1,2} 只能从 1→2 生成
// 节点总数 = 2^n
```
```cpp
for (int i = 0; i < n; ++i) {
    if (inPath(nums[i])) continue;
    path.push_back(nums[i]);
    backtrack();
    path.pop_back();
}
// {1,2} 从 1→2 和 2→1 都能生成
// 会多算一半
```
:::

## 坑点

::: warning 坑点
1. **收集写在 `for` 之后**：数量仍是 8、内容也对，但**顺序变成从叶子往回排**（`{123}{12}{13}{1}…{}`），靠整数组比较的断言会炸。收集写在递归入口第一行、**在 `for` 之前**，才能保证"先根后子"的字典序。

   真正会掉数量的是**只在叶子收**（`if (start == n)`）：`[1,2,3]` 只剩 4 个 —— `{123} {13} {23} {3}`，即只有"取满或取最大下标"的那些路径。

2. **递归传 `start + 1`**：必须传 `i + 1`。传 `start + 1` 时 `[1,2,3]` 会得到 16 个结果，里面混着 `[2,2]`、`[3,3,3]` 这类不合法的子集 —— 数量变多，`size()` 断言反而更容易"碰巧"过不去，但一旦用 `set` 去重就会暴露。

3. **`path.pop_back()` 漏写**：`for` 里每个 `push_back` 都要有 `pop_back`。漏了之后 `path` 只增不减，`[1,2,3]` 仍返回 8 个结果，但内容是 `[] [1] [1,2] [1,2,3] [1,2,3,3] …` —— **数量对、内容全错**，最隐蔽。

4. **漏掉空集**：如果 `result` 在函数外预先填了别的东西，或者收集写在 `if (!path.empty())` 里面，空集就丢了。`n = 0` 的用例能立刻抓到（应该返回 `[[]]`）。

5. **`result` 按值传参**：`void backtrack(..., vector<vector<int>> result)` 每次递归复制一份，`main` 里永远是空的。加 `&`。

6. **`result.push_back(path)` 存指针**：`vector<vector<int>*>` 会让所有答案指向同一个 `path`，最后全是空数组。用值类型。
:::

第 3 条值得单独记：它**不改变结果数量**，所以 `assert(result.size() == 8)` 照样通过。真正抓它的是第一个用例里的整数组比较。写回溯题的测试，`size()` 断言是必要的但**远远不够**。

## 变体与练习

| 变化 | 改什么 |
|---|---|
| **有重复元素**（[90](https://leetcode.cn/problems/subsets-ii/)） | 先 `sort`，循环里加 `if (i > start && nums[i] == nums[i-1]) continue;` |
| 只要长度为 `k` 的组合（[77](https://leetcode.cn/problems/combinations/)） | 收集前加 `if (path.size() == k) { ...; return; }`，循环上界可收成 `n - (k - path.size()) + 1` |
| 和为 `target` 的组合（[39](https://leetcode.cn/problems/combination-sum/)） | 递归前判 `sum > target` 剪枝；元素可重复用 ⇒ 递归传 `i` 而非 `i + 1` |
| 和为 `target` 且每个只用一次（[40](https://leetcode.cn/problems/combination-sum-ii/)） | 39 的基础 + `sort` + `i > start` 同层去重 |
| 元素个数 `1 ≤ x ≤ 9` 且和为 `n`（216） | 和 77 + 39 一样，`start` 从 `1` 开始，上界 `9` |
| 不写递归，用位掩码 | `for (mask = 0; mask < (1 << n); ++mask)`，无剪枝能力，仅适合纯子集 |

### 90 的同层去重：`i > start` 而不是 `i > 0`

这是全专题最容易写错的一行。先看两种写法的实测差别（`nums = [1,2,2]`，排序后）：

```
i > start  → 6 个：[] [1] [1,2] [1,2,2] [2] [2,2]   ← 正确
i > 0      → 4 个：[] [1] [1,2] [2]                  ← 少了 [1,2,2] 和 [2,2]
```

差在哪里？只需要盯住一个时刻：**`i == start` 且 `nums[start] == nums[start-1]`**。

| 事件 | `start` | `i` | `nums[i]` | `i > 0` | `i > start` |
|---|---|---|---|---|---|
| 走 `[1]` 后，本层试下标 1 | `1` | `1` | `2` | 真，但 `nums[1]≠nums[0]`，放行 | 假，放行 |
| 走 `[1,2]` 后，本层试下标 2 | `2` | `2` | `2` | 真且 `nums[2]==nums[1]` → **误杀** | 假，放行 |
| 走 `[2]`（根层选下标 1）后，试下标 2 | `2` | `2` | `2` | 真且相等 → **误杀** | 假，放行 |

这三行的共同点是 **`i == start`** —— 它们都是"本层的第一个候选"。而 `i > start` 在 `i == start` 时恒为假，所以第一个候选永远放行；`i > 0` 在 `start > 0` 时恒为真，只要值恰好和左边相邻元素相等，就被当成重复杀掉。

后两行正是生成 `[1,2,2]` 和 `[2,2]` 的最后一步，所以那两个答案丢了。

一句话：**`i > start` 问的是"本轮 for 里前面有没有兄弟试过这个值"，`i > 0` 问的是"整个数组里前面有没有相等的值"**。前者才是同层判重。

::: info 补充
两种条件的语义完全不同：

- `i > start` = "**本轮 for** 里前面有兄弟试过这个值" → 同层判重 ✅
- `i > 0` = "**整个数组**里前面有相等的值" → 全局判重 ❌

全局判重会把"值相同但位置更深"的合法分支一起灭掉。这点在 90 题上很直观：`[2,2]` 里的第二个 `2` 是**上一层刚选的**，它必须能选。

在排列类题目（47）里，用的是 `i > 0 && nums[i] == nums[i-1] && !used[i-1]` —— 那里必须写 `i > 0`（没有 `start` 可用），靠 `!used[i-1]` 补上"同层"的判断。**`!used[i-1]` 和 `i > start` 是同一个意思的两种编码。**
:::

### 位掩码版本：用来验算，不用来交

```cpp
vector<vector<int>> byMask(const vector<int>& nums) {
    int n = static_cast<int>(nums.size());
    vector<vector<int>> result;
    for (int mask = 0; mask < (1 << n); ++mask) {
        vector<int> subset;
        for (int i = 0; i < n; ++i)
            if (mask & (1 << i)) subset.push_back(nums[i]);
        result.push_back(subset);
    }
    return result;
}
```

它和回溯版的结果集**完全相同**（只是顺序不同）。写完回溯版，用它在 `main` 里做一次 `set` 比对，能一次性抓出所有漏解和重复解：

```cpp
auto fromBacktrack = sol.subsets(nums);      // 先存下来
auto fromMask = byMask(nums);

set<vector<int>> a(fromBacktrack.begin(), fromBacktrack.end());
set<vector<int>> b(fromMask.begin(), fromMask.end());
assert(a == b);
```

注意别写成 `set<...> a(sol.subsets(nums).begin(), sol.subsets(nums).end())` —— 那是**两次调用**，两个迭代器来自两个不同的临时对象，比较它们是未定义行为。先把结果存进变量，再取 `begin()` / `end()`。

注意 `1 << n` 在 `n >= 31` 时溢出，所以这个验算只适用于小 `n`。力扣本题 `n <= 10`，安全。

下一个专题：[全排列](/topics/backtracking/46-permutations) —— 同一个骨架把 `start` 换成 `used`、把收集从节点挪到叶子，就是排列。
