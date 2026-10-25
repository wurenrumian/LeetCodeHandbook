# 链表 · 指针操作与哨兵

链表题的难点**从来不是算法**。

反转、合并、删除、找环 —— 这些题的思路往往一句话就说完。真正让你在面试里写崩的，是这样一个瞬间：你写下 `cur->next = pre;`，然后发现**再也找不到原来 `cur->next` 指向的那个节点了**，后面半条链表凭空消失。

所以这个专题只练一件事：

> **每次动指针之前，先问自己"我接下来还要用到哪些指针"。要用的，先存进局部变量。**

本文把这些"必须保存什么"整理成三张操作模板，再加上一个能消掉几乎所有特判的技巧 —— 哨兵节点。

## 一条铁律：先存 next，再改指针

链表的节点只能**单向**访问。`cur->next` 一旦被你改成别的值，原来的后继就没人指向了 —— 那块内存还在，但**除了它不是任何人能走到的地方**。这就是"断链"。

```cpp
// 错：改完就断链，原后继彻底失联
cur->next = pre;        // 原后继的地址被覆盖
cur = cur->next;        // 读到的其实是 pre，往回走了
```

```cpp
// 对：先存、再改、最后前进
ListNode* next = cur->next;   // ① 存档原后继
cur->next = pre;              // ② 动手掉头
pre = cur;                    // ③ pre 追上当前节点
cur = next;                   // ④ 用存档前进
```

四行里每一步都在依赖上一步的结果，这就是"轮转"这个词的含义。③④ 的顺序尤其不能反：`pre` 必须先追上 `cur`，`cur` 才能跳走 —— 否则 `pre` 会落在上上个节点上。

::: danger 易错
"改指针前先存"这条错了**不会崩**，也不会报错 —— 它只是在链表后半段留下一个谁都走不到的区域。程序正常退出，`assert` 却对不上，然后你只能靠打印整条链表来定位。

写链表题，**每改一次 `->next` 就把 `next` 链读进 `vector<int>` 打一遍**，比盯着代码找错快十倍。
:::

## 哨兵节点：消掉头节点特判

链表最烦的地方是**头节点没有前驱**。于是几乎所有操作都要分两套写：

```cpp
// 没有哨兵：删除头节点要单独处理
if (head != nullptr && head->val == target) {
    ListNode* victim = head;
    head = head->next;        // 只有这里能改 head
    delete victim;
} else {
    // 剩下的走"改前驱的 next"那套
}
```

加一个**假的头节点**，让真头也拥有前驱，两套逻辑立刻合并成一套：

```cpp
ListNode dummy(0, head);       // 栈上分配，不 new，不用 delete
ListNode* pre = &dummy;

while (pre->next != nullptr) {
    if (pre->next->val == target) {
        ListNode* victim = pre->next;
        pre->next = victim->next;   // 真头和中间节点走同一条路径
        delete victim;
    } else {
        pre = pre->next;
    }
}
return dummy.next;             // 真头可能已经被删了
```

三步固定套路：**建哨兵 → 指针从哨兵出发 → 返回 `dummy.next`**。

::: tip 为什么哨兵要放栈上
`ListNode dummy(0, head);` 是局部对象，函数返回时自动析构，不需要 `delete`。用 `new ListNode(...)` 建哨兵就得记得释放，而哨兵往往在 `return` 处被忘掉 —— 这是链表题最常见的内存泄漏来源。
:::

哨兵能消掉的四类特判：

| 场景 | 没有哨兵 | 有哨兵 |
|---|---|---|
| 删除头节点 | 必须改 `head` | `pre->next = ...` 一视同仁 |
| 在头部插入 | 必须改 `head` 并 `return` 新头 | 插在 `dummy` 后面就是插在头部 |
| 合并两条链表 | 第一个节点要单独挑 | 谁小接谁，从 `dummy` 开始接 |
| 返回结果 | 要判断 `head` 是否被删空 | 恒 `return dummy.next` |

**判断要不要用哨兵，只看一条：这个操作会不会修改头节点指针本身。** 会，就用。

## 三种基本操作

所有链表题都是这三件事的组合。先把它们各自"必须保存哪几个指针"记死。

| 操作 | 必须保存 | 关键语句的顺序 | 写反了会怎样 |
|---|---|---|---|
| 遍历 | 只读时 `node` 一个就够；要删当前节点时要 `pre` | 先读值，再前进 | 先前进 → 跳过一个节点 |
| 插入 | `pre`（插入位置的前驱） | `node->next = pre->next;` 然后 `pre->next = node;` | 先改 `pre->next` → 新节点接不上原后继，后半截丢失 |
| 删除 | `pre`（前驱）、`victim`（`= pre->next`） | `pre->next = victim->next;` 然后 `delete victim;` | 先 `delete` → 拿不到 `victim->next`，而且在已释放内存上取值是 UB |

### 遍历

```cpp
// 只读：一个指针足够
for (ListNode* node = head; node != nullptr; node = node->next) {
    // 用 node->val
}
```

```cpp
// 边遍历边删：必须用 pre->next 判断，不能先前进
ListNode* pre = &dummy;
while (pre->next != nullptr) {
    if (pre->next->val == target) {
        eraseAfter(pre);          // 删完 pre 不动，因为它后面换了新人
    } else {
        pre = pre->next;          // 只有不删时才前进
    }
}
```

这两种写法的差别是链表删除的核心：**用 `pre->next` 当"当前节点"看，删掉它以后 `pre` 原地不动，下一个候选自动补位。** 如果你用 `cur` 直接看当前节点，删完就得自己想办法把 `cur` 挪到下一个，很容易漏。

### 插入

```cpp
// 在 pre 之后插入 value，返回新节点
ListNode* insertAfter(ListNode* pre, int value) {
    ListNode* node = new ListNode(value);
    node->next = pre->next;    // ① 新节点先接住原后继
    pre->next = node;          // ② 前驱再指向新节点
    return node;
}
```

① 和 ② 换过来，`pre->next` 已经被覆盖成 `node`，于是 `node->next = pre->next` 实际是 `node->next = node` —— **新节点指向自己，原后继整段失联**。实测两节点链表 `2 → 3` 插入头节点 `1`，结果是：

```
1 → 1        （node->next 就是 node 自己）
```

而 `2`、`3` 已经没有任何指针指向它们了。

`insertAfter(&dummy, x)` 就是"插在头部"，不需要任何特判 —— 这是哨兵的第二个好处。

### 删除

```cpp
// 删除 pre 之后的那个节点
void eraseAfter(ListNode* pre) {
    ListNode* victim = pre->next;   // ① 先抓住要删的
    pre->next = victim->next;       // ② 前驱跨过它
    delete victim;                  // ③ 最后才释放
}
```

③ 必须在 ② 之后。先 `delete` 再读 `victim->next` 是**访问已释放内存**，在 OJ 上经常"看起来能跑"，一开 `-fsanitize=address` 就报 heap-use-after-free。

::: warning 坑点
删除操作还有两个隐蔽错误：

1. **只移动指针，忘了 `delete`** —— 在 LeetCode 上完全没问题（判题只看链表结构），在真实项目里就是内存泄漏
2. **只 `delete`，忘了改前驱的 `next`** —— 前驱还指着已释放的内存，下一次遍历直接踩野指针

本站代码统一保留 `delete`，并且严格按 ①②③ 的顺序写。
:::

## 快慢指针的三个用途

`slow` 每次一步，`fast` 每次两步。三个用途，模板骨架只差几行。

### 用途 1：找中点

```cpp
ListNode* middleNode(ListNode* head) {
    ListNode* slow = head;
    ListNode* fast = head;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
    }
    return slow;
}
```

节点数 5 时返回第 3 个；节点数 4 时返回第 **3** 个（靠后的中点）。

想取**靠前**的中点（比如 148 排序链表要在这里断开），在条件里再加一层 `fast->next->next != nullptr`，让 `fast` 提前一轮停下：

| 循环条件 | 5 个节点 | 4 个节点 | 用在哪 |
|---|---|---|---|
| `fast && fast->next` | 第 3 个 | 第 **3** 个（靠后） | 234 回文（后半段起点） |
| `fast && fast->next && fast->next->next` | 第 3 个 | 第 **2** 个（靠前） | 148 排序（要在中点前断开） |

`while` 里两个条件的顺序也不能换：`fast != nullptr && fast->next != nullptr`，短路求值保证先判空再解引用。写成 `fast->next != nullptr && fast != nullptr` 时，`fast` 为空会直接崩。

### 用途 2：判环

```cpp
bool hasCycle(ListNode* head) {
    ListNode* slow = head;
    ListNode* fast = head;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return true;
    }
    return false;                  // fast 走到头，说明没环
}
```

快指针每轮比慢指针多走一步，所以**一旦进环，两者距离每轮缩短 1，必然相遇**。没环时 `fast` 先到 `nullptr`，循环干净退出。

### 用途 3：找环入口

相遇之后，让一个指针从 `head` 重新出发，另一个从相遇点出发，**同速前进**，再次相遇的位置就是入口：

```cpp
ListNode* detectCycle(ListNode* head) {
    ListNode* slow = head;
    ListNode* fast = head;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) {
            ListNode* walker = head;
            while (walker != slow) {          // 同速，必在入口相遇
                walker = walker->next;
                slow = slow->next;
            }
            return walker;
        }
    }
    return nullptr;
}
```

::: details 为什么从 head 出发一定在入口相遇？
设 `head` 到入口距离 `a`，入口到相遇点距离 `b`，环长 `b + c`（`c` 是相遇点绕回入口的距离）。

相遇时慢指针走了 `a + b`，快指针走了 `a + b + (b + c)`，且快是慢的两倍：

```
2(a + b) = a + b + b + c   →   a = c
```

`a = c` 的意思是：**从 head 走到入口的距离，等于从相遇点走到入口的距离**。所以两个指针同速出发，走完各自这段就同时到达入口。
:::

## 坑点汇总

::: warning 坑点
1. **改指针前没存 `next`**：`cur->next = pre` 之后原后继彻底失联，链表后半段静默消失。每条 `->next = ` 赋值之前都问一遍"还有谁要用旧的 `cur->next`"。

2. **删除时忘了改前驱的 `next`**：只 `delete victim` 不改指针，`victim` 的内存被释放了但前驱还指着它 → 野指针，访问即 UB。

3. **空链表 / 单节点**：`while (cur->next != nullptr)` 在空链表上直接崩（`cur` 是 `nullptr`）。循环条件里凡是要解引用指针的，先用哨兵或先判空。

4. **`while` 条件里两个判空的顺序**：`fast->next != nullptr && fast != nullptr` 会崩，必须先判 `fast`。短路求值是靠**从左到右**的顺序保证安全的。

5. **`delete` 之后继续用指针**：`delete victim;` 之后 `victim->next` 是 UB，不是 `nullptr`。要么先存 `next`，要么调整语句顺序。

6. **返回 `head` 而不是新头**：反转、删除头、合并之后，`head` 可能已经不在头部了。统一 `return dummy.next` 或 `return newHead`。

7. **递归版忘记 `head->next = nullptr`**：见 [206](/topics/linked-list/206-reverse-list) 的递归部分，后果是造出一个环 —— 程序不崩，但任何遍历都会死循环。

8. **内存泄漏**：`delete` 漏写、哨兵用 `new` 建了没释放、函数中途 `return` 时跳过了清理。LeetCode 完全不查这个（判题只看链表结构），所以**必须靠自觉**。写完搜一遍每个 `new` 是否都有对应的 `delete`。
:::

## 自检清单

写完一段链表代码，按顺序问：

1. 每一次 `->next = ` 之前，旧的 `->next` 还有没有人要用？用的话存了吗？
2. 这段代码在**空链表**上会怎样？在**单节点**上会怎样？
3. 会不会修改 `head` 本身？会的话，用哨兵了吗？
4. 每一条 `new` 都有对应的 `delete` 吗？（OJ 不查，但要有）
5. 返回值是"新头"还是"原 `head`"？改过头节点的话，原 `head` 已经不是头了。
6. 有没有可能形成环？（判环题除外）

六个问题过一遍，链表题基本不会写错 —— 因为它们全都不是"思路"问题，全是"指针细节"问题。

## 本专题题目

| 题 | 难度 | 练什么 |
|---|---|---|
| [206 · 反转链表](/topics/linked-list/206-reverse-list) | 简单 | 三指针轮转、递归返回值语义 —— 整个专题的地基 |
| [146 · LRU 缓存](/topics/linked-list/146-lru-cache) | 中等 | 双向链表 + 哈希表，O(1) 删除与定位 |

::: info 和其他专题的联系
- 快慢指针在数组上的用法见 [双指针 · 26](/topics/two-pointers/26-remove-duplicates)，那里的 `slow`/`fast` 是"写指针/读指针"，链表上是"走一步/走两步"，共用同一组变量名但语义不同。
- LRU 的"哈希表 + 有序结构"组合，和 [滑动窗口](/topics/sliding-window/) 里"哈希表 + 窗口"是同一类思路：用一张表换来 O(1) 的定位。
:::
