# 二分查找 · 模板与变体

二分的全部难度都在**边界**上，而边界问题的根源是：你心里那个"区间到底包不包含端点"没说清楚。

先把这句话钉死，后面所有代码都从它推出来：

> **`left` 和 `right` 定义的区间里，一定还包含"可能等于目标值"的位置。区间外的位置已经确定不可能。**

## 三种写法，只选一种用

| 写法 | 区间语义 | 循环条件 | 收缩 | 结束状态 |
|---|---|---|---|---|
| 左闭右闭 | `[left, right]` | `left <= right` | `left = mid + 1` / `right = mid - 1` | 区间空，没找到 |
| 左闭右开 | `[left, right)` | `left < right` | `left = mid + 1` / `right = mid` | `left == right`，是插入位置 |
| 求下界（`lower_bound`） | `[0, n)`，找第一个 `>= target` | `left < right` | `left = mid + 1` / `right = mid` | `left` 就是答案 |

::: warning 坑点
**混用是死循环的第一来源。** 左闭右闭却写 `right = mid`，当 `left == right == mid` 时区间不缩小 → 死循环。左闭右开却写 `while (left <= right)`，`right = n` 时会越界。
:::

## 通用模板（左闭右开，最通用）

```cpp
// 在有序数组 nums 中查找 target，返回下标，找不到返回 -1
// 区间：[left, right) —— right 是"取不到"的位置
int binarySearch(const vector<int>& nums, int target) {
    int left = 0;
    int right = static_cast<int>(nums.size());   // 注意不是 size() - 1

    while (left < right) {                       // 区间非空才继续
        int mid = left + (right - left) / 2;     // 防止 (left+right) 溢出
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) left = mid + 1;  // mid 已排除
        else                    right = mid;     // mid 也排除，但 mid 可能是答案
    }
    return -1;
}
```

三段式的三个决策点，改一处就是另一个变体：

| 决策点 | 可选值 | 影响 |
|---|---|---|
| `right` 初始值 | `n` 或 `n - 1` | 决定区间开闭 |
| 循环条件 | `left < right` 或 `left <= right` | 必须匹配区间语义 |
| 收缩方式 | `right = mid` 或 `mid - 1` | 决定 `mid` 本身被不被排除 |

## 变体索引

### 变体 1：找精确值（[704](/topics/binary-search/704-binary-search)）

标准三分支。命中直接返回，没命中就排除 `mid`。

**信号**：数组有序 + 找一个数在哪。

### 变体 2：找左边界 / 右边界（[34](/topics/binary-search/34-first-last-position)）

命中**不返回**，继续往左/右挤。这两题共用一份 `bound` 函数，靠一个 `bool` 参数区分：

```cpp
int bound(const vector<int>& nums, int target, bool lower) {
    int left = 0, right = static_cast<int>(nums.size());
    while (left < right) {
        int mid = left + (right - left) / 2;
        // lower: 找第一个 >= target；upper: 找第一个 > target
        bool goRight = lower ? nums[mid] < target : nums[mid] <= target;
        if (goRight) left = mid + 1;
        else         right = mid;
    }
    return left;   // 第一个不满足条件的位置
}
```

注意 `upper` 分支用的是 `<=` —— **一个等号的差别，决定了重复元素落在哪一侧。**

### 变体 3：二分答案

不搜索数组，搜索**答案的取值范围**。前提是答案有单调性：存在一个阈值 `k`，`>= k` 都可行、`< k` 都不可行（或反过来）。

```cpp
int low = 答案下界, high = 答案上界;
while (low < high) {
    int mid = low + (high - low) / 2;
    if (check(mid)) high = mid;    // mid 可行，答案可能是 mid 或更小
    else            low = mid + 1; // mid 不可行，答案必须更大
}
return low;
```

::: info 补充
二分答案的难点不在二分，在 `check()` 的单调性证明，以及 `low`/`high` 的初始界。上界取不到会导致死循环，所以要确认 `high` 一定是可行解，或至少是"答案不会超过它"。
:::

### 变体 4：旋转数组（33 / 81 / 153）

数组被切成两段有序。判据不是"和 target 比"，而是"**哪一半是有序的，target 在不在那一半里**"。

```cpp
bool inSortedHalf = nums[left] <= nums[mid]
    ? (nums[left] <= target && target < nums[mid])   // 左半有序
    : (nums[mid] < target && target <= nums[right - 1]); // 右半有序
```

::: warning 坑点
有重复元素时（81 题），`nums[left] == nums[mid] == nums[right-1]` 会出现"分不清哪半有序"的情况，此时只能 `left++` 逐个跳过，最坏退化成 O(n)。
:::

## 坑点汇总

::: warning 坑点
1. **`mid` 计算溢出**：`(left + right) / 2` 在 `left + right` 超过 `int` 上限时得到负数。恒用 `left + (right - left) / 2`。
2. **求中点偏左还是偏右**：`(left + right) / 2` 偏左。在 `left = mid` 型写法（不排除 `mid`）里，`left == mid` 会导致死循环，必须改用 `left + (right - left + 1) / 2` 偏右。
3. **`right` 初值**：写成 `n - 1` 就不能用 `left < right` 配 `right = mid`，区间语义会打架。
4. **空数组**：`right = 0` 时不进循环，直接返回，别在循环前访问 `nums[0]`。
:::

## 自检清单

写完二分，用这三个输入手工走一遍：

- 目标在**最左端**（`left` 边界）
- 目标在**最右端**（`right` 边界）
- 目标**不存在**，且比所有元素都小 / 都大

三个都过，才算写对。
