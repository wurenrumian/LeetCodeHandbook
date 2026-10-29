---
title: 146 · LRU 缓存
---

# 146 · LRU 缓存

<ProblemMeta id="146" difficulty="中等" title="LRU 缓存" :tags="['双向链表', '哈希表', '设计题']" url="https://leetcode.cn/problems/lru-cache/" />

::: params 链表
| 要素 | 本题取值 |
| --- | --- |
| 指针怎么配 | `index` 存"`key` → `list` 迭代器"，一次哈希跳到节点；链表节点自带 `key` 和 `value`，链表顺序即使用顺序 |
| 断链顺序 | 先存 `it->second->first` / `->second`，再 `cache.erase(it->second)` 摘下，然后 `push_front` 挂头，最后回填 `it->second = cache.begin()` |
| 哨兵用在哪 | `std::list` 版不需要；手写双向链表版用 `head_` / `tail_` 两个哨兵夹住真节点，`unlink` 与 `pushFront` 因此不必判 `nullptr`、也不用特判头尾 |
:::

::: cheat 速查卡
- **什么时候用**：要"最近使用优先保留"的定长缓存，且 `get`/`put` 都必须 O(1)
- **核心不变式**：链表**头部是最近使用**，**尾部是最久未使用**；表里节点数恒 `<= capacity`
- **一句话模板**：哈希表存"键 → 链表迭代器"，命中就 `erase` + `push_front` 移到头部
- **复杂度**：时间 **O(1)** 每次操作、空间 **O(capacity)**
:::

## 题意重述

实现一个容量固定的 LRU（Least Recently Used，最近最少使用）缓存，支持两个操作：

- `get(key)`：键存在则返回值并把该键标记为**最近使用**；不存在返回 `-1`
- `put(key, value)`：写入/更新键值并标记为最近使用；若容量已满，**先淘汰最久未使用的键**再写入

两个操作都必须是 **O(1)**。

```
容量 = 2      缓存按「最近 → 最久」排

put(1, 1)            {1}          put 进头部
put(2, 2)            {2, 1}       2 变最近，1 变最久
get(1)   → 1         {1, 2}       访问 1，1 提到头部
put(3, 3)            {3, 1}       满，淘汰尾部 2
get(2)   → -1        {3, 1}       2 已被淘汰
put(4, 4)            {4, 3}       满，淘汰尾部 1
get(1)   → -1
get(3)   → 3
get(4)   → 4
```

第 4 行是全部难点所在：**`put(3,3)` 淘汰的是 2，不是 1**。因为 `get(1)` 把 1 提到了头部，尾部换成了 2。

所谓"最近使用"，指的是"最近被 `get` 或 `put` 碰过"，**不是"最近被 `put` 过"**。这也是 LRU 和 FIFO 的唯一区别 —— 只读的 `get` 也会改变淘汰顺序。

## 从朴素到最优

先想两个极端，它们各自满足一半要求：

| 结构 | `get` | 找最久未使用 | `put` 到满时删除 |
|---|---|---|---|
| `unordered_map<int,int>` | O(1) ✅ | **O(n)** 要扫描 | O(n) ❌ |
| 用一个 `vector<pair<int,int>>` 按使用顺序排 | **O(n)** 查找 ❌ | O(1) ✅（取第一个） | O(n) 删除要挪位 ❌ |

要同时满足 O(1)，必须**两件事各用一个结构，且互相能指到对方**：

> 哈希表负责"给我键，我立刻找到那个节点"；链表负责"按使用顺序排队，头尾都是 O(1) 可改"。

关键约束是**淘汰发生在尾部**，所以必须能 O(1) 拿到尾部、O(1) 摘掉任意节点。这直接决定了：

::: danger 易错
**必须是双向链表，单向链表做不到 O(1)。**

淘汰分两步：找到尾部节点，然后把它从链表里摘掉。第一步单向链表也能做（维护一个 `tail` 指针即可），**第二步才是问题**：

单向链表删除节点 `X`，必须改它的前驱 `prev->next`。而你手上只有 `X` —— 没有回头指针，找回前驱只能**从头再走一遍**，O(n)。

双向链表里 `X->prev` 就是前驱，`X->prev->next = X->next` 一行搞定。

**那能不能"存一份前驱指针到哈希表里"绕过去？** 能勉强绕，但很脆：任何节点被删除或移动，它后继节点的 `prev` 记录就失效了，你得连锁更新。字段一多，"谁该维护谁"就没人说得清。

所以面试里直接说"必须双向链表"，是正确且更省事的回答。
:::

第二个决定：**链表里存的节点必须自带 `key`**。

淘汰尾部节点时，你已经把它摘下来了 —— 但还得去哈希表里删掉对应的条目，而哈希表的 key 是原始 key。如果链表节点只有 `value`，此时你**已经不知道该删哈希表里的哪一项**。

所以节点结构是 `pair<key, value>` 或 `struct { int key, value; }`，两个字段都必须存。

## 模板对照

左边是**自己维护双向链表指针**的骨架，右边是 `std::list` 代劳的写法。两栏做的是同一件事：**摘下一个节点，挂到头部，更新索引**。

::: compare 手写双向链表：unlink + pushFront | std::list：erase + push_front
```cpp
// 哨兵 head_ / tail_ 夹住真节点
// 摘除：前驱和后继各改一次
void unlink(Node* node) {
    node->prev->next = node->next;
    node->next->prev = node->prev;
}

// 挂头：四个赋值，④ 必须最后
void pushFront(Node* node) {
    node->next = head_->next;
    node->prev = head_;
    // 原第一个节点认我为前驱
    head_->next->prev = node;
    head_->next = node;
}

// 移动 = unlink + pushFront
// 节点地址不变，索引不用改
```
```cpp
// list 迭代器只在节点销毁时失效
list<pair<int, int>> cache;
unordered_map<int,
    list<pair<int, int>>::iterator> index;

// 没有 move_to_front，只能删了再插
// 必须先把 key/value 拷出来
int value = it->second->second;
int key = it->second->first;
cache.erase(it->second);
cache.push_front({key, value});
// 旧迭代器已悬空，必须回填
it->second = cache.begin();
```
:::

两栏的差别在于**谁承担"改四根指针"的责任**：

| | 手写双向链表 | `std::list` |
|---|---|---|
| 摘除节点 | 自己写 `unlink`，4 个赋值 | `erase(it)` |
| 挂到头部 | 自己写 `pushFront`，4 个赋值 | `push_front(...)` |
| 节点地址 | **不变**（只改指针） | **变**（`erase` 销毁 + `push_front` 新建） |
| 索引要不要更新 | 不用，指针还有效 | **必须**回填 `index[key]` |

这解释了一个容易踩的坑：手写版"移动"节点时索引完全不用动，而 `std::list` 版必须回填。**两套代码混着写，就会出现索引指向已销毁节点的情况。**

::: tip 为什么不自己写节点
面试里手写双向链表是加分项（「变体与练习」末尾给了两个私有函数的完整实现），但**写 `std::list` 版本更快、更不容易错**，而且它的迭代器语义恰好符合需求 —— 这也是 C++ 面试官期待的写法。

关键要能讲清"为什么迭代器可以长期保存在 `index` 里"：`std::list` 是节点式容器，`erase` 只让**被删节点**的迭代器失效，其他节点的迭代器全部保持有效。换成 `vector` 或 `deque` 就完全不能用 —— 任何一次插入删除都可能让所有迭代器失效。
:::

### 为什么"移到头部"是 erase + push_front 两步

这是本题最反直觉的一处。

`std::list` **没有** `move_to_front` 这种 API。标准库里能同时改顺序的只有 `splice`，而 `splice` 在"同一个链表内部移动"时是 O(1) 的：

```cpp
cache.splice(cache.begin(), cache, it->second);
```

这行也能用，而且不需要重新建节点、也不改迭代器之外的东西。但 `splice` 移动后**迭代器仍然指向原来那个节点**（因为节点没被销毁），所以 `index[key]` 都不用更新 —— 看起来更香。

但它有两个问题：

1. **可读性差**：`splice` 的三个参数分别是"目标位置、源链表、源位置"，语义不直观，面试时很容易写错顺序
2. **它不是"通用模板"**：Java 的 `LinkedHashMap`、Python 的 `OrderedDict` 都没有对应操作，只有"删除 + 插入"是跨语言通用的

所以本页用 `erase` + `push_front`。**代价只有一个：`index[key]` 里存的迭代器失效了，必须手动更新。**

```cpp
int value = it->second->second;      // ① 先存 value
int movedKey = it->second->first;    // ② 再存 key
cache.erase(it->second);             // ③ 摘掉，此时 it->second 悬空
cache.push_front({movedKey, value}); // ④ 挂到头部，得到新节点
it->second = cache.begin();          // ⑤ 更新索引指向新位置
```

①②必须在③之前，因为③之后 `it->second` 指向的节点已经被销毁，读它就是 **heap-use-after-free**。

::: danger 易错
`cache.erase(it->second)` 之后 **`it->second` 不会变成 `end()`，也不会变成 `nullptr`**，它只是个**悬空迭代器**。此时读 `it->second->first` 不报错、不崩溃，读到的是已释放内存的残留值（通常看起来"还是对的"）。

这是本题最容易写成"能过样例但一开 sanitizer 就挂"的地方。养成习惯：**`erase` 之前把需要的东西全部拷到局部变量。**
:::

## 完整可编译代码

```cpp
#include <cassert>
#include <iostream>
#include <list>
#include <utility>
#include <unordered_map>

using namespace std;

class LRUCache {
public:
    explicit LRUCache(int capacity) : capacity_(capacity) {}

    int get(int key) {
        auto it = index.find(key);
        if (it == index.end()) return -1;   // 不存在，直接 -1

        // erase 会让 it->second 悬空，所以先把两个字段拷出来
        int value = it->second->second;     // ① value
        int movedKey = it->second->first;   // ② key

        cache.erase(it->second);            // ③ 从原位置摘下
        cache.push_front({movedKey, value}); // ④ 挂到表头 = 最近使用
        it->second = cache.begin();         // ⑤ 索引改指新节点

        return value;
    }

    void put(int key, int value) {
        auto it = index.find(key);

        if (it != index.end()) {            // 已有：改值 + 提到头部
            cache.erase(it->second);
            cache.push_front({key, value});
            it->second = cache.begin();
            return;
        }

        if (static_cast<int>(cache.size()) == capacity_) {
            // 满了，淘汰链表尾部（最久未使用）
            index.erase(cache.back().first); // 先从索引删，key 还在
            cache.pop_back();               // 再摘节点
        }

        cache.push_front({key, value});      // 新节点永远进头部
        index[key] = cache.begin();          // 记录它在链表里的位置
    }

private:
    int capacity_;
    // 头部 = 最近使用，尾部 = 最久未使用
    list<pair<int, int>> cache;              // pair<key, value>
    // 键 -> 该键在链表中的迭代器，一次哈希定位节点
    unordered_map<int, list<pair<int, int>>::iterator> index;
};

int main() {
    // 力扣官方样例
    {
        LRUCache cache(2);
        cache.put(1, 1);
        cache.put(2, 2);
        assert(cache.get(1) == 1);      // 1 变最近使用
        cache.put(3, 3);                // 满，淘汰 2
        assert(cache.get(2) == -1);
        cache.put(4, 4);                // 满，淘汰 1
        assert(cache.get(1) == -1);
        assert(cache.get(3) == 3);
        assert(cache.get(4) == 4);
    }
    // 容量 1：每次 put 新键都先把自己顶掉
    {
        LRUCache cache(1);
        cache.put(2, 1);
        assert(cache.get(2) == 1);
        cache.put(3, 2);
        assert(cache.get(2) == -1);
        assert(cache.get(3) == 2);
    }
    // 同一 key 重复 put：只改值，不能让表里多出一个节点
    {
        LRUCache cache(2);
        cache.put(1, 1);
        cache.put(1, 10);               // 覆盖，不是新增
        assert(cache.get(1) == 10);
        cache.put(2, 2);
        assert(cache.get(1) == 10);     // 1 被 get 提到头部
        cache.put(3, 3);                // 淘汰 2，不是 1
        assert(cache.get(1) == 10);
        assert(cache.get(2) == -1);
        assert(cache.get(3) == 3);
    }
    // 空缓存 get
    {
        LRUCache cache(3);
        assert(cache.get(42) == -1);
    }
    // 负数键值
    {
        LRUCache cache(2);
        cache.put(-1, -100);
        cache.put(0, 0);
        assert(cache.get(-1) == -100);
        cache.put(1, 1);                // 淘汰 0
        assert(cache.get(0) == -1);
        assert(cache.get(-1) == -100);
        assert(cache.get(1) == 1);
    }
    // 大量操作：容量 100，插 1000 个，只剩后 100 个
    {
        LRUCache cache(100);
        for (int key = 0; key < 1000; ++key) cache.put(key, key * 2);
        assert(cache.get(0) == -1);
        assert(cache.get(899) == -1);
        assert(cache.get(900) == 1800);
        assert(cache.get(999) == 1998);
    }

    cout << "all tests passed" << endl;
    return 0;
}
```

最后一个用例值得注意：插入 1000 个不同的键、容量只有 100，等价于反复淘汰 900 次。这时候如果淘汰逻辑有 bug（比如 `index.erase` 漏了），会留下 900 个**哈希表里有、链表里没有**的悬空迭代器，`get` 一碰即崩 —— 这是静态看代码最难发现的一类问题，必须靠大数据量跑一遍。

## 逐段拆解

::: semantics
| 字段 | 含义 | 在代码里怎么用 |
| --- | --- | --- |
| `capacity_` | 容量上限，构造时固定 | 只在 `put` 新增分支里比较 `cache.size()` |
| `cache` | 双向链表，存放 `pair<key, value>`，**顺序 = 使用时间** | 头部最近、尾部最久；`back()` 就是淘汰目标 |
| `pair::first` | 节点的 **key** | 淘汰时必须用它去删 `index` 里的条目 |
| `pair::second` | 节点的 **value** | `get` 的返回值 |
| `index` | `unordered_map<key, list 迭代器>` | 一次哈希从 key 直接跳到链表节点 |
| `it->second` | 那个迭代器本身 | 可作为 `erase`/`begin` 的返回值载体被**覆盖赋值** |
| `cache.begin()` | 链表头节点的迭代器 | 每次 `push_front` 后都要存回 `index` |
| `cache.back()` | 尾部节点**引用**（不是迭代器） | 取 `.first` 拿 key 去删索引 |
| `cache.size()` | 当前节点数 | 与 `capacity_` 比；转 `int` 避免无符号比较 |

:::

### `unordered_map<int, list<pair<int,int>>::iterator>` 这行怎么读

从右往左拆：

```
unordered_map<   键类型   ,   值类型                      >
                int          list<pair<int,int>>::iterator
```

- **键类型 `int`**：就是缓存对外暴露的 key
- **值类型是"迭代器"**，不是 `pair`、不是指针。这个迭代器指向 `cache` 里的某个节点，解引用一次得到 `pair<int,int>&`

所以 `index[key]->first` 是该键，`index[key]->second` 是该键的值。**注意这里出现了两层 `->`，但语义完全不同**：

| 写法 | 含义 |
|---|---|
| `index[key]` | 哈希表取出迭代器（`list<...>::iterator`） |
| `index[key]->first` | 解引用迭代器 → 链表节点的 key |
| `it->second` | `it` 是 `unordered_map` 的迭代器 → `.second` 就是那个 `list` 迭代器 |
| `it->second->second` | 先取 list 迭代器，再解引用 → 节点的 value |
| `it->second->first` | 先取 list 迭代器，再解引用 → 节点的 key |

`it->second->second` 里的两个 `second` 分别属于 `unordered_map` 和 `pair`，这是本题代码最难看懂的一行。理解了这一点，整段代码就没有黑魔法了。

::: tip 变量命名上的一个建议
`it` 在这个函数里始终是 **`unordered_map` 的迭代器**（`auto` 推导），而 `it->second` 才是 list 迭代器。写的时候心里默念"`it` 是索引表的位置，`it->second` 才是链表的位置"，就不会混。

如果想更清楚，可以把 `auto it = index.find(key);` 改名为 `auto found = ...`，本页保留 `it` 是为了和主流题解一致。
:::

### 为什么 `get` 里也要 `push_front`

`get` 只读不写，直觉上不该改结构。但 LRU 的定义是"**最近使用**"，而 `get` 就是一次使用。

所以 `get` 命中后必须把节点提到头部。**`get` 是唯一会"因为读操作而修改结构"的地方**，这也解释了为什么 LRU 缓存不是线程安全的 —— 即使是只读的 `get` 也会改链表（需要外部加锁）。

漏了这一步的后果，走一遍 `put(1,1); put(2,2); get(1); put(3,3);`：

| | `get(1)` 之后链表（头 → 尾） | `put(3,3)` 淘汰谁 |
|---|---|---|
| 正确 | `[1, 2]` | 尾部 = 2 ✅ |
| 漏了 `push_front` | `[2, 1]` | 尾部 = 1 ❌ |

漏掉之后，**删掉的是刚被访问过、正该保留的 1，留下的却是本该淘汰的 2**。一次遗漏同时造成两个错误：后面的 `get(1)` 返回 `-1`，`get(2)` 返回 `2`。

注意 `[2, 1]` 这个顺序：`put` 用的是 `push_front`，所以最后写入的 2 在**头部**，1 在**尾部**。别把头和尾记反 —— 头是最近，尾是最久。

### 淘汰时为什么先删索引再摘节点

```cpp
index.erase(cache.back().first);   // ① 用 key 删索引
cache.pop_back();                  // ② 再摘链表节点
```

反过来写：

```cpp
cache.pop_back();                  // ① 节点已销毁，key 没了
index.erase(???);                  // ② 拿不到 key 了
```

`pop_back()` 之后，那个节点的 `pair` 已经析构，`cache.back().first` 取到的是**新的尾部节点**的 key —— 于是你删错了索引项，同时留下一条"索引指向已销毁节点"的悬空记录。

实测容量 2、`put(1,1); put(2,2); put(3,3)` 之后：

| 现象 | 实际结果 |
|---|---|
| 链表（头 → 尾） | `3 2` —— 尾部的 2 被正确摘掉了 |
| `index` 里还有 key 1 吗 | **有**（1 已被淘汰，却还留着） |
| `index` 里还有 key 2 吗 | **没有**（2 还在链表里，索引却丢了） |
| `get(2)` | 返回 `-1`（错，应该是 2） |
| `get(1)` | **段错误**（索引里那个迭代器指向已销毁的节点） |

所以这个 bug 是**先静默出错、再崩**：`get(2)` 那个 `-1` 看起来像正常的"没这个键"，很难怀疑到淘汰逻辑上；等真的 `get(1)` 时才崩。

::: warning 坑点
`cache.size()` 返回 `size_t`（无符号）。直接写 `cache.size() == capacity_` 时，`capacity_` 是 `int`，会触发"有符号/无符号比较"警告（`-Wall -Wextra` 下会报），而且 `capacity` 为负时会静默错。

统一 `static_cast<int>(cache.size()) == capacity_`。本页代码在 `-Wall -Wextra` 下零警告，靠的就是这个转换。
:::

## 坑点

::: warning 坑点
1. **`erase` 后继续用迭代器**：`cache.erase(it->second)` 之后 `it->second` 悬空，读它就是 heap-use-after-free。必须在 `erase` 前把 `key`/`value` 拷到局部变量（对应 `get` 的第 ①② 行）。

2. **忘了更新 `index[key]`**：`erase` 之后 `push_front` 产生的是**新节点**，旧迭代器指向的那块内存已经销毁。漏掉 `it->second = cache.begin();` 之后，`index` 里留着悬空迭代器，下次 `get` 会对已销毁节点 `erase`（对应 `get` 的第 ⑤ 行、`put` 的两处）。

   这个 bug 在 **release 模式下几乎测不出来**：`erase` 释放的那块内存通常被紧接着的 `push_front` 复用，地址恰好撞上，于是 `get` 仿佛还"正常"（实测容量 3 连续 `get` 三次，返回值全对）。加上 `-D_GLIBCXX_DEBUG` 才立刻暴露：`Error: attempt to dereference a singular iterator.`

   `-fsanitize=address` 也能抓到 heap-use-after-free。**所以自检不能只靠"跑一遍样例"**，要开调试迭代器。

3. **淘汰顺序反了**：先 `pop_back()` 再 `index.erase(...)` 时拿不到被淘汰节点的 key，删错了索引项（对应 `put` 的淘汰分支）。

4. **重复 `put` 同一 key 当成新增**：会 `push_front` 一个重复节点，`index` 被覆盖到新节点，旧节点永远留在链表里但没人指向它 → **链表变长、容量失真、内存泄漏**。必须先 `find` 判断（对应 `put` 的 `if (it != index.end())`）。

5. **`get` 忘了移到头部**：缓存退化成 FIFO，淘汰的不是"最久未使用"而是"最早插入"（对应 `get` 里的 `push_front`）。

6. **用 `vector` 或 `deque` 代替 `list`**：它们的迭代器/引用在插入删除后可能全部失效，`index` 里存的东西立刻变成悬空。必须是节点式容器。

7. **`cache.size()` 与 `int` 比较**：无符号/有符号混比，`-Wextra` 下报警告，`capacity` 为负时结果静默错误。

8. **`cache.back()` 用在空链表上**：链表为空时 `back()` 是 **UB**，不是返回空值。代码里它只出现在 `cache.size() == capacity_` 的分支内，只要 `capacity >= 1` 就保证链表非空；但如果你自己允许 `capacity == 0`（有些变体题要求），那个分支就会在空链表上取 `back()` —— 容量 0 必须单独早退。
:::

::: danger 易错
第 1、2 条是本题**唯一真正的难点**，而且两者都表现为"**样例通过，压力测试崩**"或"**偶尔返回错值**"。

自检方法有两个，都得做一遍：

1. **大数据量压测**：容量 100、插入 1000 个不同键。每次淘汰都会让索引和链表各差一项，误差累积 900 次后必然暴露。
2. **开调试迭代器**：`g++ -D_GLIBCXX_DEBUG -fsanitize=address`。悬空迭代器在 release 下"看起来正常"，只有调试模式会立刻报 `singular iterator`。

只跑官方那 7 行样例、只用默认编译选项，是不够的。
:::

## 变体与练习

| 变化 | 改什么 |
|---|---|
| 手写双向链表（面试要求不用 `std::list`） | 加 `head`/`tail` 两个哨兵节点，写 `unlink(node)` 和 `pushFront(node)` 两个私有函数 |
| 改成 LFU（460） | 哈希表里再套一层"频次 → 该频次的链表"，淘汰频次最小的那一组的尾部 |
| 需要线程安全 | `get` 也改结构，所以读写都要持锁；或改成分段锁 |
| 需要 `O(1)` 遍历所有键 | 加一个 `vector` 记录所有 key（`list` 的迭代器稳定，可以放心存），淘汰时用 `swap` + `pop_back` 定位删除才是 O(1)；直接 `erase` 中间元素是 O(n) |
| 容量不固定，可动态调整 | 加 `resize(newCapacity)`，缩小容量时循环淘汰到符合大小 |
| 淘汰时不真删，只标记 | 变成 `Clock`/二次机会算法，`get` 时置访问位 |

::: info 补充
`unordered_map` 插入新键时可能触发 rehash，但**这不会影响 `index` 里存着的 list 迭代器**。要分清两种失效：

| 失效的是什么 | 何时失效 | 影响本题吗 |
|---|---|---|
| `unordered_map` 自己的迭代器 | rehash 时全部失效 | 不影响 —— 我们从不跨操作保存 map 迭代器 |
| 存为 `value` 的 `list::iterator` | 只有对应节点被 `erase` 才失效 | 影响，所以 `erase` 后必须回填 |

rehash 搬的是哈希桶的指针，桶里存的 `list::iterator` 值被原样复制到新桶 —— 它指向的还是链表里同一个节点，所以仍然有效。这是本题能用 `unordered_map + list::iterator` 这个组合的根本原因。
:::

::: details 手写双向链表版（面试白板可直接写）
用两个哨兵节点把"头尾特判"全部消掉，`unlink` 和 `pushFront` 各自只有四行，且**都不需要判断 `nullptr`**。

下面是私有部分的核心。注意它和 `std::list` 版有一个本质差别：**节点地址不变**，所以 `index_` 里存 `Node*` 之后，移动节点完全不用回填索引。

```cpp
struct Node {
    int key, value;
    Node* prev;
    Node* next;
    Node(int k, int v) : key(k), value(v), prev(nullptr), next(nullptr) {}
};

// 哨兵：head <-> ... <-> tail，真节点永远在两者之间
Node* head_;   // 最近使用侧
Node* tail_;   // 最久未使用侧

void unlink(Node* node) {
    node->prev->next = node->next;
    node->next->prev = node->prev;
}

void pushFront(Node* node) {
    node->next = head_->next;       // ① 先接后
    node->prev = head_;             // ② 再接前
    head_->next->prev = node;       // ③ 让后一个认回来
    head_->next = node;             // ④ 最后改哨兵
}
```

`unlink` 之所以能无条件执行，是因为**每个真节点都有前驱和后继**（最少也是两个哨兵）。这就是[专题总览](/topics/linked-list/)里说的"哨兵消掉头节点特判"。

四个赋值语句的顺序也不能乱：④必须最后，因为它会覆盖 `head_->next`，而①③都要先读到旧值。③ 必须在①之后，因为它要写 `node->next->prev`，而 `node->next` 是①刚设好的。

淘汰时：

```cpp
Node* victim = tail_->prev;      // 最久未使用（tail_ 是哨兵）
unlink(victim);
index_.erase(victim->key);       // 先删索引，节点里的 key 还在
delete victim;
```
:::

::: info 补充
这题之所以被归到"链表"专题而不是"设计"专题，是因为它的**全部难度都在双向链表的指针操作上**：`unlink` 四个赋值、`pushFront` 四个赋值，加上"先存后删"的顺序要求。

一旦你把这两个函数写对（并且不搞错 `prev`/`next` 的赋值方向），哈希表那部分几乎是免费的。反过来说，这题写不出来，通常就是 `unlink` 里少写了一行 `node->next->prev = ...`。

下一站如果还想练链表，[206 反转链表](/topics/linked-list/206-reverse-list) 的递归版讲透了"返回值语义"，可以作为对照。
:::
