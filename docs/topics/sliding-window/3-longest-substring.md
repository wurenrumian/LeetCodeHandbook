---
title: 3 · 无重复字符的最长子串
---

# 3 · 无重复字符的最长子串

<ProblemMeta id="3" difficulty="中等" title="无重复字符的最长子串" :tags="['哈希表', '窗口计数', '同向双指针']" url="https://leetcode.cn/problems/longest-substring-without-repeating-characters/" />

::: params 滑动窗口
| 要素 | 本题取值 |
| --- | --- |
| 窗口维护 | `count[s[right]]++`，状态是"每个字符出现几次" |
| 非法条件 | 某个字符次数 > 1（只需检查刚进来的那个） |
| 答案更新 | `while` **之后**，此刻窗口必合法（求最长） |
:::

::: cheat 速查卡
- **什么时候用**：求"最长连续子串"且合法性只和窗口内容有关
- **核心不变式**：`[left, right]` 内**没有重复字符**；`left` 是"让窗口重新合法的最小位置"
- **一句话模板**：进来就 `count[c]++`，一旦超过 1 就 `while` 踢左边
- **复杂度**：时间 **O(n)**（`left` 和 `right` 各走一遍）、空间 **O(字符集)**
:::

## 题意重述

给一个字符串，找**不含重复字符**的最长连续子串的长度。

```
输入: s = "abcabcbb"
输出: 3        ← "abc"

输入: s = "bbbbb"
输出: 1        ← "b"

输入: s = "pwwkew"
输出: 3        ← "wke"（注意 "pwke" 是子序列不是子串）

输入: s = ""
输出: 0
```

第三个例子是在提醒你：**子串必须连续**。`p,w,w` 里的 `p` 和 `w` 中间隔了东西，不能拼起来用。

## 从朴素到滑窗

朴素：枚举所有子串起点和终点 O(n²)，每个再花 O(n) 判重 —— 太慢。

观察：如果 `s[left..right]` 已经有重复，那么**任何包含它的更长区间也一定有重复**。这个"单调性"就是滑窗的入场券：

- `right` 右移只会让重复更严重，不会变好
- `left` 右移只会让重复变少，不会变差

所以两个指针都只往右走，不用回头。

## 模板对照

::: compare 求最长的通用骨架 | 3 本题：填进非法条件
```cpp
// 求最长的通用骨架
int left = 0, best = 0;
for (int right = 0; right < n; ++right) {
    // 加入 s[right]
    while (/* 窗口不合法 */) {
        // 移除 s[left]; left++
    }
    best = max(best, right - left + 1);
}
```
```cpp
// 本题：填入非法条件 —— 有重复字符
int left = 0, best = 0;
array<int, 128> count{};   // 数组代替哈希
for (int right = 0; right < n; ++right) {
    ++count[s[right]];     // 1. 加入
    while (count[s[right]] > 1) {   // 2. 收缩
        // 只可能是新来的这个字符重复
        --count[s[left]];
        ++left;
    }
    best = max(best, right - left + 1);  // 3.
}
```
:::

改动只有两处：

1. **窗口状态**用 `array<int,128>` 而不是 `unordered_map` —— 字符集有限，数组更快且能避免哈希开销
2. **非法条件**写成 `count[s[right]] > 1` —— **只需要检查新加入的那个字符**，因为加入前窗口是合法的

第 2 点是个能省时间的观察，值得展开。

## 为什么只需要检查 `s[right]`

::: details 证明（可跳过，但值得看一次）

循环开始时，`[left, right)` 是合法的（无重复）。第 1 步只把 `s[right]` 加进去，所以**唯一可能超标的字符就是 `s[right]`**。其他字符的计数没变，不可能从 ≤1 变成 >1。

所以 `while` 的条件不需要写成"遍历所有字符看有没有 >1"，只需盯住 `s[right]`。

这也解释了为什么 `while` 一定能结束：`left` 追上 `right` 时窗口只剩 `s[right]` 一个字符，`count` 必定为 1，条件必然为假。
:::

## 完整可编译代码

```cpp
#include <algorithm>
#include <array>
#include <cassert>
#include <iostream>
#include <string>
using namespace std;

class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        array<int, 128> window{};   // ASCII 字符计数，值初始化为 0
        int left = 0;
        int best = 0;
        const int n = static_cast<int>(s.size());

        for (int right = 0; right < n; ++right) {
            ++window[s[right]];                  // 1. 右端字符入窗

            while (window[s[right]] > 1) {       // 2. 只剩它可能重复
                --window[s[left]];               //    左端字符出窗
                ++left;
            }

            best = max(best, right - left + 1);  // 3. 此刻窗口合法，取长度
        }
        return best;
    }
};

int main() {
    Solution sol;

    assert(sol.lengthOfLongestSubstring("abcabcbb") == 3);
    assert(sol.lengthOfLongestSubstring("bbbbb") == 1);
    assert(sol.lengthOfLongestSubstring("pwwkew") == 3);
    assert(sol.lengthOfLongestSubstring("") == 0);
    assert(sol.lengthOfLongestSubstring(" ") == 1);
    assert(sol.lengthOfLongestSubstring("au") == 2);
    assert(sol.lengthOfLongestSubstring("dvdf") == 3);      // "vdf"
    assert(sol.lengthOfLongestSubstring("abba") == 2);      // "ab" / "ba"
    assert(sol.lengthOfLongestSubstring("tmmzuxt") == 5);   // "mzuxt"

    cout << "all tests passed" << endl;
    return 0;
}
```

`"abba"` 和 `"dvdf"` 是这题的两个经典反例：

- `"abba"`：如果 `left` 只用"记录上次出现位置"的方式更新，遇到第二个 `b` 时 `left` 被推到 2，**紧接着**读到的 `a` 会把它拉回 1（因为 `a` 的上次位置更早）—— 窗口长度被算成 3，正确答案是 2。**`left` 绝不能往回退**，所以那个写法必须写 `left = max(left, lastSeen[c] + 1)`。
- `"dvdf"`：重复的是 `d`，但 `left` 要跳过的是 `d` 和中间那个 `v`，正确答案是 `"vdf"` 长度 3。

## 逐段拆解

::: semantics
| 字段 | 含义 | 在代码里怎么用 |
| --- | --- | --- |
| `left` | 窗口左端，**含** | 只在 `while` 里右移，永不回退 |
| `right` | 窗口右端，**含**（与二分不同！） | `for` 循环变量，每轮 +1 |
| `window[c]` | 字符 `c` 在当前窗口里出现的次数 | 加入 `++`、移除 `--`，恒 ≥ 0 |
| `window[s[right]] > 1` | 唯一可能的非法条件 | 因为入窗前窗口合法，只有新字符可能超标 |
| `right - left + 1` | 当前窗口长度 | 闭区间，必须 `+1` |
| `best` | 历史最长长度 | 每轮收缩后更新，只增不减 |
:::

### `left` 与 `right` 都是闭端点

这点和 [二分](/topics/binary-search/) 相反，很容易混：

| 场景 | 区间 | 长度 |
|---|---|---|
| 二分 | `[left, right)` 左闭右开 | —— |
| 滑动窗口 | `[left, right]` 双闭 | `right - left + 1` |

滑窗用双闭是因为 `right` 本身就是"当前正在处理的元素"，处理完即刻属于窗口。而二分里 `right` 常被当作"不包含的上界"，因为你要的是"还没检查的区域"。

**同一个变量名，两种语义 —— 所以每换一个专题，先确认端点的开闭。**

### `while` 而不是 `if`

```cpp
while (window[s[right]] > 1) { ... }
```

`if` 在这题**不够**，必须 `while`。

举 `"pwwkew"`：读到第二个 `w` 时窗口是 `[p,w,w]`，踢掉 `p` 之后 `count[w]` **还是 2** —— 一次收缩修不好，得继续踢 `w`。`if` 只收缩一次就收手，窗口仍然非法，`best` 就会算成 4（正确答案 3）。

::: danger 易错
用 `if` 替代 `while` 在这题上错得很隐蔽：`"pwwkew"` 返回 4、`"abba"` 返回 3、`"tmmzuxt"` 返回 6，全都比正确答案大 1。而它们恰恰是本题最常被举的几个例子。

随机用例实测（20 万组、字母表 1–4 个字符）：`while` 版与暴力解 **0 处不一致**，`if` 版 **65344 处不一致**。首个反例 `"ababbababa"`：`if` 版得 3，正确答案 2。
:::

真正能用 `if` 的是**定长窗口**（643、438）：长度固定时每轮进出各一个元素，条件不可能被连续违反。

### `left` 为什么不会退回到已经走过的位置

对比另一种常见写法 —— 记录每个字符的"上次出现下标"，然后 `left = max(left, lastSeen[c] + 1)`。

```cpp
// 另一种写法，不用 while，但必须取 max
int lastSeen[128];
fill(begin(lastSeen), end(lastSeen), -1);
for (int right = 0; right < n; ++right) {
    if (lastSeen[s[right]] >= left)
        left = lastSeen[s[right]] + 1;
    lastSeen[s[right]] = right;
    best = max(best, right - left + 1);
}
```

两种写法复杂度相同，但**心智模型不同**：

| 写法 | 窗口状态 | 需要额外注意 |
|---|---|---|
| 计数法（本文） | 完整的字符频次表 | 无 |
| 上次位置法 | 只记每个字符最后一次出现 | **`left` 必须取 `max`，否则会倒退** |

`lastSeen` 里存的是**全局**上次位置，可能比当前 `left` 还小（那个字符早就被踢出窗口了）。不做 `max` 就会把 `left` 拉回去，`"abba"` 就是专门抓这个的用例。

::: danger 易错
`left = lastSeen[c] + 1` **不加 max 是静默错误**：大部分用例能过，`"abba"` 这种会在第 4 个字符时把 `left` 从 2 退回 1，窗口长度算成 3（实际 2）。
:::

## 坑点

::: warning 坑点
1. **`while` 里忘了 `--window[s[left]]`**：只移动 `left` 不更新计数，`window[s[right]]` 永远 > 1 → **死循环**。

2. **`window` 没初始化**：`array<int,128> window;` 不写 `{}` 是未初始化，值是随机垃圾。必须 `window{}`。

3. **`s[right]` 当数组下标**：`char` 在部分平台有符号，非 ASCII 字符（如 UTF-8 字节）会变成负下标 → 越界。正确做法是把桶扩到 256、用 `unsigned char` 取值：

   ```cpp
   array<int, 256> window{};
   ++window[static_cast<unsigned char>(s[right])];
   ```

   **不要**用 `int(s[right]) & 0x7F` —— 它把 `0xC3` 和 `'C'` 都映射成 67，两个毫不相干的字符被当成同一个，判重直接失效，比越界更难查。也**不要**只加 `static_cast<unsigned char>` 却仍用 `array<int,128>`：`unsigned char` 范围是 0–255，`0xE4`（汉字首字节）是 228，照样越界。本题测试用例是 ASCII，但这是通用隐患。

4. **空串**：`n == 0` 时循环不进，返回 `0`，正确。别在循环前用 `s[0]` 初始化 `best = 1`。

5. **`right - left + 1` 写成 `right - left`**：`" "`（单个空格）会返回 0 而不是 1。
:::

## 变体与练习

| 变化 | 改什么 |
|---|---|
| 最多 k 个不同字符（[340](https://leetcode.cn/problems/longest-substring-with-at-most-k-distinct-characters/)） | 非法条件换成"不同字符数 > k"，`window` 减到 0 时要 `erase` |
| 最多 k 次替换（[424](https://leetcode.cn/problems/longest-repeating-character-replacement/)） | 非法条件 = `窗口长度 - 最多字符次数 > k` |
| 最小覆盖子串（[76](https://leetcode.cn/problems/minimum-window-substring/)） | 变成**求最短**，答案更新挪到 `while` 内 |
| 找所有字母异位词（[438](https://leetcode.cn/problems/find-all-anagrams-in-a-string/)） | 定长窗口，`if` 代替 `while` |
| 字符串里的所有单词（30） | 定长 + 按单词步长跳，窗口是"多个起点"的并行 |

::: info 补充
76 最小覆盖子串是滑窗的"毕业题"：它同时要求**最短**、**多字符计数**、**维护已满足的种类数**。写对 3 之后建议直接跳过去，那道题会暴露你在"答案更新时机"上的所有问题。
:::

下一个专题：[双指针](/topics/two-pointers/) —— 同样是两个下标往右，但那里讨论的是**原地修改**，多了一个"写指针"的概念。
