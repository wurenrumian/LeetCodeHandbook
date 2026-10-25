# 滑动窗口 · 模板与变体

滑动窗口本质是**双指针的一个特例**，但值得单独拎出来，因为它的模板固定到"背下来就能改"的程度。

一句话原理：

> `right` 负责把新元素**放进来**，`left` 负责在窗口不合法时**踢出去**。两个指针都只往右走，所以总共只扫一遍。

## 能用滑动窗口的三个前提

缺一个就退化成 O(n²) 甚至直接错：

| 前提 | 说明 | 反例 |
|---|---|---|
| 连续子段 | 求的是子串/子数组，不是子序列 | 300 最长递增子序列 |
| 端点单调 | `right` 右移后，若窗口非法，只需 `left` 右移就能修复 | 求"和恰好等于 k"要前缀和+哈希 |
| 可增量维护 | 加入/移除一个元素能 O(1) 更新窗口状态 | 窗口内求中位数 |

::: warning 坑点
**"求恰好等于"通常不能滑窗。** 因为 `left` 右移会让和变小，你可能"错过"目标。滑窗擅长的是**"最长/最短的满足某单调条件的窗口"**，比如"最多包含 k 个不同字符"、"和不小于 target 的最短子数组"。
:::

## 通用模板（求最长）

```cpp
// 求满足条件的最长窗口
int left = 0;
int best = 0;
unordered_map<char, int> window;   // 窗口状态的载体，按题目换

for (int right = 0; right < static_cast<int>(s.size()); ++right) {
    // 1. 把 s[right] 加入窗口
    window[s[right]]++;

    // 2. 只要窗口不合法，就收缩左端
    while (/* 窗口不合法 */) {
        // 从窗口移除 s[left]
        window[s[left]]--;
        left++;
    }

    // 3. 此刻窗口一定合法，更新答案
    best = max(best, right - left + 1);
}
```

第 3 步的位置是**这个模板的核心**：它在 `while` 之后，所以 `[left, right]` 一定是合法的。写在外面就错了。

### 求最短的改法

求最短时，`while` 条件反过来，答案在 `while` **里面**更新：

```cpp
for (int right = 0; right < n; ++right) {
    // 1. 加入
    while (/* 窗口合法 */) {
        // 2. 先更新答案 —— 此刻是合法窗口
        best = min(best, right - left + 1);
        // 3. 再收缩，试着更短
        // 移除 s[left]; left++;
    }
}
```

::: danger 易错
最长模板的更新在 `while` **外**，最短模板的在 `while` **内**。这两处搞反不会报错、不会死循环，只会**答案小一点/大一点** —— 最难查的那类 bug。

记法：**"最短"要在一个已经合法的窗口上求 `min`，所以必须在收缩前；"最长"要在收缩后的最大合法窗口上求，所以在收缩后。**
:::

## 变体索引

### 变体 1：哈希表计数（[3](/topics/sliding-window/3-longest-substring)）

窗口状态是"每个字符出现几次"。非法条件 = 某字符次数 > 1。

```cpp
unordered_map<char, int> count;
while (count[s[right]] > 1) {
    count[s[left]]--;
    left++;
}
```

### 变体 2：定长窗口（643 / 1456）

窗口长度固定为 `k`，不需要 `while`，`right` 每走一步就同时踢掉 `right - k`。

```cpp
for (int right = 0; right < n; ++right) {
    sum += nums[right];
    if (right >= k - 1) {
        best = max(best, sum);
        sum -= nums[right - k + 1];   // 保证窗口长度恒为 k
    }
}
```

注意是 `if` 不是 `while` —— 长度固定时每轮最多踢一个。

### 变体 3：数组代替哈希（76 / 438）

字符集小（ASCII 128 或 26 个字母）时，用定长数组代替 `unordered_map`：

```cpp
array<int, 128> need{}, have{};   // 比哈希快一个数量级
int satisfied = 0;                // 已满足的字符种类数
```

维护 `satisfied` 而不是每次比较整个数组，是把"判断合法"从 O(字符集) 降到 O(1) 的关键。

### 变体 4：单调队列优化（239 滑动窗口最大值）

窗口要维护"最大值"，但最大值被踢掉后需要知道"次大值" —— 普通变量做不到，要上**单调队列**。

```cpp
deque<int> dq;   // 存下标，值单调递减
for (int right = 0; right < n; ++right) {
    while (!dq.empty() && nums[dq.back()] <= nums[right]) dq.pop_back();
    dq.push_back(right);
    if (dq.front() <= right - k) dq.pop_front();   // 过期的从队首扔
    if (right >= k - 1) ans.push_back(nums[dq.front()]);
}
```

## 坑点汇总

::: warning 坑点
1. **答案更新时间点**：最长的在收缩后，最短的在收缩前。见上面的 `danger` 块。
2. **`right - left + 1` 别写成 `right - left`**：这是区间长度，闭区间要 `+1`。
3. **窗口计数减到 0 要不要删 key**：用 `unordered_map` 时，`count[c] == 0` 的残留 key 会让 `map.size()` 不可信。如果要靠 `size()` 判断"不同字符数"，必须 `erase`。
4. **`while` 写成 `if`**：定长窗口用 `if` 没问题，可变长窗口必须 `while` —— 一次加入可能让窗口连续非法多次（比如 1004 题连续多个 0）。
:::

## 自检清单

- 窗口状态是不是能用"加一个、减一个"增量维护？
- 非法条件是不是"`left` 右移后一定变好"？如果可能变差，就不能滑窗。
- 更新答案那一行，在 `while` 的哪一侧？
