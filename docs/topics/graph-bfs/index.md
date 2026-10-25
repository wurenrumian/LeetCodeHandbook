# 树的遍历 · BFS

BFS 的代码几乎是不变的：**队列 + 一层一层处理**。真正需要判断的只有一处 ——

> 你怎么知道"这一层结束了"？

这就是所谓的**层界快照**，也是 BFS 所有变体的分水岭。

## 两种层界写法

| 写法 | 做法 | 层次感 |
|---|---|---|
| 层界快照 | 每层开始时记下 `queue.size()`，只处理这么多 | 清晰，推荐 |
| 分隔符 | 队列里塞一个 `nullptr` 当层标记 | 容易漏处理末尾，不推荐 |

层界快照的灵魂是这一行：

```cpp
int levelSize = static_cast<int>(queue.size());   // 快照！必须在循环前
for (int i = 0; i < levelSize; ++i) { /* 处理本层 */ }
```

**为什么必须快照**：`for` 循环里会往队列加下一层的节点，`queue.size()` 一直在变。不先存下来，`i < queue.size()` 的条件会越跑越远 —— 把下一层也处理了，层就混了。

::: danger 易错
```cpp
while (!queue.empty()) {
    for (int i = 0; i < queue.size(); ++i)   // ✗ 每轮重新求 size
        ...
}
```
`queue.size()` 在循环中会增长，导致本层处理了 2 层甚至无限循环。**必须先赋值给 `levelSize`。**
:::

## 通用模板

```cpp
vector<vector<int>> levelOrder(TreeNode* root) {
    if (!root) return {};                    // 空树特判

    vector<vector<int>> result;
    queue<TreeNode*> queue;
    queue.push(root);

    while (!queue.empty()) {
        int levelSize = static_cast<int>(queue.size());  // 本层节点数
        vector<int> level;                                // 本层结果
        level.reserve(levelSize);

        for (int i = 0; i < levelSize; ++i) {
            TreeNode* node = queue.front();
            queue.pop();
            level.push_back(node->val);

            // 展开下一层
            if (node->left)  queue.push(node->left);
            if (node->right) queue.push(node->right);
        }
        result.push_back(std::move(level));
    }
    return result;
}
```

模板的四个位置，分别对应四个可以改的点：

| 位置 | 改什么 | 典型用途 |
|---|---|---|
| `if (!root) return {}` | 返回值形态 | 返回 `int` 时返回 0/-1 |
| `levelSize` 快照前 | 开始新层的动作 | 层数 +1、交换左右子树 |
| `for` 循环内 | 本层每个节点做什么 | 求和、找最大值、判断是否匹配 |
| `push` 子节点时 | 谁算"邻居" | 图用邻接表，网格用四个方向 |

## 变体索引

### 变体 1：分层输出（[102](/topics/graph-bfs/102-level-order)）

最基础形态，直接返回二维数组。

### 变体 2：只求深度（104）

不需要保存每层内容，只需要在 `while` 里计数：

```cpp
int depth = 0;
while (!queue.empty()) {
    ++depth;                              // 每进一层 +1
    int levelSize = queue.size();
    for (int i = 0; i < levelSize; ++i) { /* 只展开，不记录 */ }
}
return depth;
```

**关键**：`++depth` 放在 `while` 开头，不是在 `for` 里。

### 变体 3：层内聚合（199 右视图、515 每层最大值）

`level` 数组可以省略，直接用一个变量在 `for` 结束时取到本层的聚合值：

```cpp
int rightmost = 0;
for (int i = 0; i < levelSize; ++i) {
    TreeNode* node = ...;
    rightmost = node->val;                // 循环结束时就是最后一个
    // ...
}
result.push_back(rightmost);
```

右视图就是"每层最后一个" —— 因为 BFS 按从左到右入队，最后一个出队的就是最右的。

### 变体 4：锯齿遍历（103）

偶层从左到右、奇层从右到左。**不要改入队顺序**（会破坏后续层），而是处理完本层后反转：

```cpp
if (result.size() % 2 == 1) reverse(level.begin(), level.end());
```

### 变体 5：最短路径（994 腐烂的橘子、1091 最短路径）

BFS 在**无权图**上求最短路径是正确的 —— 因为按层推进保证了"第一次到达某状态时的步数最小"。

```cpp
// 多源 BFS：一开始把多个起点都塞进队列
for (auto& start : sources) queue.push(start);
int steps = 0;
while (!queue.empty()) {
    int levelSize = queue.size();
    for (int i = 0; i < levelSize; ++i) {
        // 如果到达目标，返回 steps
    }
    ++steps;                              // 一层 = 一步
}
```

::: info 补充
"第一次到达就是最短"这句话只在**边权相等**时成立。边权不等要用 Dijkstra（优先队列 + 按距离出队）。

BFS 用 FIFO 队列，本质上是在用"入队顺序"保证"距离单调不减"；Dijkstra 用优先队列显式维护这个单调性。
:::

## 坑点汇总

::: warning 坑点
1. **`queue.size()` 不快照**：本层循环把下一层也处理了，结果层数变少、内容错乱。
2. **空树不特判**：`root == nullptr` 时 `queue.push(nullptr)`，后面 `node->val` 直接崩。
3. **忘了 `queue.pop()`**：死循环，且内存持续增长。
4. **展开子节点时没判空**：`queue.push(node->left)` 不判空，之后取 `->val` 崩溃。
5. **多源 BFS 只塞一个起点**：994 腐烂的橘子这类题有多个初始源，必须全部入队。
6. **`++steps` 位置错**：放在 `for` 里会让步数按节点数增长而不是按层数。
:::

## 自检清单

- 空输入（`nullptr` / 空图）会返回什么？
- `levelSize` 是在 `for` 之前算的吗？
- `queue.pop()` 在 `front()` 之后、展开子节点之前，还是之后？（顺序其实不影响，但别忘）
- 如果求"最短步数"，`++steps` 在哪一层？
