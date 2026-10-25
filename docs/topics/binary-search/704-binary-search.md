---
title: 704 · 二分查找
---

# 704 · 二分查找

<ProblemMeta id="704" difficulty="简单" title="二分查找" :tags="['数组', '左闭右开']" url="https://leetcode.cn/problems/binary-search/" />

::: cheat 速查卡
- **什么时候用**：数组**有序**且无重复，找一个值是否存在/在哪
- **核心不变式**：`[left, right)` 之外的位置，全部已确定不等于 `target`
- **收缩规则**：`mid` 比完就排除，`left = mid + 1` 或 `right = mid`
- **复杂度**：时间 **O(log n)**、空间 **O(1)**
:::

## 题意重述

给定升序数组 `nums` 和目标值 `target`，存在则返回**任意一个**下标，否则返回 `-1`。

```
输入: nums = [-1, 0, 3, 5, 9, 12], target = 9
输出: 4

输入: nums = [-1, 0, 3, 5, 9, 12], target = 2
输出: -1
```

重点在第二个例子：**没找到时也要能干净退出**，而不是靠越界或死循环才停下。

## 从朴素到二分

线性扫描是 O(n)，但升序这个条件被完全浪费了。二分的想法只有一句：

> 看中点的值。比它小的一律不可能，比它大的一律不可能 —— **一次排除一半**。

排除的依据是**有序**。如果没有序，"比 `nums[mid]` 小"就不能推出"在 `mid` 左边"，二分立刻失效。

## 模板对照

::: compare 通用模板 [left, right) | 704 本题
```cpp
// 通用模板：[left, right)
int left = 0;
int right = nums.size();
while (left < right) {
    int mid = left + (right - left) / 2;
    if (nums[mid] == target)
        return mid;
    if (nums[mid] < target)
        left = mid + 1;
    else
        right = mid;
}
return -1;
```
```cpp
// 本题：一模一样，只是多了端点注释
int search(vector<int>& nums, int target) {
    int left = 0;
    int right = static_cast<int>(nums.size());
    //             ↑ 开区间，right 取不到
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) left = mid + 1;
        else                    right = mid;
    }
    return -1;
}
```
:::

这题**没有任何改动**。它是模板本身，所以适合拿来验证你对三个决策点的理解。

::: details 为什么 `right` 初值是 `size()` 而不是 `size() - 1`？

两种都能写对，但不是"哪个更好"，而是**配套关系**：

| `right` 初值 | 区间 | 循环条件 | 收缩 |
|---|---|---|---|
| `size()` | `[0, n)` 左闭右开 | `left < right` | `right = mid` |
| `size() - 1` | `[0, n-1]` 左闭右闭 | `left <= right` | `right = mid - 1` |

混用会出两种典型问题：

- `right = size()` 配 `left <= right`：当 `left == right == size()` 时访问 `nums[size()]`，越界。
- `right = size() - 1` 配 `left < right`：漏掉 `right` 指向的那个元素，**目标在最后一个位置时永远找不到**。

我全站统一用左闭右开，因为它顺带给了你"插入位置"的语义 —— 循环结束时 `left` 恰好是第一个 `>= target` 的位置。这个性质在 [34 题](/topics/binary-search/34-first-last-position) 里直接就是答案。
:::

## 完整可编译代码

```cpp
#include <cassert>
#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    int search(vector<int>& nums, int target) {
        int left = 0;
        int right = static_cast<int>(nums.size());  // [left, right)

        while (left < right) {
            int mid = left + (right - left) / 2;    // 防溢出
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) left = mid + 1;
            else                    right = mid;
        }
        return -1;
    }
};

int main() {
    Solution sol;

    vector<int> a{-1, 0, 3, 5, 9, 12};
    assert(sol.search(a, 9) == 4);
    assert(sol.search(a, -1) == 0);     // 最左端
    assert(sol.search(a, 12) == 5);     // 最右端
    assert(sol.search(a, 2) == -1);     // 不存在（中间）
    assert(sol.search(a, -5) == -1);    // 比所有元素都小
    assert(sol.search(a, 100) == -1);   // 比所有元素都大

    vector<int> empty{};
    assert(sol.search(empty, 1) == -1); // 空数组

    vector<int> single{7};
    assert(sol.search(single, 7) == 0);
    assert(sol.search(single, 8) == -1);

    cout << "all tests passed" << endl;
    return 0;
}
```

`main` 里那 9 个断言不是凑数 —— 它们正好覆盖了下面「自检清单」的每一格。复制走改一行就能验证你的猜想。

## 逐段拆解

::: semantics
| 字段 | 含义 | 在代码里怎么用 |
| --- | --- | --- |
| `left` | 候选区间**左端，包含** | 只在 `nums[mid] < target` 时右移，因为 `mid` 已确定不是答案 |
| `right` | 候选区间**右端，不包含** | `mid` 太大时写成 `right = mid`（`mid` 已被排除在候选外，但它可以作为新右边界） |
| `mid` | 当前探测点，恒满足 `left <= mid < right` | 每轮只用于一次比较，用完即弃 |
| `left < right` | 区间非空 | 区间空了（`left == right`）说明没找到，此时退出 |
| `left + (right - left) / 2` | 向下取整的中点 | 等价于 `(left+right)/2` 但不溢出 |
:::

### 为什么 `right = mid` 而不是 `mid - 1`

这是全站最容易搞混的一处，值得单独说。

关键看**`mid` 会不会成为下一轮的候选**：

- `nums[mid] > target` → 位置 `mid` 本身**不可能是答案**，但它右边的所有位置也都不可能是。
- 所以新区间是 `[left, mid)`，右端点写 `mid`。
- 如果写成 `right = mid - 1`，区间变成 `[left, mid - 1)`，而这时语义是"左闭右开"，**`mid - 1` 这个位置被误排除了**。

反过来在左闭右闭里，`right = mid - 1` 才是对的，因为右端点是**包含**的。

一句话记法：**开区间写 `mid`，闭区间写 `mid - 1`。**

### 为什么 `left = mid + 1` 两种写法都一样

因为无论开闭，左端点都是包含的。`mid` 已经确认不是答案，必须跳过，所以永远是 `+1`。

如果这里写成 `left = mid`，当区间只剩两个元素时会一直卡住：`left == mid`，每轮都把同样的值算一遍 → **死循环**。

::: danger 易错
`left = mid` 是死循环，`right = mid - 1`（在开区间里）是**静默漏解** —— 后者更难查，因为大部分用例都能过，只有目标刚好落在边界时错。

写完二分，专门测一次"目标在最后一个位置"。
:::

## 坑点

::: warning 坑点
1. **`(left + right) / 2` 溢出**：`left`、`right` 都接近 `INT_MAX` 时和会溢出成负数，`mid` 变成负下标 → 数组越界崩溃。恒用 `left + (right - left) / 2`。

2. **`nums.size()` 是 `size_t`**：`int right = nums.size();` 会触发收窄警告，`nums.size() - 1` 在空数组时会回绕成巨大正数。统一 `static_cast<int>(nums.size())`。

3. **空数组**：`right = 0`，`left = 0`，不进循环直接返回 `-1`。所以循环**之前**绝对不能访问 `nums[0]`。

4. **返回值语义**：这题没找到返回 `-1`，但模板里 `left` 在循环结束时是"第一个大于等于 `target` 的位置"。别顺手把 `return -1` 改成 `return left`，那是 35 题（搜索插入位置）的答案。
:::

## 变体与练习

| 变化 | 改什么 |
|---|---|
| 数组降序 | 比较方向全部反转：`nums[mid] < target` 时 `right = mid` |
| 找插入位置（[35](https://leetcode.cn/problems/search-insert-position/)） | 删掉 `==` 分支，最后 `return left` |
| 求边界（[34](/topics/binary-search/34-first-last-position)） | 命中不返回，继续收缩，用两次二分 |
| 有重复元素 | 这题答案就不唯一了，想清楚要"任意一个"还是"第一个" |

::: info 补充
LeetCode 704 明确说了"数组中的元素不重复"，所以命中就可以直接返回。一旦有重复，`return mid` 拿到的可能是中间那个，要拿到第一个就得继续往左挤 —— 这就是 34 题。
:::
