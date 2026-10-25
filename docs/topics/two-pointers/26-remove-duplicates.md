---
title: 26 · 删除有序数组中的重复项
---

# 26 · 删除有序数组中的重复项

<ProblemMeta id="26" difficulty="简单" title="删除有序数组中的重复项" :tags="['数组', '原地修改', '快慢指针']" url="https://leetcode.cn/problems/remove-duplicates-from-sorted-array/" />

::: cheat 速查卡
- **什么时候用**：有序数组 + 原地去重 + 要求 O(1) 额外空间
- **核心不变式**：`[0, slow)` 是**已确认的、无重复的**前缀；`slow` 是下一个待写入位置
- **一句话模板**：`fast` 只读，遇到和 `nums[slow-1]` 不同的就写进去
- **复杂度**：时间 **O(n)**、空间 **O(1)**
:::

## 题意重述

**原地**删除升序数组中的重复元素，使每个元素只出现一次，返回新长度。超出新长度后的内容**无所谓**。

```
输入: nums = [1,1,2]
输出: 2, nums = [1,2,_]
              ↑ 前 2 个是 [1,2]，后面的值不检查

输入: nums = [0,0,1,1,1,2,2,3,3,4]
输出: 5, nums = [0,1,2,3,4,_,_,_,_,_]

输入: nums = [1]
输出: 1
```

两个约束决定了做法：

1. **原地** —— 不能 `set` 去重后重建
2. **有序** —— 重复元素一定**相邻**

第 2 点是这题能 O(n) 的根本原因：不需要哈希表记住"见过没"，只要和**上一个保留的元素**比。

## 从朴素到双指针

朴素做法：发现重复就整体左移一位，O(n²)。

观察：我们其实只关心"要保留的元素"，**读到哪里**和**写到哪里**可以分开。于是有了两个下标：

- `fast`：读指针，走遍每个元素，判断它该不该留
- `slow`：写指针，指向"下一个该写入的位置"

因为 `slow` 永远追不上 `fast`，写入时不会覆盖未读数据。

## 模板对照

::: compare 原地删除的通用骨架 | 26 本题：slow 从 1 起
```cpp
// 原地删除的通用骨架
int slow = 0;                    // 写指针
for (int fast = 0; fast < n; ++fast) {
    if (/* 保留 nums[fast] */) {
        nums[slow] = nums[fast];
        ++slow;
    }
}
return slow;   // [0, slow) 是结果
```
```cpp
// 本题：slow 从 1 起
// 条件 = 和"上一个保留的"不同
if (nums.empty()) return 0;   // 否则 slow=1 越界
int slow = 1;                 // nums[0] 天然保留
for (int fast = 1; fast < n; ++fast) {
    // 关键：比的是已保留的最后一个
    if (nums[fast] != nums[slow - 1]) {
        nums[slow] = nums[fast];
        ++slow;
    }
}
return slow;
```
:::

改动有两处，都值得单独说：

### 1. `slow` 从 1 开始，`fast` 也从 1 开始

第一个元素一定保留（没有"前一个"可比），所以先把它放进结果，两个指针都跳过它。

如果从 0 开始写：

```cpp
int slow = 0;
for (int fast = 0; fast < n; ++fast)
    if (nums[fast] != nums[slow - 1])   // slow == 0 时访问 nums[-1]！
```

`slow - 1` 变成 `-1` → 越界。所以**要么特判第一个元素，要么从 1 起**。

### 2. 比较对象是 `nums[slow - 1]` 而不是 `nums[fast - 1]`

这是本题最容易被"改对又改错"的一行。两种写法：

| 比较对象 | 含义 | 对不对 |
|---|---|---|
| `nums[fast - 1]` | 和前一个**原始**元素比 | 在本题**也对**，因为有序时相邻重复 |
| `nums[slow - 1]` | 和上一个**保留的**元素比 | **更通用**，无序或条件复杂时仍然对 |

本题因为有序，两者结果相同（重复必然相邻）。但 `nums[slow - 1]` 表达的是**不变式**（"结果里的最后一个"），语义更强 —— 换成 27 移除元素、或"每个元素最多保留两次"时，只有它能直接改对。

::: info 补充
"每个元素最多保留两次"（[80 题](https://leetcode.cn/problems/remove-duplicates-from-sorted-array-ii/)）要改**三处**：比较对象从 `nums[slow - 1]` 变成 `nums[slow - 2]`、`slow` 从 2 起步、**再补一个长度特判**。

```cpp
if (n <= 2) return n;                    // ← 少了这行，[1] 会返回 2
int slow = 2;
for (int fast = 2; fast < n; ++fast)
    if (nums[fast] != nums[slow - 2]) nums[slow++] = nums[fast];
return slow;
```

**那个特判不能省**：`slow = 2` 起步时，长度 ≤ 2 的输入循环一次都不进，直接返回 2。`[1]` 会返回 2（应为 1），`[]` 会返回 2（应为 0）。

为什么比较 `slow - 2`？因为"保留 2 个"意味着连续 2 个相同是允许的，只有第 3 个才该扔。**`slow - k` 就是"保留 k 个"的通用形式，而它总是需要 `if (n <= k) return n;` 这条边界。**
:::

## 完整可编译代码

```cpp
#include <cassert>
#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    int removeDuplicates(vector<int>& nums) {
        if (nums.empty()) return 0;   // 特判：否则 slow=1 越界

        int slow = 1;                 // [0, slow) 是已确认的无重复前缀
        for (int fast = 1; fast < static_cast<int>(nums.size()); ++fast) {
            // 和"已保留的最后一个"比较，而不是 fast-1
            if (nums[fast] != nums[slow - 1]) {
                nums[slow] = nums[fast];
                ++slow;
            }
        }
        return slow;                  // slow 既是长度，也是下一个空位
    }
};

// 辅助：打印前 k 个元素，方便肉眼验证
void dump(const vector<int>& v, int k) {
    cout << "[";
    for (int i = 0; i < k; ++i) cout << (i ? ", " : "") << v[i];
    cout << "]";
}

int main() {
    Solution sol;

    vector<int> a{1, 1, 2};
    int k1 = sol.removeDuplicates(a);
    assert(k1 == 2);
    assert((vector<int>(a.begin(), a.begin() + k1) == vector<int>{1, 2}));

    vector<int> b{0, 0, 1, 1, 1, 2, 2, 3, 3, 4};
    int k2 = sol.removeDuplicates(b);
    assert(k2 == 5);
    assert((vector<int>(b.begin(), b.begin() + k2) == vector<int>{0, 1, 2, 3, 4}));

    vector<int> c{1};
    assert(sol.removeDuplicates(c) == 1);

    vector<int> d{};
    assert(sol.removeDuplicates(d) == 0);        // 空数组

    vector<int> e{2, 2, 2, 2};
    assert(sol.removeDuplicates(e) == 1);        // 全相同

    vector<int> f{1, 2, 3};
    assert(sol.removeDuplicates(f) == 3);        // 无重复

    cout << "all tests passed" << endl;
    return 0;
}
```

## 逐段拆解

::: semantics
| 字段 | 含义 | 在代码里怎么用 |
| --- | --- | --- |
| `slow` | 下一个"有效元素"该写入的位置 | 写完一个就 `++`；循环结束时**正好等于结果长度** |
| `fast` | 当前检查的元素下标 | 全部走一遍，不被任何操作影响 |
| `[0, slow)` | 已确认无重复的前缀 | 不变式，全程为真 |
| `nums[slow - 1]` | 结果里最后一个元素 | 分类讨论的基准，不是 `fast - 1` |
| 返回值 `slow` | 新长度 | 因为 `[0, slow)` 有 `slow` 个元素，**不用 +1** |
:::

### 为什么返回值是 `slow` 不是 `slow + 1`

因为不变式是 `[0, slow)` —— **左闭右开**。区间 `[0, 1)` 有 1 个元素，所以 `slow == 1` 表示长度 1。

如果不变式写成 `[0, slow]`（双闭），那返回就要 `slow + 1`。**两种都对，但不能混。**

建议统一用**左闭右开**，好处是"边界即长度"，`vector` 的 `size()`、`begin() + k` 全都能直接用。

### `nums[slow] = nums[fast]` 为什么安全

需要保证两件事：

1. **不覆盖未读数据**：因为每次写入后 `slow <= fast + 1`，而没有写的时候 `slow <= fast`。归纳可得 `slow <= fast` 恒成立 —— 所以写的位置永远在读过或正在读的位置。
2. **被写的旧值不需要了**：`nums[slow]` 是"已经被判定为重复、要丢弃"的位置，覆盖它没有损失。

::: details 用不变量法验证（形式化一点）

**不变式**：每轮迭代开始时，
- (a) `[0, slow)` 由原数组中的不重复元素组成，且保持原相对顺序
- (b) `slow <= fast`
- (c) `[0, fast)` 中的所有元素都已被"考察"过

**初始**：`slow = fast = 1`，`[0,1) = {nums[0]}` 满足 (a)；`1 <= 1` 满足 (b)。

**保持**：若 `nums[fast] != nums[slow-1]`，则它是新值（不能比结果末尾更小，因为有序；也不相等）。写入后 `[0, slow+1)` 仍不重复，`slow+1 <= fast+1` 成立。若相等，`slow` 不动，`slow <= fast < fast+1` 成立。

**终止**：`fast == n`，此时 `[0, n)` 全部考察完，`[0, slow)` 就是答案。
:::

### 为什么"有序"这个条件不能省

如果数组无序，`nums[fast] != nums[slow-1]` 就不再等价于"这是一个新值"。比如 `[1,2,1]`：

- `fast=2` 时 `nums[2]=1`，`nums[slow-1]=nums[1]=2`，不相等 → 写入，得到 `[1,2,1]`
- 但 `1` 已经出现过了

无序场景必须换哈希表记录"见过谁"，空间从 O(1) 变 O(n)。

**这就是"有序"给的红利：相邻性让"是否重复"退化成一次比较。**

## 坑点

::: warning 坑点
1. **不特判空数组**：`slow = 1` 起步，空数组时直接返回 1，错。**必须先 `if (nums.empty()) return 0;`**

2. **比较写成 `nums[fast - 1]`**：本题碰巧对，但语义弱。换题（如 80）就错。建议一开始就写 `nums[slow - 1]`。

3. **返回 `slow + 1`**：常见于"不变式没想清楚"。`[0, slow)` 的长度就是 `slow`。

4. **用 `nums.erase` 或 `set`**：违反"原地、O(1) 空间"的要求，虽然能过测试但面试会被追问。
:::

::: danger 易错
`fast` 和 `slow` 一起从 0 起步、用 `nums[slow - 1]` 比较 —— 这是**越界访问 `nums[-1]`**。在某些编译器/优化级别下不崩、读到垃圾值，程序继续跑但结果随机。这是典型的"本地能过、OJ 上偶发 WA"。
:::

## 变体与练习

| 变化 | 改什么 |
|---|---|
| 移除元素（[27](https://leetcode.cn/problems/remove-element/)） | 条件换成 `nums[fast] != val`，`slow` 从 0 起 |
| 每个最多保留 2 个（[80](https://leetcode.cn/problems/remove-duplicates-from-sorted-array-ii/)） | 比较 `nums[slow - 2]`，`slow` 从 2 起，**并补 `if (n <= 2) return n;`** |
| 移动零（[283](https://leetcode.cn/problems/move-zeroes/)） | 条件 `nums[fast] != 0`，末尾补零 |
| 有序数组的平方（[977](https://leetcode.cn/problems/squares-of-a-sorted-array/)） | 换成**对撞**指针，从两端往中间填 |
| 删除重复项但允许乱序 | 不再需要 `slow - 1` 的局部性，改用哈希 |

::: info 补充
这题的 `slow` / `fast` 模型可以推广到一大类问题：**"遍历全部输入，只保留满足条件的"**，且要求原地。只要你能写出"保留条件"，模板就是三行。

反过来，如果题目要求"删除后保持**所有**元素相对顺序且不能覆盖未读区"，仍然是这个模板 —— 关键在于 `slow <= fast` 这个不变式，它保证了安全性。
:::

下一个专题：[动态规划](/topics/dp/) —— 从"移动下标"跳到"填表"，思维方式的跨度比前三个专题都大。
