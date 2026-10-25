---
title: 34 · 在排序数组中查找元素的第一个和最后一个位置
---

# 34 · 查找第一个和最后一个位置

<ProblemMeta id="34" difficulty="中等" title="查找第一个和最后一个位置" :tags="['数组', '边界收缩', 'lower_bound']" url="https://leetcode.cn/problems/find-first-and-last-position-of-element-in-sorted-array/" />

::: cheat 速查卡
- **什么时候用**：有序数组 + **有重复** + 要找"第一个/最后一个"而不是"任意一个"
- **核心不变式**：`left` 的左边全部 `< target`，`right` 及其右边全部 `>= target`
- **一句话模板**：命中**不返回**，把 `mid` 当作"可能是答案的右边界"继续收缩
- **复杂度**：时间 **O(log n)**（两次二分）、空间 **O(1)**
:::

## 题意重述

升序数组 `nums` 里有重复元素，找出 `target` 出现的**第一**和**最后**一个下标。不存在返回 `[-1, -1]`。

```
输入: nums = [5,7,7,8,8,10], target = 8
输出: [3, 4]

输入: nums = [5,7,7,8,8,10], target = 6
输出: [-1, -1]      ← 注意：6 的插入位置是 3，但不是答案

输入: nums = [], target = 0
输出: [-1, -1]
```

第三个例子是关键：**空数组不能崩**，而且不能返回 `[0, 0]`。

## 从朴素到最优

最直接的想法：二分找到任意一个 `8`（下标 3 或 4），然后往两边线性扫。

**这个做法是错的**，不是结果错，是复杂度错。`nums = [8,8,8,...,8]` 时线性扫描退化成 O(n)，二分白做了。

正确做法是**两次二分**，各自 O(log n)。核心技巧是：

> 找到 `target` 后**不返回**，而是把它记成"这个位置可以作为答案"，然后继续往需要追查的方向收缩。

## 模板对照

先看关键改动：普通二分是"三分支 + 命中即返回"，边界二分是"**两分支 + 命中时选一边**"。

::: compare 普通二分：命中即返回 | 边界二分：命中不返回
```cpp
// 普通二分：三分支，命中返回
while (left < right) {
    int mid = left + (right - left) / 2;
    if (nums[mid] == target)
        return mid;              // ← 命中就走人
    if (nums[mid] < target)
        left = mid + 1;
    else
        right = mid;
}
```
```cpp
// 边界二分：两分支，命中不返回
while (left < right) {
    int mid = left + (right - left) / 2;
    if (nums[mid] < target)      // 只看"够不够大"
        left = mid + 1;
    else
        right = mid;             // 命中时也走这里
}
// 循环结束时 left = 第一个 >= target 的位置
```
:::

看懂了没 —— **整个"找左边界"的魔法，就是把 `== target` 从单独分支里删掉，让它落到 `else` 里。**

`nums[mid] == target` 时，`mid` 是一个合法的答案，但**左边可能还有更早的**，所以把右边界收到 `mid`（保留 `mid` 作为候选），继续在 `[left, mid)` 里找。循环结束时 `left` 就是最左边那个。

### 两个边界都靠同一个函数

```cpp
// lower = true  → 第一个 >= target 的位置
// lower = false → 第一个 >  target 的位置
int bound(const vector<int>& nums, int target, bool lower)
```

差别的全部体现就在这一行判断：

| `lower` | 判断式 | 语义 |
|---|---|---|
| `true` | `nums[mid] < target` 才右移 | `== target` 时留在左边找更早的 |
| `false` | `nums[mid] <= target` 才右移 | `== target` 时要跳过，找严格更大的 |

**一个等号，决定重复元素落在哪一侧。** 右边界 = `bound(target, false) - 1`。

::: warning 坑点
`upper_bound` 找的是"第一个 `> target`"，它可能是 `nums.size()`（target 比所有元素都大时）。所以右边界是 `bound - 1`，而 `bound == 0` 时 `-1` 会变成非法下标。**必须先判空/判不存在再减一**，顺序反了就是越界。
:::

## 完整可编译代码

```cpp
#include <cassert>
#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    vector<int> searchRange(vector<int>& nums, int target) {
        // 找第一个 >= target 的位置（左边界）
        int first = bound(nums, target, true);
        // 找第一个 > target 的位置，再减一得到最后一个 target
        int last = bound(nums, target, false) - 1;

        // 两个失效条件：一个是左边界越界，一个是 target 根本不存在
        if (first == static_cast<int>(nums.size()) || nums[first] != target)
            return {-1, -1};

        return {first, last};
    }

private:
    // lower == true  : 第一个 >= target
    // lower == false : 第一个 >  target
    int bound(const vector<int>& nums, int target, bool lower) {
        int left = 0;
        int right = static_cast<int>(nums.size());  // [left, right)

        while (left < right) {
            int mid = left + (right - left) / 2;
            bool goRight = lower ? (nums[mid] < target) : (nums[mid] <= target);
            if (goRight) left = mid + 1;   // mid 太小（或需要跳过等值）
            else         right = mid;      // mid 可能是答案，保留
        }
        return left;   // 第一个不满足 goRight 条件的位置
    }
};

int main() {
    Solution sol;

    vector<int> a{5, 7, 7, 8, 8, 10};
    assert((sol.searchRange(a, 8) == vector<int>{3, 4}));
    assert((sol.searchRange(a, 6) == vector<int>{-1, -1}));   // 不存在
    assert((sol.searchRange(a, 5) == vector<int>{0, 0}));      // 最左端
    assert((sol.searchRange(a, 10) == vector<int>{5, 5}));     // 最右端
    assert((sol.searchRange(a, 0) == vector<int>{-1, -1}));    // 比所有都小
    assert((sol.searchRange(a, 100) == vector<int>{-1, -1}));  // 比所有都大

    vector<int> empty{};
    assert((sol.searchRange(empty, 0) == vector<int>{-1, -1})); // 空数组

    vector<int> allSame{2, 2, 2, 2};
    assert((sol.searchRange(allSame, 2) == vector<int>{0, 3})); // 全是 target

    vector<int> single{1};
    assert((sol.searchRange(single, 1) == vector<int>{0, 0}));
    assert((sol.searchRange(single, 0) == vector<int>{-1, -1}));

    cout << "all tests passed" << endl;
    return 0;
}
```

## 逐段拆解

::: semantics
| 字段 | 含义 | 在代码里怎么用 |
| --- | --- | --- |
| `first` | 第一个 `>= target` 的下标 | 可能是 `nums.size()`（全都不够大），所以先查它是否越界 |
| `last` | 第一个 `> target` 的位置减一 | 只有 `first` 已经确认命中后，它才是一个合法下标 |
| `lower` | 切换两种边界语义的开关 | 只影响 `goRight` 里的那一个比较符 |
| `goRight` | "`mid` 肯定不是答案，整体往右挪" | 单独抽出来是为了让两个变体的差异**只有一行** |
| `right = mid` | 保留 `mid` 作为候选 | 这里的 `mid` 可以是答案，所以不能 `-1` |
| 循环结束 | `left == right`，即分界点 | 左边全不满足 `goRight`，右边全满足 |
:::

### 为什么这个函数能同时给出两个边界

把 `bound` 想成一个**分界线**：

```
nums:   5   7   7   8   8   10
index:  0   1   2   3   4   5
                 ↑           ↑
        lower(8)=3      lower(10)=5 = upper(8)
```

- `bound(target, true)` 把数组切成"`< 8`" 和 "`>= 8`"，分界点 = 3
- `bound(target, false)` 把数组切成"`<= 8`" 和 "`> 8`"，分界点 = 5

所以 `target` 占据的区间恰好是 `[3, 5)`，最后一个下标就是 `5 - 1 = 4`。

**这也是为什么右边界要用"第一个 `> target` 减一"**，而不是"从右往左找第一个 `== target`" —— 后者的不变式是反的，容易和左边界写混。

### 命中判断为什么放在两次二分之后

```cpp
if (first == nums.size() || nums[first] != target) return {-1, -1};
```

这两个条件都必须检查，但它们**覆盖的是不同情况**：

| 情况 | `first` 的值 | 哪个条件拦住 |
|---|---|---|
| target 比所有元素都大 | `nums.size()` | 第一个（防越界） |
| target 不存在但在中间 | 插入位置 | 第二个（`nums[first] != target`） |
| 数组为空 | `0` | 第一个（`0 == size()`） |

::: danger 易错
把两个条件调换顺序就是**越界崩溃**：`nums[first]` 在 `first == nums.size()` 时是未定义行为。**先判越界，再取值比较**，这个顺序在所有"取下标前"的场景都成立。
:::

### `last` 为什么不可能是 `-1`

直觉上 `bound(target, false) - 1` 有可能是 `-1`（当 `bound` 返回 0，即所有元素都 `> target`）。但代码里在返回前已经确认了 `nums[first] == target`，所以 `target` 至少存在一次，`upper_bound` 至少是 `first + 1 >= 1`。`last >= 0` 是安全的。

::: warning 坑点
`last` 可以**先算**，本页代码就是先算的 —— 因为它只在命中确认后才被**使用**。`[5,7,8,10]` 找 100 时，`last` 会算成 3（一个合法但错误的下标），但 `first == size` 成立，直接早退，`last` 根本没机会被用到。

真正不能颠倒的是上面那两个条件本身：**先判越界，再取 `nums[first]`**。
:::

## 坑点

::: warning 坑点
1. **`upper_bound` 返回 `n` 时减一得到 `n-1`**：看起来没关系，但如果 `target` 不存在且比所有元素都大，`last` 会指向数组最后一个元素 —— 一个**错误的、但合法的**下标。所以必须先确认 `target` 存在。

2. **`==` 写成 `<=`（或反过来）**：`lower`/`upper` 的差别只有一个符号。`upper` 里忘记 `=` 会退化成 `lower`，两个返回值相同 → 返回 `[first, first]`，在重复元素上错得很隐蔽。

3. **空数组**：`bound` 返回 `0`，`0 == nums.size()` 成立，走 `-1` 分支。但**不要**在 `bound` 里加 `nums[0]` 之类的预检查。

4. **`vector<int>` 比较要加括号**：`assert(sol.searchRange(a, 8) == vector<int>{3, 4})` 里的 `vector<int>{3, 4}` 含逗号，宏 `assert` 会把它当成两个参数 —— 编译报错。写成 `assert((expr == vector<int>{3,4}))`。
:::

::: info 补充
C++ 标准库其实直接给了这两个函数：`std::lower_bound` / `std::upper_bound`。手写一遍的价值在于**理解不变式**，实际刷题可以直接用：

```cpp
auto first = lower_bound(nums.begin(), nums.end(), target);
auto last  = upper_bound(nums.begin(), nums.end(), target);
if (first == nums.end() || *first != target) return {-1, -1};
return {int(first - nums.begin()), int(last - nums.begin()) - 1};
```
:::

## 变体与练习

| 变化 | 改什么 |
|---|---|
| 只要第一个（34 的一半） | 只调 `bound(target, true)`，返回前判存在 |
| 找插入位置（[35](https://leetcode.cn/problems/search-insert-position/)） | 直接返回 `bound(target, true)`，不用判存在 |
| 统计出现次数 | `upper - lower`，不用遍历 |
| 数组降序 | 所有比较符反转，`lower`/`upper` 的语义也跟着换 |
| 找"最后一个 `<= target`" | 用 `bound(target, false) - 1`，边界条件不同 |

下一个专题：[滑动窗口](/topics/sliding-window/)，那里 `left`/`right` 两个下标会同时移动，但和二分不同 —— 它们**只往右走，不回头**。
