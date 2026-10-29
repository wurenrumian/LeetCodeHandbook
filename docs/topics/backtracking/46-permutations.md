---
title: 46 · 全排列
---

# 46 · 全排列

<ProblemMeta id="46" difficulty="中等" title="全排列" :tags="['回溯', 'used 数组', '排列']" url="https://leetcode.cn/problems/permutations/" />

::: params 回溯
| 要素 | 本题取值 |
| --- | --- |
| 一层在决策什么 | 结果的**第 `path.size()` 位**放哪个数；`path.size() == n` 就是叶子 |
| 分支怎么枚举 | 每层从 `0` 扫到 `n - 1`，只跳过 `used[i] == true`（已在当前路径上）的 |
| 撤销写在哪 | 递归返回后紧接着 `path.pop_back()` + `used[i] = false`，两行都不能少 |
:::

::: cheat 速查卡
- **什么时候用**：要把 `n` 个元素**排个顺序**，`[1,2]` 和 `[2,1]` 算两个答案
- **核心不变式**：`used[i]` 为真 ⇔ `nums[i]` 在**当前这条路径**上，不是"全局用过"
- **一句话模板**：每层从 `0` 扫，跳过 `used[i]`，叶子收集
- **复杂度**：时间 **O(n · n!)**、空间 **O(n)**（不含答案本身）
:::

## 题意重述

给一个**互不相同**的整数数组，返回它的全部排列，顺序随意。

```
输入: nums = [1,2,3]
输出: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]

输入: nums = [0,1]
输出: [[0,1],[1,0]]

输入: nums = [1]
输出: [[1]]
```

三个例子的重点：

1. 第一个验证**数量**：`3! = 6`，多一个少一个都是错的
2. 第二个验证**顺序有意义**：`[0,1]` 和 `[1,0]` 必须都在
3. 第三个是**边界**：单元素只有一种排法，递归进去一次就要能收

## 从朴素到最优

最朴素的做法是**枚举所有长度为 `n` 的下标序列**，即 `nums[i]` 里每个位置都可以取 `0..n-1`，共 `nⁿ` 条，最后用 `set` 把非排列的扔掉。

`n = 3` 时是 27 条候选，只留下 6 条 —— **78% 的计算都花在生成垃圾上**，而且 `n = 8` 时是 1677 万条。

关键转折只有一句话：

> 同一个下标不能在同一条路径上出现两次。**把这个约束放进生成过程**，而不是等到生成完再筛。

`used[i]` 就是这个约束的载体。它会砍掉整棵"重复用了某个下标"的子树，所以候选数从 `nⁿ` 直接降到 `n!`：

| `n` | 枚举所有序列 `nⁿ` | 回溯的叶子数 `n!` |
|---|---|---|
| 3 | 27 | 6 |
| 4 | 256 | 24 |
| 8 | 16 777 216 | 40 320 |

**剪枝不是"少算几步"，是改变了增长的量级。** 这就是回溯比暴力枚举高一个档次的全部原因。

## 模板对照

::: compare 回溯通用骨架 | 46 本题：填进排列
```cpp
// 通用骨架：任何回溯都是这三段
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
// 46 本题：三段填满
void backtrack() {
    if (path.size() == n) {
        result.push_back(path);
        return;
    }
    for (int i = 0; i < n; ++i) {
        if (used[i]) continue;   // 本路径用过
        used[i] = true;          // 做选择
        path.push_back(nums[i]);
        backtrack();             // 仍从 0 扫
        path.pop_back();         // 撤销选择
        used[i] = false;
    }
}
```
:::

本题只填了四个空，但**每一个都不能填错**：

| 空 | 本题的填法 | 填错的后果 |
|---|---|---|
| 终止条件 | `path.size() == n` | 写 `>= n` 会在越界后才发现；忘了 `return` 会继续往下递归 |
| 候选范围 | `for (i = 0; i < n; ++i)` | 改成 `start` 起就退化成组合，只剩 1 个结果 |
| 做/撤销 | `used[i]` 置真/假 + `path` 进出 | 少撤销一步，兄弟分支看到脏 `path` |
| 收集位置 | `return` 之前（叶子） | 挪到函数开头就变成子集，`n = 3` 会返回 16 个 |

## 完整可编译代码

```cpp
#include <cassert>
#include <iostream>
#include <set>
#include <vector>
using namespace std;

class Solution {
public:
    vector<vector<int>> permute(vector<int>& nums) {
        vector<vector<int>> result;
        vector<int> path;
        vector<bool> used(nums.size(), false);
        backtrack(nums, used, path, result);
        return result;
    }

private:
    void backtrack(const vector<int>& nums,
                   vector<bool>& used,
                   vector<int>& path,
                   vector<vector<int>>& result) {
        // 收集时机：排列要求用完全部元素，只在叶子收集
        if (path.size() == nums.size()) {
            result.push_back(path);
            return;
        }

        // 每一层都从 0 开始：顺序是信息，[1,2] 和 [2,1] 都要
        for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
            if (used[i]) continue;      // 本路径上已用过

            used[i] = true;             // 做选择
            path.push_back(nums[i]);

            backtrack(nums, used, path, result);

            path.pop_back();            // 撤销选择
            used[i] = false;
        }
    }
};

int main() {
    Solution sol;

    {
        vector<int> nums{1, 2, 3};
        auto result = sol.permute(nums);
        assert(result.size() == 6);
        assert((result == vector<vector<int>>{{1, 2, 3}, {1, 3, 2}, {2, 1, 3},
                                              {2, 3, 1}, {3, 1, 2}, {3, 2, 1}}));
    }
    {
        vector<int> nums{1};
        auto result = sol.permute(nums);
        assert(result.size() == 1);
        assert((result == vector<vector<int>>{{1}}));
    }
    {
        // 空输入：数学上“空排列”是 1 个，力扣约束 n >= 1，但代码不能崩
        vector<int> nums{};
        auto result = sol.permute(nums);
        assert(result.size() == 1);
        assert(result[0].empty());
    }
    {
        // 负数与零：值不影响逻辑，只影响顺序
        vector<int> nums{0, -1};
        auto result = sol.permute(nums);
        assert(result.size() == 2);
        assert((result == vector<vector<int>>{{0, -1}, {-1, 0}}));
    }
    {
        // 有重复值时，这题的语义是“按下标区分”，仍给 n! 个结果
        vector<int> nums{1, 1};
        auto result = sol.permute(nums);
        assert(result.size() == 2);
        assert((result == vector<vector<int>>{{1, 1}, {1, 1}}));
    }
    {
        vector<int> nums{1, 2, 3, 4};
        auto result = sol.permute(nums);
        assert(result.size() == 24);
        // 每个结果都是 4 个元素，且互不相同
        set<vector<int>> unique(result.begin(), result.end());
        assert(unique.size() == 24);
        for (const auto& one : result) assert(one.size() == 4);
    }

    cout << "all tests passed" << endl;
    return 0;
}
```

第六个用例里 `unique.size() == 24` 才是真正的"排列"证明 —— 前五个断言只查了数量，数量对但内容重复也能过。

## 逐段拆解

::: semantics
| 字段 | 含义 | 在代码里怎么用 |
| --- | --- | --- |
| `path` | 从根到当前节点的**路径**，即"已经排好的前缀" | 只有 `push_back` / `pop_back` 两个操作，绝不整体赋值 |
| `used[i]` | `nums[i]` **是否在当前路径上**，不是"历史上有没有用过" | 进入时置 `true`，返回时置 `false` —— 复位是它唯一的"解锁"方式 |
| `path.size()` | 当前已选元素个数 = 决策树的深度 | 同时充当终止条件和"下一个空位在哪" |
| `i` | 本层试的是**第几个下标** | 从 `0` 到 `n - 1`，每层都完整扫一遍 |
| `result` | 收集所有叶子 | **按引用**传，全程只有一份 |
| `path.size() == n` | 走到叶子，前缀已排满 | 收集后立刻 `return`，不再往下展开 |
:::

### `used[i]` 到底是"谁"用过

这是本题唯一的理解难点，值得单独说。

`used[i] = false` 在递归返回后会**被恢复**，所以它描述的永远不是"`nums[i]` 在整个搜索过程中被用过"。它描述的是：

> **从根到当前节点这条路径上**，`nums[i]` 被用过了。

拿 `nums = [1,2,3]` 走一遍，看 `used` 在关键位置的值：

```
根          path=[]       used=[F,F,F]
 ├ 选 1     path=[1]      used=[T,F,F]
 │ ├ 选 2   path=[1,2]    used=[T,T,F]
 │ │ └ 选 3 path=[1,2,3]  used=[T,T,T]  ← 叶子，收集 [1,2,3]
 │ └ 选 2 前先撤销 3：    used=[T,T,F]   ← 3 被释放
 │   path=[1,3]           used=[T,F,T]
 ├ 回到根，撤销 1：       used=[F,F,F]   ← 1 被释放
 └ 选 2     path=[2]      used=[F,T,F]
```

看 `[1,3]` 那一行：此时 `used[1]`（对应 `nums[1] = 2`）是 `false`。它当然"被用过"—— 在 `[1,2,3]` 那条分支上用过 —— 但在**当前路径** `[1,3]` 上没用过，所以它可用。

::: danger 易错
`used[i] = false` 的**位置**决定了 `used` 的语义，写错一位就从"当前路径"变成"没有约束"。

最典型的错法是把复位写在 `continue` 之前：

```cpp
for (int i = 0; i < n; ++i) {
    used[i] = false;              // ✗ 先把状态抹掉
    if (used[i]) continue;        // 条件永远为假
    ...
}
```

`if (used[i])` 此时恒为假，等于**删掉了去重**。实测 `[1,2,3]` 会返回 **27 个**结果（`nⁿ`），里面全是 `[1,1,1]`、`[3,2,3]` 这类非法排列 —— 数量变多，不是变少。

另一种错法是干脆不写 `used[i] = false`（只 `pop_back`）：第一趟走到底后所有元素都"已用"，外层再也找不到候选，只剩 **1 个**结果 `[1,2,3]`。

方向相反的两种错，一个变 27 个、一个变 1 个，正确是 6 个。**任何偏离 6 的数量都立刻暴露**，所以本题的 `assert(result.size() == 6)` 恰好是最好用的哨兵。
:::

### 为什么每层都从 0 开始

因为**排列关心位置**。`path` 的第 0 个位置放 `2`、第 1 个位置放 `1`，和反过来是两个不同答案。

所以"这一层能放谁"不取决于"前面放到哪了"，只取决于"谁还没在当前路径上"：

```cpp
for (int i = 0; i < n; ++i)        // 全范围
    if (!used[i]) { ... }          // 靠 used 排除，不靠下标下界
```

对照 [78 子集](/topics/backtracking/78-subsets)，它关心的是**集合**，`{2,1}` 和 `{1,2}` 是同一个，所以用 `start` 把下标限制成"只增不减"：

::: compare 46：靠 used，全范围扫 | 78：靠 start，只往后扫
```cpp
// 排列：每层从 0 开始
for (int i = 0; i < n; ++i) {
    if (used[i]) continue;
    used[i] = true;
    path.push_back(nums[i]);
    backtrack();      // 仍从 0 扫
    path.pop_back();
    used[i] = false;
}
```
```cpp
// 子集：每层从 start 开始
for (int i = start; i < n; ++i) {
    path.push_back(nums[i]);
    backtrack(i + 1); // 下标只增
    path.pop_back();
}
```
:::

把 46 的 `for` 改成 `for (int i = start; ...)`、递归传 `i + 1`，`[1,2,3]` 的结果会从 6 个变成 **1 个**（只有 `[1,2,3]`）—— 因为它变成了"从前往后挑 3 个"，只有一种挑法。

### 为什么收集在叶子

排列要求**用完全部 `n` 个元素**。走到非叶子时 `path` 只有 1~2 个元素，那不是答案，只是答案的前缀。

所以 `if (path.size() == n)` 既是终止条件也是收集条件，二者在排列题里天然重合。这个重合在子集题里就**断开了** —— 子集每个节点都是答案。

## 坑点

::: warning 坑点
1. **`path.pop_back()` 漏写**：`for` 循环里的 `push_back` 和 `pop_back` 必须严格成对。漏了之后 `path` 只增不减，一旦长度超过 `n` 就再也命中不了终止条件，整棵树只走出第一条路径 —— `[1,2,3]` 只返回 1 个结果 `[1,2,3]`。写完数一数 `push_back` 和 `pop_back` 的个数是否相等。

2. **`used[i] = false` 漏写**：`used` 只置真不复位，第一趟走到底之后所有元素都"已用"，外层循环再扫也不会有候选 —— 同样是只剩 1 个结果 `[1,2,3]`。它和 `pop_back` 是两件事，**两个都要还原**，漏哪个都只出 1 个答案。

3. **`result.push_back(path)` 存的是引用**：如果 `result` 声明成 `vector<vector<int>*>` 或 `vector<const vector<int>&>`，所有元素都指向同一个 `path`。`[1,2]` 时你会拿到 2 个**空数组**，因为收集完 `path` 又被清空了。用 `vector<vector<int>>` 存值，`push_back` 会自动拷贝。

4. **`result` 按值传参**：写成 `void backtrack(..., vector<vector<int>> result)` 时，每次递归都是新副本，改的是副本，`main` 里的 `result` 永远是空的。必须加 `&`。

5. **`for` 从 `start` 开始**：复制 78 的代码改过来最容易犯。这一改就从排列变成了组合，`[1,2,3]` 只剩 1 个结果，而且不报错。

6. **`path.size() == nums.size()` 写成 `>=`**：本题不会触发，但一旦改成"从 `n` 个里取 `k` 个"的变体（如 60 题），`>=` 会把超长的路径也收进去。
:::

上面 6 条里有 4 条是**静默出错** —— 不崩溃、不报警，只是 `result` 的数量和内容不对。所以验证时不能只看 `size()`，要像 `main` 里那样直接比较整个二维数组。

## 变体与练习

| 变化 | 改什么 |
|---|---|
| **有重复元素**（[47](https://leetcode.cn/problems/permutations-ii/)） | 先 `sort`，递归前加 `if (i > 0 && nums[i] == nums[i-1] && !used[i-1]) continue;` |
| 只要第 `k` 个排列（[60](https://leetcode.cn/problems/permutation-sequence/)） | 别真去搜，用阶乘进制直接算；或者维护一个 `count`，够 `k` 就剪枝 |
| 从 `n` 个里取 `k` 个排列（`A(n,k)`） | 终止条件改 `path.size() == k`，`used` 不变，仍从 0 扫 |
| 相邻元素不能相同 | 进 `path` 前加 `if (!path.empty() && path.back() == nums[i]) continue;`，变成"路径约束"而非"集合约束" |
| 字符串的全排列 | 把 `vector<int>` 换成 `string`，`used` 逻辑一字不改 |
| 只要字典序最小的 | 先 `sort`，然后搜到的**第一个**叶子就是答案，直接返回 |

### 47 的同层去重为什么必须带 `!used[i-1]`

```cpp
if (i > 0 && nums[i] == nums[i - 1] && !used[i - 1])
    continue;
```

三个条件各管一件事：

| 条件 | 作用 |
|---|---|
| `i > 0` | 防 `nums[-1]` 越界 |
| `nums[i] == nums[i - 1]` | 只有相等元素才可能产生重复排列 |
| `!used[i - 1]` | "前一个相等元素**不在当前路径上**" ⇒ 它在本层已经试完并撤回了 |

第三条是关键。如果去掉它，写成 `nums[i] == nums[i-1]` 就 `continue`，`[1,1,2]` 会返回 **0 个**结果 —— 第一个 `1` 一进循环就把第二个 `1` 屏蔽了，而第一个 `1` 自己又会被第三个条件之外的地方挡住。实测：

```
[1,1,2] 带 !used[i-1] → 3 个：[1,1,2] [1,2,1] [2,1,1]
[1,1,2] 不带          → 0 个
```

::: info 补充
另一条路是 `if (i > 0 && nums[i] == nums[i-1] && used[i-1]) continue;` —— 它也是对的，只是剪的是"另一侧"的重复分支。两种写法结果相同，因为重复的排列成对出现，砍哪一半都行。面试时写一种、说清另一种即可，别两种混着写。
:::

下一个专题：[子集](/topics/backtracking/78-subsets) —— 同一个骨架去掉 `used`、加上 `start`，收集时机从叶子挪到每个节点。
