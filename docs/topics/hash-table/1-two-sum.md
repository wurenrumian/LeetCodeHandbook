---
title: 1 · 两数之和
---

# 1 · 两数之和

<ProblemMeta id="1" difficulty="简单" title="两数之和" :tags="['哈希表', '边遍历边记录', '补数']" url="https://leetcode.cn/problems/two-sum/" />

::: cheat 速查卡
- **什么时候用**：求和为定值的一对数，且要求**原下标**
- **核心不变式**：进入第 `i` 轮时，`seen` 里正好是 `nums[0..i-1]` 的「值 → 下标」
- **一句话模板**：先查 `target - nums[i]` 在不在，再把自己记进去
- **复杂度**：时间 **O(n)**（平均）、空间 **O(n)**
:::

## 题意重述

给定数组 `nums` 和目标值 `target`，找出**两个不同下标** `i < j` 使得 `nums[i] + nums[j] == target`，返回这两个下标。

```
输入: nums = [2, 7, 11, 15], target = 9
输出: [0, 1]        ← 2 + 7

输入: nums = [3, 2, 4], target = 6
输出: [1, 2]        ← 不能是 [0, 0]，因为 3 + 3 用了两次同一个 3

输入: nums = [3, 3], target = 6
输出: [0, 1]        ← 值相同但是两个不同下标，合法
```

第二个和第三个例子是同一个坑的两面：**同一个下标不能用两次，但值相同的两个下标可以。** 区别只在于下标，不在于值。

## 从朴素到最优

朴素解法是双层循环，外层定 `i`、内层扫 `j`：

```cpp
for (int i = 0; i < n; ++i)
    for (int j = i + 1; j < n; ++j)
        if (nums[i] + nums[j] == target) ...
```

盯着内层看，它每一轮做的事是同一个：**「`target - nums[i]` 在这个数组里吗」**。而这个答案和 `i` 无关，却被重算了 n 次。

关键转折就一句话：

> 把「已经检查过的元素」提前存进一张「值 → 下标」的表。内层循环消失，查表变成 O(1)。

于是每个元素只被访问一次，O(n²) 降到 O(n)。数组**有没有序、有没有重复、有没有负数，全都不影响**——这是哈希表相对二分的最大优势。

### 为什么不能「先排序再双指针」

数组题里「求和等于定值」的经典解法确实是[双指针](/topics/two-pointers/)：排序后 `left` 从左、`right` 从右，和大了右端左移，和小了左端右移，O(n) 时间 + O(1) 空间。

但这题有个额外要求：**返回原数组里的下标**。排序会打乱位置：

```
原数组: [7, 2, 11, 15]      答案下标 (0, 1)
排序后: [2, 7, 11, 15]      值 7 和 2 的位置变成了 1 和 0
```

排完序你手里只剩值和它「排序后的位置」，原来的下标丢了。

补救办法是把 `(值, 原下标)` 一起排。这样确实能做对，但代价变成 **O(n log n) 时间 + O(n) 空间**——慢了一档，还没省下空间。所以：

| 题目要求 | 该用什么 | 复杂度 |
|---|---|---|
| 返回下标（本题） | 哈希表 | O(n) 时间 / O(n) 空间 |
| 返回值、或数组本来就有序（[167](https://leetcode.cn/problems/two-sum-ii-input-array-is-sorted/)） | 双指针 | O(n) 时间 / O(1) 空间 |

**要不要排序，取决于「下标」是不是答案的一部分。** 这是本题唯一需要判断的地方，其余都是模板。

## 模板对照

::: compare 边遍历边记录：通用骨架 | 1 本题：need 是补数
```cpp
unordered_map<K, V> table;   // 键 → 值

for (int i = 0; i < n; ++i) {
    // ① 先查：need 由当前元素算出
    if (table.count(need))
        return 用 table 里的信息作答;

    // ② 后插：查完才登记自己
    table[key(i)] = i;
}
```
```cpp
unordered_map<int, int> seen;   // 值 → 下标

for (int i = 0; i < n; ++i) {
    int need = target - nums[i];

    auto it = seen.find(need);
    if (it != seen.end())
        return {it->second, i};

    seen[nums[i]] = i;
}
```
:::

两栏的骨架完全一样，本题只填了三处：`table` 的键值类型、`need` 怎么算、命中后返回什么。**这个「先查后插」的两行结构，是哈希表一半题目的全部内容。**

`find` 和 `count` 二选一即可。用 `find` 是因为命中时还要取 `it->second`（下标），少一次查找；左栏用 `count` 只是为了让「只问在不在」这层意思更清楚。只看存在性时 `count` 更直白。

## 完整可编译代码

```cpp
#include <algorithm>
#include <cassert>
#include <iostream>
#include <unordered_map>
#include <vector>

using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // 值 → 下标：只保存"已经走过"的元素
        unordered_map<int, int> seen;

        for (int i = 0; i < static_cast<int>(nums.size()); ++i) {
            int need = target - nums[i];

            // 第一步：查。need 必须来自更早的下标
            auto it = seen.find(need);
            if (it != seen.end()) {
                return {it->second, i};
            }

            // 第二步：插。查完才登记自己，所以不会自己匹配自己
            seen[nums[i]] = i;
        }

        // LeetCode 保证恰有一组解，这里只是让函数在所有路径上都有返回值
        return {};
    }
};

// 断言用：把答案排成升序，避免依赖实现返回的顺序
static vector<int> sortedPair(vector<int> ans) {
    sort(ans.begin(), ans.end());
    return ans;
}

int main() {
    Solution sol;

    {
        vector<int> nums{2, 7, 11, 15};
        assert(sortedPair(sol.twoSum(nums, 9)) == (vector<int>{0, 1}));
    }
    {
        vector<int> nums{3, 2, 4};
        assert(sortedPair(sol.twoSum(nums, 6)) == (vector<int>{1, 2}));
    }
    {
        // 重复值：两个 3 是不同下标，合法
        vector<int> nums{3, 3};
        assert(sortedPair(sol.twoSum(nums, 6)) == (vector<int>{0, 1}));
    }
    {
        // 单元素：同一元素不能用两次，必须无解
        vector<int> nums{3};
        assert(sol.twoSum(nums, 6).empty());
    }
    {
        // 空数组
        vector<int> nums{};
        assert(sol.twoSum(nums, 0).empty());
    }
    {
        // 值为 0：校验不能用 `seen[need]` 的真假来判断
        vector<int> nums{0, 4, 3, 0};
        assert(sortedPair(sol.twoSum(nums, 0)) == (vector<int>{0, 3}));
    }
    {
        // 补数恰好是下标 0 处的值，`if (seen[need])` 会漏掉它
        vector<int> nums{4, 4};
        assert(sortedPair(sol.twoSum(nums, 8)) == (vector<int>{0, 1}));
    }
    {
        // 负数
        vector<int> nums{-3, 4, 3, 90};
        assert(sortedPair(sol.twoSum(nums, 0)) == (vector<int>{0, 2}));
    }
    {
        // 和为负数
        vector<int> nums{-1, -2, -3, -4, -5};
        assert(sortedPair(sol.twoSum(nums, -8)) == (vector<int>{2, 4}));
    }
    {
        // 无解
        vector<int> nums{1, 2};
        assert(sol.twoSum(nums, 100).empty());
    }

    cout << "all tests passed" << endl;
    return 0;
}
```

`main` 里的 10 个断言，覆盖的是三种最容易出错的形状：

- **`[3]` + 6**：只查不插反了就会返回 `{0, 0}`
- **`[0, 4, 3, 0]` + 0 和 `[4, 4]` + 8**：用 `if (seen[need])` 判断存在性会漏掉「下标为 0」这一组
- **`[3, 3]` + 6**：值相同但下标不同，必须返回 `{0, 1}` 而不是空

## 逐段拆解

::: semantics
| 字段 | 含义 | 在代码里怎么用 |
| --- | --- | --- |
| `seen` | 「值 → **最近一次**出现的下标」，**只含已遍历部分** | 先查后写，命中的必然是更早那个，所以同值覆盖下标不影响正确性 |
| `key = nums[i]` | 元素的值 | 用值做 key，因为查表问的就是值 |
| `value = i` | 该值在**原数组**中的下标 | 命中时直接放进返回值，下标信息全程没丢 |
| `need = target - nums[i]` | 能和自己配对的补数 | 把「两数之和」翻译成「一个数是否存在」 |
| `seen.find(need)` | 查 need，不写入 | 返回迭代器，`end()` 表示不存在 |
| `it->second` | need 的原下标 | 恒小于 `i`，天然满足 `i < j` |
| `seen[nums[i]] = i` | 写入当前元素 | 放在 `find` 之后，这是「同一元素不能用两次」的唯一保证 |
| `return {}` | 空 vector | 兜底路径，题目保证不会走到 |
:::

### 顺序为什么是先查后插

把两行换个位置，代码还能跑，但语义就毁了：

```cpp
// 错误写法：先插后查
seen[nums[i]] = i;
if (seen.count(target - nums[i])) return {seen[target - nums[i]], i};
```

`target == 2 * nums[i]` 时，`need` 正好等于自己。此时表里已经有自己了，于是返回 `{i, i}` —— **同一个下标用了两次**。`nums = [3]`, `target = 6` 就会返回 `{0, 0}`，而正确答案是「无解」。

先查后插还有一个附带好处：每个下标对 `(i, j)` 只在 `j` 那一轮被检查一次，不可能重复计入。

::: info 循环不变式
「进入第 `i` 轮时，`seen` 恰好是 `nums[0..i-1]` 的值 → 下标映射」——这条不变式成立，上面所有结论都成立。写完哈希题先把这个句子说出来，比检查代码有用。
:::

### `count()` 和 `[]` 的区别：后者会偷偷写入

这是 C++ 哈希表最贵的一个坑。`unordered_map::operator[]` 的语义是：

> key 不存在 → **先插入** `mapped_type()`（int 就是 0），再返回它的引用。

所以 `if (seen[need])` 这一句干了三件事：查一次、可能插入一个脏数据、然后拿值当布尔用。两个后果都是静默的：

```cpp
unordered_map<int, int> seen;
if (seen[4]) { }          // 只是查了一下，seen 变成 {4: 0}
```

更糟的是「值为 0」正好和「不存在」撞车。`nums = [4, 4], target = 8`：轮到 `i = 1` 时 `need = 4`，表里 `seen[4] == 0`（下标 0 是合法的），但 `if (seen[4])` 得到 `0` → 判为不存在 → 返回空答案。

正确写法只有三种：

| 写法 | 是否插入 | 适合 |
|---|---|---|
| `seen.find(key) != seen.end()` | 否 | 命中后还要取值（本题） |
| `seen.count(key)` | 否 | 只问在不在 |
| `seen.at(key)` | 否，不存在会抛 `out_of_range` | 确定存在，想省一次判断 |

`operator[]` 只用在**确定要写入**的地方，也就是本题的 `seen[nums[i]] = i`。

### 重复元素为什么可以覆盖下标

`seen[nums[i]] = i` 在遇到重复值时，会把旧下标覆盖掉。这安全吗？

安全。题目只要**任意一组**解，而重复值只是给了更多可选的下标组合。早的下标在它自己那一轮已经查过了，晚的下标被记下来后，后续元素照样能配上。`[3, 3]` + 6 就是靠这个通过：`i = 0` 写入 `seen[3] = 0`，`i = 1` 查 `need = 3` 命中，返回 `{0, 1}`。

但如果题目要求「返回**所有**下标对」，就不能覆盖了 —— 值要做 key、下标列表要做 value，见下面的变体表。

## 坑点

::: warning 坑点
1. **先插后查 → 同一元素用两次**（对 `seen[nums[i]] = i` 和 `find` 这两行的顺序）。`nums = [3], target = 6` 会返回 `{0, 0}`。

2. **用 `if (seen[need])` 判断存在性**（对 `auto it = seen.find(need)` 那一行）。`operator[]` 会插入默认值 0，且「下标为 0」被当成 false。`nums = [4, 4], target = 8` 直接漏解。

3. **`int i` 与 `nums.size()` 混比**（对 `for` 那一行）。`nums.size()` 是 `size_t`（无符号），`i < nums.size()` 在空数组时不会出错，但把 `i` 声明成 `int` 又直接比较会触发 `-Wsign-compare`。统一 `static_cast<int>(nums.size())`。

4. **空数组**（对 `for` 那一行）。`n == 0` 时不进循环，直接返回 `{}`。所以循环**之前**不能访问 `nums[0]`，也不能假定一定进得去。

5. **`nums[i]` 是值、`i` 是下标，两者别混**（对 `return {it->second, i}` 那一行）。返回值要的是**下标**，不是值。写成 `return {nums[it->second], nums[i]}` 编译能过（都是 int），但返回的是数字本身而不是位置，OJ 直接 WA。这也是「排序 + 双指针」在本站行不通的同一个理由：那个解法手里只剩值。
:::

::: danger 易错
第 2 条是**静默出错**：代码不崩、不报错、大多数用例还能过，只有「目标下标恰好是 0」或「目标值恰好是 0」时才错。写完务必自己构造一个 `nums = [0, ...], target = 0` 的用例。
:::

## 变体与练习

| 变化 | 改什么 |
|---|---|
| 返回**所有**下标对 | 不 `return`，`seen` 改成 `unordered_map<int, vector<int>>`，每轮把 `need` 的所有下标都收下 |
| 数组已排序、返回值不返下标（[167](https://leetcode.cn/problems/two-sum-ii-input-array-is-sorted/)） | 丢掉哈希表，双指针 O(1) 空间 |
| 三个数之和（[15](https://leetcode.cn/problems/3sum/)） | 排序 + 固定一个 + 双指针；**不要用哈希**，去重会很别扭 |
| 设计一个支持 `add` / `find` 的数据流（[170](https://leetcode.cn/problems/two-sum-iii-data-structure-design/)） | `add` 时写表，`find` 时遍历表查 `value - key`，注意 `value / 2` 的自配对 |
| 允许同一元素用两次 | 把 `find` 和写入两行**换序**，就回到错误写法——不改题面别这么干 |
| 值域是 `0..n` 的小整数 | 用 `vector<int>` 当表，省掉哈希开销 |

::: details 为什么 15 三数之和不能用哈希表
哈希表能找出所有和为零的三元组，但**去重**很难：`[-1,0,1]` 和 `[0,-1,1]` 在下标层面不同，在答案层面是同一个。

双指针的写法是先排序，然后在固定第一个数时跳过相同值、在内层收缩时也跳过相同值——去重是「顺手」的。哈希表当然也能做对（把三元组排序后塞进 `set` 去重），但要在最外层再套一层归一化，代码更绕、常数更大。

**能力边界：哈希表擅长「找一个」，不擅长「枚举所有并去重」。**
:::

::: info 补充
这题和 [49 字母异位词分组](/topics/hash-table/49-group-anagrams) 是本专题的两个基本型：本题练「**边遍历边记录**」，49 练「**归一化 key 后分组**」。哈希表其余用法基本都是这两者的组合或变体。
:::
