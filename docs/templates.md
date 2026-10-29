# 模板总表

十个专题的骨架，一页看完。

这一页的代码**不是抄过来的**：构建时直接从各专题首页的 `#region template` 引用。改专题页，这里跟着变；不存在"两处都改了但改得不一样"的可能。

| 专题 | 三要素 |
|---|---|
| [二分查找](/topics/binary-search/) | 区间约定 / 循环条件 / 边界更新 |
| [滑动窗口](/topics/sliding-window/) | 窗口维护 / 非法条件 / 答案更新 |
| [双指针](/topics/two-pointers/) | 两个指针的角色 / 移动条件 / 写回时机 |
| [哈希表](/topics/hash-table/) | 记录什么 / 何时记录 / key 的来路 |
| [链表](/topics/linked-list/) | 指针怎么配 / 断链顺序 / 哨兵用在哪 |
| [栈与单调栈](/topics/stack/) | 栈里存什么 / 入栈前做什么 / 出栈时机 |
| [动态规划](/topics/dp/) | 状态定义 / 初始化 / 遍历顺序 |
| [回溯](/topics/backtracking/) | 一层在决策什么 / 分支怎么枚举 / 撤销写在哪 |
| [树的遍历 · BFS](/topics/graph-bfs/) | 队列里存什么 / 层怎么切 / 入队前做什么 |
| [图的遍历 · DFS](/topics/graph-dfs/) | 标记时机 / 标记取值 / 外层循环做什么 |

## 二分查找

左闭右开，`[left, right)`。

<!--@include: ./topics/binary-search/index.md#template-->

## 滑动窗口

求最长。求最短时 `while` 条件反转、答案更新移进循环内——见 [专题页](/topics/sliding-window/)。

<!--@include: ./topics/sliding-window/index.md#template-->

## 双指针

两种形态，选哪种由"要不要保序"决定。

对撞指针（有序数组、两端向中间收）：

<!--@include: ./topics/two-pointers/index.md#template-1-->

快慢指针（原地修改、读指针扫全部）：

<!--@include: ./topics/two-pointers/index.md#template-2-->

## 哈希表

边遍历边记录：**先查、后插**，顺序反了同一个元素会被用两次。

<!--@include: ./topics/hash-table/index.md#template-->

## 链表

一条铁律：先存后继，再改指针。

<!--@include: ./topics/linked-list/index.md#template-->

## 栈与单调栈

配对型（括号类）：

<!--@include: ./topics/stack/index.md#template-1-->

单调栈（下一个更大/更小）：

<!--@include: ./topics/stack/index.md#template-2-->

## 动态规划

DP 最常错的不是转移方程，是**遍历方向**——0-1 背包倒序、完全背包正序，只差这一个符号。

<!--@include: ./topics/dp/index.md#template-->

## 回溯

两版骨架只差一个参数：排列用 `used` 每层从 0 扫，子集用 `start` 每层从 `start` 扫。

排列型：

<!--@include: ./topics/backtracking/index.md#template-1-->

子集型：

<!--@include: ./topics/backtracking/index.md#template-2-->

## 树的遍历 · BFS

队列 + 层界快照。

<!--@include: ./topics/graph-bfs/index.md#template-->

## 图的遍历 · DFS

骨架永远三段：出口 → 标记 → 展开。变体全在这三处动手。

<!--@include: ./topics/graph-dfs/index.md#template-->

::: info 为什么这页能一直是对的

`docs/topics/*/index.md` 里的 `<!-- #region template -->` 标出了"这一页的骨架是哪一块"，本页用 VitePress 的 snippet 语法引用它。每次 `npm run build` 都会重新拼一遍，所以这里永远等于专题页当下的样子——不需要额外的比对脚本，因为它物理上只有一份。

:::
