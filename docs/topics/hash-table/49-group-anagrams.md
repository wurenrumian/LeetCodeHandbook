---
title: 49 · 字母异位词分组
---

# 49 · 字母异位词分组

<ProblemMeta id="49" difficulty="中等" title="字母异位词分组" :tags="['哈希表', '归一化 key', '计数编码']" url="https://leetcode.cn/problems/group-anagrams/" />

::: cheat 速查卡
- **什么时候用**：把一堆元素按「某种意义下相同」分组，且这种相同能算成一个**签名**
- **核心不变式**：`groups[key]` 这个桶里的所有串，互为字母异位词
- **一句话模板**：算签名 → `groups[key].push_back(str)` → 最后把桶倒出来
- **复杂度**：计数编码时间 **O(n·(k + 26))**、排序版 **O(n·k log k)**，空间都是 **O(n·k)**
:::

## 题意重述

给定字符串数组 `strs`，把**字母异位词**（字符组成完全相同、只是顺序不同）分到同一组。返回所有组，顺序不限，组内顺序也不限。

```
输入: strs = ["eat","tea","tan","ate","nat","bat"]
输出: [["bat"],["nat","tan"],["ate","eat","tea"]]

输入: strs = [""]
输出: [[""]]

输入: strs = ["a"]
输出: [["a"]]
```

后两个例子容易被当成凑数，其实它们在测同一件事：**空串也必须算得出签名，并且自成一桶**。如果签名构造里藏着「至少一个字符」的隐含假设（例如拿 `str[0]` 当 key），空串不仅算不出签名，还会和所有非空串一起落到某种「无效」路径上。

## 从朴素到最优

朴素做法：外层遍历每个串，内层回头找「第一个和它互为异位词的已分组串」，用 242 题的计数比较来判断。

```text
for 每个串 s:
    for 已分好的每个组 g:
        if 是异位词(s, g[0]): 放进 g; break
```

时间复杂度 O(n² · k)。瓶颈不在判断异位词（那个只要 O(k)），而在**内层那趟线性查找**——又是在反复回答「和 `s` 等价的桶，之前建过吗」。

所以还是同一个替换：把桶按 key 存进哈希表，内层查找变成一次哈希。

关键转折只有一句：

> **把「互为异位词」翻译成「签名相等」。** 签名是字符串，签名相同 → 同一组。

于是问题拆成两半：

1. **归一化**：给每个串算签名（本题唯一的难点）
2. **分组**：`unordered_map<string, vector<string>>`，签名当 key，原串进桶（机械操作）

## 两种签名

签名怎么造，是本题唯一需要判断的地方。两种做法都能过，区别全在「算一次 key 花多少」。

### 签名 A：排序后的字符串

字符组成相同 ⟺ 排序后完全相同。所以直接把串排序，结果就是签名。

```text
"eat" → "aet"
"tea" → "aet"     ← 同一个 key
"tan" → "ant"
"bat" → "abt"
```

代价是每个串排一次序：O(k log k)。实现只有两行，**面试时先写这个**。

### 签名 B：26 位计数编码

异位词的字符**计数向量**必然相同。把 26 个计数拼成一个串当 key，代价 O(k + 26)。

**但不能直接把数字连起来。** 计数可以是两位数，拼接会产生歧义：

```text
count = (a:1,  b:11)  →  拼接 "111"
count = (a:11, b:1)   →  拼接 "111"     ← 撞了！这两串并不是异位词
```

必须带分隔符：`"#1#11"` 和 `"#11#1"`，或者用固定宽度补零。

### 两个签名怎么选

| | 排序字符串 | 计数编码 |
|---|---|---|
| 单个串代价 | O(k log k) | O(k + 26) |
| 总时间 | O(n·k log k) | O(n·(k + 26)) |
| 代码量 | 3 行 | 8 行，要处理分隔符 |
| 字符集无关 | ✅ 任何字符都能排 | ❌ 要预先知道字母表大小 |
| 常数 | `sort` 对小串极快 | 26 次 `to_string`，**与 `k` 无关** |

::: tip 交叉点：k 十几到几十之间
实测 10 万个随机串、`-O2`，**每个串算一次 key** 的平均耗时（纳秒/串）。下表是一台机器上的结果：

| 串长 `k` | 排序版 | 计数版 | 谁快 |
|---|---|---|---|
| 1 | 4 | 168 | 排序，约 40 倍 |
| 5 | 33 | 142 | 排序，约 4 倍 |
| 10 | 83 | 155 | 排序，约 1.9 倍 |
| 20 | 252 | 157 | **计数，约 1.6 倍** |
| 50 | 837 | 169 | **计数，约 5 倍** |
| 100 | 1930 | 182 | **计数，约 10 倍** |
| 1000 | 19200 | 674 | **计数，约 28 倍** |

**绝对数字不要当基准照搬。** 换一台机器（编译器、CPU、libstdc++ 版本不同）整体会差 1–2 倍，交叉点也会浮动 —— 在另一台机器上复测，交叉点落在 `k ≈ 30–40`，`k=20` 时反而排序版更快。要相信的是**趋势**：

原因很直白：计数版的成本由**固定 26 次** `to_string` + 字符串增长支配，`k` 从 1 涨到 100 时几乎不动（168 → 182）；排序版是 `k log k`，随 `k` 稳稳往上爬。所以**短串用排序、长串用计数**，交叉点在 `k` 十几到几十之间，随硬件浮动。

结论不受影响：`k ≤ 100`（力扣本题的约束）时两者差距不到一个数量级，两种都能过；`k` 上千时计数版压倒性胜出。

本题 `k ≤ 100`，稳在计数版更快的区间，所以下面的完整代码用计数编码；但面试现场写，**排序版只有两行，先写它更划算**——`k ≤ 100` 时两者都在微秒级，不会有性能问题。

计数编码真正不可替代的场合是**流式**比较：[438 找到所有变位词](https://leetcode.cn/problems/find-all-anagrams-in-a-string/)，窗口进出时 `+1 / -1` 增量维护计数，O(1) 更新；排序做不到增量，每滑一步都要重排。
:::

## 模板对照

::: compare 签名 A：排序归一化 | 签名 B：计数编码（需分隔符）
```cpp
// key = 排序后的串
unordered_map<string, vector<string>> groups;

for (const string& str : strs) {
    string key = str;
    sort(key.begin(), key.end());

    // 首次访问自动建空 vector
    groups[key].push_back(str);
}
```
```cpp
// key = 26 个计数，带 '#'
unordered_map<string, vector<string>> groups;

for (const string& str : strs) {
    array<int, 26> count{};
    for (char ch : str)
        ++count[ch - 'a'];

    string key;
    for (int n : count) {
        key += '#';
        key += to_string(n);
    }

    groups[key].push_back(str);
}
```
:::

两栏的**分组动作一模一样**，只有「怎么算 `key`」不同。这也说明分组题的模板是：

```text
算 key → 用 key 存 → 倒出来
```

换题目只换中间那一步。49 的难点全在 key，不在哈希表。

## 完整可编译代码

```cpp
#include <algorithm>
#include <array>
#include <cassert>
#include <iostream>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

using namespace std;

class Solution {
public:
    vector<vector<string>> groupAnagrams(vector<string>& strs) {
        // key = 26 个字母的计数编码，value = 该组的所有原串
        unordered_map<string, vector<string>> groups;
        groups.reserve(strs.size() * 2);   // 减少 rehash，只是提示

        array<int, 26> count{};
        for (const string& str : strs) {
            // count 复用，每个串开始前必须清零
            count.fill(0);
            for (char ch : str) {
                ++count[ch - 'a'];
            }

            // 编码：每段前面加 '#'，否则 1,11 和 11,1 会撞
            string key;
            key.reserve(26 * 4);
            for (int n : count) {
                key += '#';
                key += to_string(n);
            }

            // 这里的 operator[] 是"要的就是插入空 vector"
            groups[key].push_back(str);
        }

        // 把桶倒出来：move 走，避免整组字符串深拷贝
        vector<vector<string>> answer;
        answer.reserve(groups.size());
        for (auto& entry : groups) {
            answer.push_back(std::move(entry.second));
        }
        return answer;
    }
};

// 签名 A：排序字符串作 key，用来和上面互相对照
vector<vector<string>> groupBySortedKey(const vector<string>& strs) {
    unordered_map<string, vector<string>> groups;

    for (const string& str : strs) {
        string key = str;
        sort(key.begin(), key.end());
        groups[key].push_back(str);
    }

    vector<vector<string>> answer;
    for (auto& entry : groups) {
        answer.push_back(std::move(entry.second));
    }
    return answer;
}

// 断言用：组内排序 + 组间排序，消掉 unordered_map 的不确定顺序
static vector<vector<string>> normalize(vector<vector<string>> groups) {
    for (auto& group : groups) {
        sort(group.begin(), group.end());
    }
    sort(groups.begin(), groups.end());
    return groups;
}

int main() {
    Solution sol;

    {
        vector<string> strs{"eat", "tea", "tan", "ate", "nat", "bat"};
        vector<vector<string>> expected{{"bat"}, {"nat", "tan"}, {"ate", "eat", "tea"}};
        assert(normalize(sol.groupAnagrams(strs)) == normalize(expected));
        assert(normalize(groupBySortedKey(strs)) == normalize(expected));
    }
    {
        // 空串：签名里全是 0，能正常归组
        vector<string> strs{"", ""};
        vector<vector<string>> expected{{"", ""}};
        assert(normalize(sol.groupAnagrams(strs)) == normalize(expected));
    }
    {
        // 空串和单字符不能混为一组
        vector<string> strs{"", "a"};
        vector<vector<string>> expected{{""}, {"a"}};
        assert(normalize(sol.groupAnagrams(strs)) == normalize(expected));
    }
    {
        // 单元素
        vector<string> strs{"a"};
        vector<vector<string>> expected{{"a"}};
        assert(normalize(sol.groupAnagrams(strs)) == normalize(expected));
    }
    {
        // 空输入：循环不进，返回空
        vector<string> strs{};
        assert(sol.groupAnagrams(strs).empty());
    }
    {
        // 每个串都自成一组
        vector<string> strs{"ab", "cd", "ef"};
        vector<vector<string>> expected{{"ab"}, {"cd"}, {"ef"}};
        assert(normalize(sol.groupAnagrams(strs)) == normalize(expected));
    }
    {
        // 完全相同的串要落进同一组
        vector<string> strs{"abc", "abc"};
        vector<vector<string>> expected{{"abc", "abc"}};
        assert(normalize(sol.groupAnagrams(strs)) == normalize(expected));
    }
    {
        // 计数跨两位数：拼接不带分隔符时这两串的 key 都是 "111"
        vector<string> strs{"abbbbbbbbbbb", "aaaaaaaaaaab"};
        auto answer = sol.groupAnagrams(strs);
        assert(answer.size() == 2);          // 不是异位词，必须两组
    }
    {
        // 同长度的长串，只差一个字符的计数分布
        vector<string> strs{"aaab", "aabb", "abbb", "baaa"};
        auto answer = sol.groupAnagrams(strs);
        assert(answer.size() == 3);          // {aaab,baaa} {aabb} {abbb}
    }

    cout << "all tests passed" << endl;
    return 0;
}
```

最后的「两位数计数」用例值得单独说：`"abbbbbbbbbbb"` 的计数是 `(1, 11)`，`"aaaaaaaaaaab"` 是 `(11, 1)`。如果把计数直接连成字符串，两者的 key 都是 `"111"` → **会被错分到同一组**。加分隔符后变成 `"#1#11"` 和 `"#11#1"`，立刻分开。这个断言就是为了钉死这一点。

## 逐段拆解

::: semantics
| 字段 | 含义 | 在代码里怎么用 |
| --- | --- | --- |
| `groups` | `键 → 该组的原串列表` | 桶的数量 = 最终答案的行数 |
| `key` | 归一化签名，**等价关系的判据** | 同 key 即同组；构造方式决定复杂度 |
| `count` | `array<int, 26>`，每个字母出现次数 | 循环外复用，**每轮必须 `fill(0)`** |
| `ch - 'a'` | 字母映射到 `0..25` | 假设只有小写字母，字符集变了要改 |
| `groups[key]` | 首次访问插入空 `vector`，再返回引用 | 这是本题唯一**应该**用 `operator[]` 的地方 |
| `push_back(str)` | 原串入桶，**不做任何修改** | 存的是原串，不是签名 |
| `reserve` | 桶数提示 | 减少 rehash，不影响正确性 |
| `std::move(entry.second)` | 把整个 `vector<string>` 搬走 | 省掉所有字符串的深拷贝 |
:::

### `operator[]` 在这里为什么是对的

[1 两数之和](/topics/hash-table/1-two-sum) 里我把 `operator[]` 列为头号坑点，这里却主动用了。区别在**意图**：

| | 两数之和 | 49 |
|---|---|---|
| `map[key]` 的语义 | 「这个值存在吗」 | 「把这个串放进它那组」 |
| 想让它插入吗 | ❌ 插入就是 bug | ✅ 空桶本来就没有，必须建 |
| 正确写法 | `find` / `count` | `groups[key].push_back(...)` |

一句话：**`operator[]` 用于「确定要写」，`find` / `count` 用于「只想问」。** 用反了就是两数之和那个静默漏解的坑。

如果出于洁癖想避开 `[]`，等价写法是：

```cpp
auto [it, inserted] = groups.try_emplace(key);
it->second.push_back(str);
```

`try_emplace` 只在 key 不存在时构造空 vector，语义更明确，但多一层解包，面试时没必要。

### 嵌套结构 `unordered_map<string, vector<string>>` 怎么用

这个类型的读法是从里往外：

```text
vector<string>                     一组异位词
unordered_map<string, vector<...>> 签名 → 一组
```

它带来三个便利，也有一个代价：

**便利 1：自动建桶。** `groups[key]` 不需要 `if (!groups.count(key)) groups[key] = {};`，`operator[]` 已经做了。

**便利 2：引用在 rehash 后依然有效。** 所以下面这种写法是安全的：

```cpp
auto& group = groups[key];   // 先拿到引用
groups[other].push_back(str); // 触发 rehash
group.push_back(str2);        // group 仍然有效
```

因为 `unordered_map` 的元素是**独立节点**，rehash 只重挂桶的链表，节点本身不搬家。这一点和 `vector` 完全相反——`vector` 扩容会把元素整体搬走。

::: warning 但迭代器会失效
rehash 会让**迭代器**失效（不只是 `end()`，全部）。所以「一边遍历 `groups` 一边插新 key」是 UB：

```cpp
for (auto& entry : groups)        // entry 是引用，取引用不失效
    groups[entry.first + "!"];    // ← 触发 rehash，range-for 的迭代器炸了
```

先收集 key 到 `vector`，循环结束后再插。本题没有这个需求，但改成「合并相似组」时立刻会遇到。
:::

**便利 3：一次哈希拿到整组。** 不需要「先查 key 在哪、再按下标访问容器两次」。

**代价：value 是容器，拷贝很贵。** `answer.push_back(entry.second)` 会把每个字符串都复制一遍，n 个串就是 n·k 字节。所以完整代码里写 `std::move(entry.second)`——`groups` 用完就丢，没必要留。

### 为什么不边分组边排序组内元素

如果题目要求组内字典序（LeetCode 这题不限），有两条路：

| 做法 | 代价 |
|---|---|
| 每 `push_back` 完一个组就 `sort` | 会被反复排序，O(n·k log k) 起 |
| 全部倒出来后，对每个组排一次 | 每组 O(m log m)，总共 O(n log n) 级别 |

**先收齐，再排序**。同理，要求组间按首元素排序时，也是最后对 `answer` 排一次，而不是指望 `unordered_map` 的遍历顺序——它不保证任何顺序。

## 坑点

::: warning 坑点
1. **key 拼接不带分隔符**（对 `key += '#';` 这两行）。`(1,11)` 和 `(11,1)` 都编成 `"111"`，两个不同的组被合并。这是**静默错误**，普通用例全过，只有计数跨两位数时才炸。

2. **`count` 忘记清零**（对 `count.fill(0);` 那一行）。`array<int,26> count{}` 只在构造时清零一次，之后每个串沿用上一个串的计数 → 所有串的 key 都带着累积误差。

3. **`count[ch - 'a']` 越界**（对 `++count[ch - 'a'];` 那一行）。如果串里出现大写字母或数字，`ch - 'a'` 是负数或 ≥ 26，`array` 不做检查 → UB。字符集变了就换 `array<int, 256>` 并直接用 `ch` 当下标。

4. **想用 `vector<int>` 当 key**（对 `groups` 的声明）。`unordered_map<vector<int>, ...>` **编译不过**——标准库没给 `vector` 提供 `std::hash`。要么编码成 `string`，要么自己写哈希器。

5. **边遍历 `groups` 边插新 key**（对最后倒桶的 `for` 循环）。rehash 让迭代器全部失效，UB。本题的循环只做 `move`，是安全的。

6. **空输入**（对 `for (const string& str : strs)`）。`strs` 为空时不进循环，`groups` 为空，返回到空 `answer`。所以循环**之前**不能访问 `strs[0]`。
:::

::: danger 易错
第 1 条是最典型的「不报错但答案错」。它甚至不会让结果变少——两个不同的组被合并成一个更大的组，`answer.size()` 只在小用例上才看得出来。

写完必须自己造一对「计数跨两位数」的串来试：`"abbbbbbbbbbb"` 和 `"aaaaaaaaaaab"`（前 1 后 11，前 11 后 1）。
:::

::: details 另外两种编码方式
**固定宽度补零**：`key += to_string(1000 + n).substr(1);`，每段恒 3 位。要求先知道计数的上界（`k ≤ 999`）。

**字节打包**（最快，但要有上界意识）：

```cpp
string key(26, '\0');
for (int i = 0; i < 26; ++i) {
    key[i] = static_cast<char>(count[i]);   // 要求 count[i] <= 255
}
```

26 字节定长，无分隔符也不会歧义，`std::hash<string>` 按长度 + 内容哈希，内嵌 `'\0'` 完全没问题。前提是单个字母出现次数不超过 255——本题 `k ≤ 100` 满足，但换个题就不一定，**用之前先确认约束**。
:::

## 变体与练习

| 变化 | 改什么 |
|---|---|
| 只判断两个串是否互为异位词（[242](https://leetcode.cn/problems/valid-anagram/)） | 不需要 map：两个 `array<int,26>` 相减，全 0 即真 |
| 组内要字典序、组间要稳定顺序 | `unordered_map` 换 `map`（自动按 key 排），或最后统一 `sort` |
| 不区分大小写 | 计数前 `tolower(ch)`，字母表仍是 26 |
| 字符集含全部 ASCII | `array<int, 256>`，下标直接用 `ch` |
| 找所有变位词子串的起点（[438](https://leetcode.cn/problems/find-all-anagrams-in-a-string/)） | 固定长度[滑动窗口](/topics/sliding-window/)，窗口进出时增量改计数，O(1) 更新 |
| 按「字符计数向量」分组但顺序也算区别 | 完全不同的题：直接拿 `str` 当 key，一趟 `set` 去重即可 |
| 最长连续序列（[128](https://leetcode.cn/problems/longest-consecutive-sequence/)） | 换 `unordered_set`：只从「没有前驱」的数起跳，每次 O(n) 总代价 |
| 分组结果要能增量更新（数据流） | 保留 `groups` 不丢，新串算 key 后 `push_back` 即可，别每次重算 |

::: info 补充
49 和 1 的分工很清晰：

- **1 两数之和**：key 是**现成的**（补数），难点在「先查后插」的时序
- **49 字母异位词分组**：时序是机械的，难点在**怎么造出 key**

所有哈希表题都落在这条轴上——要么难在时序，要么难在签名。两者都难的题很少，遇到就先分开处理。

下一站可以看 [1 两数之和](/topics/hash-table/1-two-sum) 对齐「先查后插」，或者回到[专题总览](/topics/hash-table/)看四类容器的取舍。
:::
