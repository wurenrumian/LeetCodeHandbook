---
title: 206 · 反转链表
---

# 206 · 反转链表

<ProblemMeta id="206" difficulty="简单" title="反转链表" :tags="['指针操作', '三指针', '递归']" url="https://leetcode.cn/problems/reverse-linked-list/" />

::: params 链表
| 要素 | 本题取值 |
| --- | --- |
| 指针怎么配 | `prev` 指向已反转段的头、`curr` 指向待处理段的头，两者恒差一步；`next` 只是每轮临时存档 `curr->next` |
| 断链顺序 | 先 `ListNode* next = curr->next;` 存档，再 `curr->next = prev;` 掉头，最后 `prev = curr; curr = next;` |
| 哨兵用在哪 | 算法本身不用哨兵（`prev` 初值 `nullptr` 就是新尾）；只有测试辅助 `build()` 里用 `ListNode dummy` 省掉头节点特判 |
:::

::: cheat 速查卡
- **什么时候用**：要把整条链表的**方向**掉过来，或按 "后进先出" 的角度处理链表
- **核心不变式**：`prev` 左边（含 `prev`）已全部反转完毕，`curr` 右边（含 `curr`）是原始未动的部分
- **一句话模板**：存 `next` → 掉头 → `prev` 追上 `curr` → `curr` 用 `next` 前进
- **复杂度**：时间 **O(n)**、空间 **O(1)**（迭代）／ **O(n)** 栈深（递归）
:::

## 题意重述

给定单链表头节点，把整条链表反向，返回**新的头节点**。

```
输入: 1 → 2 → 3 → 4 → 5
输出: 5 → 4 → 3 → 2 → 1

输入: 1 → 2
输出: 2 → 1

输入: []
输出: []
```

三个例子的考点不同：

1. 第一个是常规情况，检验三指针有没有轮转对
2. 第二个是**最短的非平凡情况**：只有两个节点，循环只走两轮。很多赋值顺序的 bug 在这个长度上才暴露得最干净
3. 第三个是**空链表**：必须原样返回 `nullptr`，不能崩

注意题目要的是**新头**。这是本题第一个坑：反转完，原来的 `head` 变成了尾巴，`return head` 是错的。

## 从朴素到最优

如果允许开新链表，题目会变得毫无难度：正序遍历一遍，把每个节点**头插**到新链表里 —— 头插天然就是逆序。

但题目要求**原地反转**，代价是必须原地改 `->next`。而原地改指针有一个不可回避的冲突：

> 你要把 `curr->next` 改成指向前驱，但改完之后，**你就再也找不到原来的后继了**。

所以整个算法的全部内容，就是**在改指针之前把后继存进一个局部变量**。这就是下面"三指针"命名的来源 —— 除了 `prev` 和 `curr`，你还必须有个地方放那个即将被覆盖的后继。

用递归看会更清楚：`reverse(head->next)` 之后，后段已经整体反好了，`head->next` 恰好是后段的**尾**，让这个尾反过来指向 `head`，再把 `head` 自己断开就完成了。递归和迭代只是把同一件事换了个遍历方向。

## 模板对照

左边是迭代骨架，右边是递归骨架。两边的共同点是**"先处理完后面，再动自己这条指针"**，只是时间顺序相反。

::: compare 迭代：三指针轮转 | 递归：先反后段再接自己
```cpp
// prev = 已反转部分的头
// curr = 待处理部分的头
ListNode* prev = nullptr;
ListNode* curr = head;
while (curr != nullptr) {
    ListNode* next = curr->next;
    // ① 存档：后继还在 next 里
    curr->next = prev;
    // ② 掉头
    prev = curr;
    // ③ prev 追上 curr
    curr = next;
    // ④ 用存档前进
}
return prev;
// curr 为空时 prev 是新头
```
```cpp
// 返回：反转后的新头
// 语义：整条链已经反好
ListNode* reverse(ListNode* head) {
    if (head == nullptr ||
        head->next == nullptr)
        return head;
    // 后段反好，newHead 是最终新头
    ListNode* newHead =
        reverse(head->next);
    // head->next 现在后段的尾
    head->next->next = head;
    // 自己成为新尾，断开
    head->next = nullptr;
    return newHead;
}
```
:::

两边的 `head`/`curr` 都只被用来"指向当前待处理的节点"，但**它们对后继的依赖方式不同**：

- 迭代版：`curr` 的后继必须在改指针**之前**读出来，所以需要第三个变量 `next`
- 递归版：不需要存后继，因为 `head->next` 这个字段本身在递归返回到自己这一层时**还没被改过**，可以直接用

这就是递归版看起来更短的原因：它把"存后继"这件事交给了调用栈。

### 迭代版为什么要四步，不能三步

四行代码，每一行都在为下一行准备数据。少任何一步，要么编译不过，要么逻辑失效：

| 删掉 | 后果（都实测过，`1→2→3→4→5`） |
|---|---|
| `ListNode* next = curr->next;` | `next` 未定义，编译失败。真正的陷阱是**想省掉它、把最后一行的 `next` 换成 `curr->next`** —— 见下面 |
| `curr->next = prev;` | 指针根本没反转。走完返回 `prev` = 原最后一个节点 `5`，但它的 `next` 是 `nullptr` → 结果只剩 `{5}` |
| `prev = curr;` | `prev` 永远停在 `nullptr`，每轮都把当前节点的 `next` 清空 → 返回值是 `nullptr`，整条链表报废 |
| `curr = next;` | `curr` 原地不动，条件永远为真 → **真正的无限循环** |

注意 ③ 和 ④ 的先后：`prev` 必须先移到 `curr` 当前位置，`curr` 才能跳走。如果先 `curr = next` 再 `prev = curr`，两者会指向同一个节点（详见坑点第 3 条）。

::: danger 易错
"用 `curr->next` 代替 `next`" 这个错误 **编译通过、不崩溃、不死循环**，只是结果悄悄变成只有一个节点。

走一遍 `1→2→3`：

| 步骤 | `curr->next = prev` 后 | `prev = curr` 后 | `curr = curr->next` 后 |
|---|---|---|---|
| 1 | `1.next = nullptr` | `prev = 1` | `curr = 1.next = nullptr` |

**循环跑了 1 轮就退出了**，返回值 `prev = 1`，得到 `{1}`。原链表 2、3 全部失联。

这个错误和 `return head` 的症状**一模一样**（都是只返回一个节点），所以只看输出根本分不清是哪一个错了 —— 必须靠断点或打印中间变量。
:::

::: warning 坑点
**循环条件写 `curr->next != nullptr` 而不是 `curr != nullptr`。**

这是本题最高频的错误。`curr->next` 在 `curr == nullptr` 时就是空指针解引用，直接段错误；而且即使不崩，它也会**漏掉最后一个节点** —— 最后一个节点的 `next` 是 `nullptr`，循环条件在它还该被处理时就退出了。

正确的退出条件是 `curr == nullptr`，此时 `prev` 恰好指向原链表的最后一个节点，也就是新头。
:::

### 递归版的两个关键点

**第一点：返回值语义是"新头"。**

```cpp
ListNode* newHead = reverseListRecursive(head->next);
```

这行之后，`head->next` 往后的整段已经反好了，`newHead` 是那一段的**头**（也就是整条链表的最终新头）。这个值在本层**不能改**，一路原样往上传。

很多人在这里犯的错是 `return head;` —— 因为"我处理的是 `head`"。但 `head` 现在是新链表的**尾**，返回它等于只返回了一个节点。

**第二点：`head->next = nullptr;` 不能省。**

反转完最后一步，`head` 变成了新链表的尾巴。但此时 `head->next` 还指着后段的原头（现在被反到后面去了），于是：

```
1 → 2 → 3
```

反转到 `head = 1` 这一层时，`head->next`（= 2）已经是后段的尾了。执行 `2->next = 1` 之后，`1->next` 仍然指着 2 —— **形成一个 1 ↔ 2 的环**。

程序不会崩，`cout` 打印会挂住，`assert` 比对数会死循环。这是典型的**静默错误**：

::: danger 易错
递归反转漏掉 `head->next = nullptr` 时，只有**长度为 1 的链表**能侥幸"看起来对"（因为 `head->next` 本来就是 `nullptr`，走的是递归出口）。长度 >= 2 时必然成环，且错误被推迟到"遍历结果"那一步才暴露，看代码很难发现。

判断方法：递归版写完，先手动走一遍 `1 → 2` 这个两节点用例。
:::

## 完整可编译代码

```cpp
#include <cassert>
#include <iostream>
#include <numeric>
#include <vector>

using namespace std;

struct ListNode {
    int val;
    ListNode* next;
    ListNode() : val(0), next(nullptr) {}
    explicit ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode* next) : val(x), next(next) {}
};

class Solution {
public:
    // ---------- 迭代版 ----------
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;   // 已反转部分的头；初始为空
        ListNode* curr = head;      // 待处理部分的头

        while (curr != nullptr) {
            // 第 1 步：先存后继，这是"改指针前必须存档"的唯一体现
            ListNode* next = curr->next;
            // 第 2 步：掉头，此时 curr->next 被覆盖
            curr->next = prev;
            // 第 3 步：prev 追上 curr
            prev = curr;
            // 第 4 步：curr 用存档前进
            curr = next;
        }
        // 循环退出时 curr 为空，prev 是原链表的最后一个节点 = 新头
        return prev;
    }

    // ---------- 递归版 ----------
    ListNode* reverseListRecursive(ListNode* head) {
        // 递归出口：空表 或 单节点表，反转后还是自己
        if (head == nullptr || head->next == nullptr) {
            return head;
        }

        // 先把 head 之后的整段反好，拿到最终的新头
        ListNode* newHead = reverseListRecursive(head->next);

        // 此时 head->next 是后段的尾（原第二个节点），让它反过来指向自己
        head->next->next = head;
        // 自己变成新尾，必须断开旧指针，否则 1 <-> 2 成环
        head->next = nullptr;

        // newHead 全程不变，一路原样上传
        return newHead;
    }
};

// ---------- 测试辅助：用 vector 建表 / 读表，避免手写一堆 new ----------
ListNode* build(const vector<int>& values) {
    ListNode dummy;                  // 哨兵：省掉"第一个节点"的特判
    ListNode* tail = &dummy;
    for (int value : values) {
        tail->next = new ListNode(value);
        tail = tail->next;
    }
    return dummy.next;
}

vector<int> toVector(ListNode* head) {
    vector<int> values;
    for (ListNode* node = head; node != nullptr; node = node->next) {
        values.push_back(node->val);
    }
    return values;
}

void destroy(ListNode* head) {
    while (head != nullptr) {
        ListNode* next = head->next;   // 先存再删
        delete head;
        head = next;
    }
}

int main() {
    Solution sol;

    // ===== 迭代版 =====
    {
        ListNode* head = build({1, 2, 3, 4, 5});
        head = sol.reverseList(head);
        assert((toVector(head) == vector<int>{5, 4, 3, 2, 1}));
        destroy(head);
    }
    {
        ListNode* head = build({1, 2});                     // 最短非平凡用例
        head = sol.reverseList(head);
        assert((toVector(head) == vector<int>{2, 1}));
        destroy(head);
    }
    {
        ListNode* head = build({7});                        // 单节点
        head = sol.reverseList(head);
        assert((toVector(head) == vector<int>{7}));
        destroy(head);
    }
    {
        ListNode* head = build({});                         // 空链表
        head = sol.reverseList(head);
        assert(head == nullptr);
        destroy(head);
    }
    {
        ListNode* head = build({-3, 0, 0, -3});             // 重复值 + 负数
        head = sol.reverseList(head);
        assert((toVector(head) == vector<int>{-3, 0, 0, -3}));
        destroy(head);
    }

    // ===== 递归版：同样五组用例 =====
    {
        ListNode* head = build({1, 2, 3, 4, 5});
        head = sol.reverseListRecursive(head);
        assert((toVector(head) == vector<int>{5, 4, 3, 2, 1}));
        destroy(head);
    }
    {
        ListNode* head = build({1, 2});                     // 两节点是递归漏断指针的重灾区
        head = sol.reverseListRecursive(head);
        assert((toVector(head) == vector<int>{2, 1}));
        destroy(head);
    }
    {
        ListNode* head = build({7});
        head = sol.reverseListRecursive(head);
        assert((toVector(head) == vector<int>{7}));
        destroy(head);
    }
    {
        ListNode* head = build({});
        head = sol.reverseListRecursive(head);
        assert(head == nullptr);
        destroy(head);
    }
    {
        ListNode* head = build({-3, 0, 0, -3});
        head = sol.reverseListRecursive(head);
        assert((toVector(head) == vector<int>{-3, 0, 0, -3}));
        destroy(head);
    }

    // ===== 长链表：100000 个节点，验证迭代版 O(1) 空间 =====
    {
        vector<int> values(100000);
        iota(values.begin(), values.end(), 1);              // 1, 2, ..., 100000
        ListNode* head = build(values);
        head = sol.reverseList(head);
        assert(head->val == 100000);
        assert(head->next->val == 99999);
        destroy(head);
    }

    cout << "all tests passed" << endl;
    return 0;
}
```

`iota` 来自 `<numeric>`，所以上面显式包含了它。长链表那个用例**故意只跑迭代版**：它验证的是迭代版的空间是真正的 O(1)，10 万节点不额外占内存。

::: info 补充
LeetCode 上 206 的节点数上限是 5000，递归版在这个约束下完全能过。但递归深度等于链表长度，**8MB 默认栈大约在 15 万到 18 万节点之间爆掉**（WSL 实测：12 万、15 万通过，18 万段错误）。所以：

- 题目约束在 5000 时，两版都能交
- 面试官把上限提到 10 万，就只有迭代版能过

这个临界值是**针对 `reverseList` 这么小的栈帧**测的（每帧只存两个指针和一个返回地址）。换成帧更大的函数，临界深度会明显下降 —— 比如 200 题的网格 `dfs` 约 13 万层、207 题的判环 `dfs` 也约 13 万层，数值不同是正常的，别跨页对比。

这也是"能写迭代就别写递归"在链表题上的具体理由 —— 递归的栈深是被输入规模直接绑定的，没有优化空间。
:::

## 逐段拆解

::: semantics
| 变量 | 含义 | 在代码里怎么用 |
| --- | --- | --- |
| `prev` | 已反转那段的**头**（初始 `nullptr`） | 每轮被赋成 `curr`，也就是刚处理完的那个节点 |
| `curr` | 待反转那段的**头** | 每轮处理它，然后前进 |
| `next` | `curr` 的**后继**，改指针前的存档 | 只在每轮内有效，循环体结束后就作废 |
| `curr->next = prev` | 掉头这一动作本身 | **唯一**修改指针的一行 |
| `curr != nullptr` | 还有节点待处理 | 退出时 `prev` 就是新头 |
| `newHead` | 递归版里"反转后的新头" | 本层不修改它，只往上传 |
| `head->next->next = head` | 让后段的尾指向自己 | 依赖"`head->next` 此刻是后段尾巴"这个事实 |
| `head->next = nullptr` | 自己成为新尾 | 漏了会成环 |

:::

### 为什么 `prev` 初始是 `nullptr`

这个 `nullptr` 不是"为了安全"，它有确切语义：**反转后的链表尾部必须指向 `nullptr`**。

第一轮处理的是原头节点，它会变成新链表的尾巴，所以它的 `next` 就该是 `nullptr` —— 而这正好是 `curr->next = prev` 在第一轮做的事。

如果 `prev` 初始化成 `head` 或别的什么，反转出来的链表要么成环，要么尾部指向垃圾。

### 为什么返回 `prev` 而不是 `curr`

看退出时机：`curr` 变成 `nullptr` 时循环退出。此时：

- `curr` = `nullptr`，什么都不是
- `prev` = **上一轮被赋值为 `curr` 的那个节点** = 原链表的最后一个节点

原链表的最后一个节点，正是反转后链表的第一个节点。所以返回 `prev`。

`prev` 和 `curr` 始终相差一步，这个"相差一步"就是整段代码的核心：**`prev` 永远指向"最后一个已完成的节点"，`curr` 永远指向"第一个未完成的节点"**。

### 递归版：三件事的因果链

```cpp
ListNode* newHead = reverseListRecursive(head->next);   // ① 后段已反好
head->next->next = head;                                // ② 后段的尾指向我
head->next = nullptr;                                   // ③ 我成为新尾
return newHead;                                         // ④ 新头往上传
```

②依赖①（①之后 `head->next` 才是后段的尾），③ 依赖②（先接上再断开，否则会丢节点）。而 ③ 不能提前到 ② 之前 —— 提前的话 `head->next` 变 `nullptr`，② 里的 `head->next->next` 就是空指针解引用。

这四行的顺序是**唯一可行**顺序，不能重排。

### 递归的调用栈长什么样

以 `1 → 2 → 3` 为例，展开顺序：

| 层 | `head` | 进入时 `head->next` | 递归返回后做什么 |
|---|---|---|---|
| 1 | 1 | 2 | `2->next = 1`，`1->next = nullptr`，返回新头 3 |
| 2 | 2 | 3 | `3->next = 2`，`2->next = nullptr`，返回新头 3 |
| 3 | 3 | `nullptr` | 命中出口，返回 3 |

"返回新头 3"在三层里都是同一个值 3 —— 这就是"返回值语义是最终新头"的具体样子。而 `head->next = nullptr` 在每层都把**当前节点**变成新尾，所以最终只有节点 3 的 `next` 是 `nullptr`。

## 坑点

::: warning 坑点
1. **循环条件写成 `curr->next != nullptr`**：空链表时 `curr` 就是 `nullptr`，`curr->next` 立即空指针解引用；非空时最后一个节点的 `next` 是 `nullptr`，它还没被处理循环就退出了 → 漏掉一个节点。必须是 `curr != nullptr`。对应 `reverseList` 的 `while` 行。

2. **忘了先存 `next`**：把 `ListNode* next = curr->next;` 挪到 `curr->next = prev;` 之后，`next` 拿到的已经是 `prev`。`curr` 于是往回走，在 `prev` 和它自己之间来回摆 → 死循环。对应循环体第 1、2 行。

3. **`prev = curr;` 和 `curr = next;` 顺序反了**：写成 `curr = next; prev = curr;` 之后，两个变量**指向同一个节点**。下一轮 `curr->next = prev` 就成了"自己指向自己"。实测 `1→2→3→4→5`：节点 2~5 全部变成自环，函数返回 `nullptr`，链表彻底报废。对应循环体第 3、4 行。

4. **返回 `head`**：`head` 已被改成新尾（`next` 是 `nullptr`），`return head` 等于只返回一个节点。必须 `return prev`。

5. **递归版漏 `head->next = nullptr;`**：成环，不崩但死循环。长度 >= 2 必然触发。对应递归函数倒数第二行。

6. **递归版写成 `return head;`**：`head` 是新尾，应该 `return newHead`。

7. **只测了奇数长度**：`1,2` 只要 2 轮就结束，`1,2,3` 要 3 轮。两节点是"最短的非平凡情况"，能在一屏内手工走完，也最容易暴露 `prev`/`curr` 赋值顺序写反的问题 —— 因为只有 2 轮，任何一步错都会立刻体现成 `{1, 2}` 而不是 `{2, 1}`。
:::

::: danger 易错
第 4 条和第 6 条**都不会报错**，也不会崩溃 —— 它们返回的是完全合法的指针，只是指向的位置错了。

`return head` 时，返回的是原头节点，而它此刻已经是新链表的**尾**，`next` 也被改成了 `nullptr`。所以 `toVector` 能顺利跑完，只是拿回一个只有 1 个元素的数组 `{1}`。程序退出码是 0，看不出任何异常。

而如果不写 `assert`、改成 `cout << head->val` 肉眼看，更容易被骗：打印出的 `1` 看起来像个正常结果，实际答案是 `5 → 4 → 3 → 2 → 1`。

**永远用"整条链表转成 vector 再整体比较"的方式断言**，不要只查某个节点的值，也不要只判断指针非空。
:::

## 变体与练习

| 变化 | 改什么 |
|---|---|
| 只反转前 `k` 个（92 反转链表 II） | 找到第 `k` 个位置，把 `prev` 作为"反转段的左外驱"传入，反完后接回右段 |
| 每 `k` 个一组反转（25 K 个一组翻转链表） | 先数够 `k` 个，够就整体反转并递归处理剩余部分；不够就原样返回 |
| 反转后按区间返回（206 的"部分反转"版） | 加 `left`/`right` 两个哨兵引用，返回 `(新头, 新尾)` 而不是只返回头 |
| 两两交换节点（24） | 等价于"每组 2 个"的分组反转，但要改的是**节点**不是值 |
| 判断回文链表（234） | 快慢指针找中点 → 反转后半段 → 双指针比较（此时 206 就是子过程） |
| 不能用递归 | 迭代版本来就是 O(1) 空间，直接用 |

::: details 234 回文链表为什么用得上这题
234 的 O(1) 空间解法分三步：

1. 快慢指针找到中点
2. **反转后半段**（就是本题的 `reverseList`）
3. 一个指针从 `head` 走、一个从中点走，比较值

做完之后如果要求"恢复原链表"（面试常加的要求），再反转一次就还原了 —— 反转是**自逆运算**，`reverse(reverse(x)) == x`。

这也解释了一个容易疑惑的点：为什么反转不需要额外空间？因为它只改 `->next` 的方向，节点本身一个都没动，信息量没变。
:::
