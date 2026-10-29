---
title: 102 · 二叉树的层序遍历
---

# 102 · 二叉树的层序遍历

<ProblemMeta id="102" difficulty="中等" title="二叉树的层序遍历" :tags="['队列', '层界快照', '二叉树']" url="https://leetcode.cn/problems/binary-tree-level-order-traversal/" />

::: cheat 速查卡
- **什么时候用**：需要"按层"处理树/图，而不是按深度优先的顺序
- **核心不变式**：进入 `while` 每一轮时，队列里**恰好是同一层的全部节点**
- **一句话模板**：`levelSize = queue.size()` 快照 → 循环 `levelSize` 次 → 展开下一层
- **复杂度**：时间 **O(n)**、空间 **O(宽度)**，最坏 O(n)
:::

## 题意重述

按层返回二叉树节点值，每层一个数组，从左到右。

```
输入: root = [3,9,20,null,null,15,7]
输出: [[3],[9,20],[15,7]]

       3
      / \
     9  20
        / \
       15  7

输入: root = []
输出: []

输入: root = [1]
输出: [[1]]
```

`[3,9,20,null,null,15,7]` 是层序序列化格式（力扣的表示法），`null` 表示该位置没有节点。

## 从 DFS 到 BFS

DFS 配一个 `depth` 参数也能做到分层：

```cpp
void dfs(TreeNode* node, int depth, vector<vector<int>>& result) {
    if (!node) return;
    if (depth == result.size()) result.emplace_back();  // 新的一层
    result[depth].push_back(node->val);
    dfs(node->left,  depth + 1, result);
    dfs(node->right, depth + 1, result);
}
```

能过，但有两个问题：

1. **不是真正的"层序"**：DFS 的访问顺序是 `3,9,20,15,7`（按深度优先），只是靠 `depth` 把结果**归档**到了正确的层
2. **递归栈深度**：退化链表时栈深 O(n)

BFS 的访问顺序天然就是层序，这也是"按层"类题目应该优先 BFS 的原因。

::: info 补充
`depth == result.size()` 这个判断是 DFS 分层法的精髓 —— 第一次到达某深度时，`result` 还没有那一层，所以 `emplace_back` 新建。这个技巧在需要"每层一个容器"的 DFS 里通用。
:::

## 模板对照

::: compare BFS 通用骨架 | 102 本题：每层一个 vector
```cpp
// BFS 通用骨架：队列 + 层界快照
queue<Node*> queue;
queue.push(start);
while (!queue.empty()) {
    int levelSize = queue.size();   // 快照
    while (levelSize--) {
        Node* curr = queue.front(); queue.pop();
        // 处理 curr
        // 把 curr 的邻居入队
    }
}
```
```cpp
// 本题：加上"每层一个 vector"和"空树特判"
if (!root) return {};
vector<vector<int>> result;
queue<TreeNode*> queue{{root}};
while (!queue.empty()) {
    int levelSize = static_cast<int>(queue.size());
    vector<int> level;
    for (int i = 0; i < levelSize; ++i) {
        TreeNode* node = queue.front();
        queue.pop();
        level.push_back(node->val);
        if (node->left)  queue.push(node->left);
        if (node->right) queue.push(node->right);
    }
    result.push_back(std::move(level));
}
```
:::

改动点：

1. `levelSize` 用 `static_cast<int>` —— `size()` 返回 `size_t`，跟 `int` 比会有符号警告
2. `level` 在线程内构造，用 `std::move` 避免拷贝
3. 空树特判在函数开头

### `while (levelSize--)` 还是 `for (int i = 0; i < levelSize; ++i)`

两种都行，但语义有微妙差别：

| 写法 | 循环结束后 `levelSize` | 风险 |
|---|---|---|
| `while (levelSize--)` | `-1` | 如果后面要用 `levelSize`（比如预分配），值已毁 |
| `for (int i = 0; i < levelSize; ++i)` | 保持原值 | 更安全，可读性更好 |

我选 `for`，因为它保留了 `levelSize` 的值，后续 `level.reserve(levelSize)` 之类还能用。**`while(levelSize--)` 在 `levelSize == 0` 时也会进一次判断并把它减成 -1**，虽然 `0` 是假值不会执行循环体，但值已经被改了。

::: warning 坑点
`while (levelSize--)` 在 `levelSize` 为 `unsigned` 时会**下溢成巨大正数** → 几乎死循环。用 `int` 就没问题，但这是"靠类型侥幸"的写法。
:::

## 完整可编译代码

```cpp
#include <cassert>
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

class Solution {
public:
    vector<vector<int>> levelOrder(TreeNode* root) {
        if (root == nullptr) return {};          // 空树

        vector<vector<int>> result;
        queue<TreeNode*> queue;
        queue.push(root);

        while (!queue.empty()) {
            // 快照：这一刻队列里的节点恰好是同一层
            int levelSize = static_cast<int>(queue.size());
            vector<int> level;
            level.reserve(levelSize);

            for (int i = 0; i < levelSize; ++i) {
                TreeNode* node = queue.front();
                queue.pop();

                level.push_back(node->val);

                // 展开下一层（判空！）
                if (node->left)  queue.push(node->left);
                if (node->right) queue.push(node->right);
            }

            result.push_back(std::move(level));
        }
        return result;
    }
};

// 辅助：按层序数组建树（力扣格式，-1000 代表 null）
TreeNode* build(const vector<int>& data) {
    if (data.empty() || data[0] == -1000) return nullptr;
    TreeNode* root = new TreeNode(data[0]);
    queue<TreeNode*> queue;
    queue.push(root);
    size_t i = 1;
    while (!queue.empty() && i < data.size()) {
        TreeNode* curr = queue.front();
        queue.pop();
        if (i < data.size() && data[i] != -1000) {
            curr->left = new TreeNode(data[i]);
            queue.push(curr->left);
        }
        ++i;
        if (i < data.size() && data[i] != -1000) {
            curr->right = new TreeNode(data[i]);
            queue.push(curr->right);
        }
        ++i;
    }
    return root;
}

void destroy(TreeNode* root) {
    if (!root) return;
    destroy(root->left);
    destroy(root->right);
    delete root;
}

int main() {
    Solution sol;

    {
        TreeNode* root = build({3, 9, 20, -1000, -1000, 15, 7});
        auto got = sol.levelOrder(root);
        vector<vector<int>> want{{3}, {9, 20}, {15, 7}};
        assert(got == want);
        destroy(root);
    }
    {
        TreeNode* root = build({});
        assert(sol.levelOrder(root).empty());          // 空树
        destroy(root);
    }
    {
        TreeNode* root = build({1});
        vector<vector<int>> want{{1}};
        assert(sol.levelOrder(root) == want);          // 单节点
        destroy(root);
    }
    {
        // 退化成链表：1 -> 2 -> 3，每层一个节点
        TreeNode* root = build({1, -1000, 2, -1000, 3});
        vector<vector<int>> want{{1}, {2}, {3}};
        assert(sol.levelOrder(root) == want);
        destroy(root);
    }
    {
        // 完全二叉树
        TreeNode* root = build({1, 2, 3, 4, 5, 6, 7});
        vector<vector<int>> want{{1}, {2, 3}, {4, 5, 6, 7}};
        assert(sol.levelOrder(root) == want);
        destroy(root);
    }

    cout << "all tests passed" << endl;
    return 0;
}
```

## 逐段拆解

::: semantics
| 字段 | 含义 | 在代码里怎么用 |
| --- | --- | --- |
| `queue` | 待处理节点，**进队时**已经按层排好 | 只 `push` 子节点，不排序、不插入中间 |
| `levelSize` | 本层节点数，"层界快照" | 必须在 `for` 之前求值，之后不再变 |
| `level` | 本层结果容器 | 每轮新建，`std::move` 进 `result` |
| `node` | 当前出队节点 | `pop` 后立刻取 `val`，再展开子节点 |
| `result` | 最终答案 | `result.size()` 顺便就是层数 |
| `!root` 特判 | 空树 | 不加会 `push(nullptr)` 后崩 |
:::

### 队列里为什么"恰好是同一层"

这是本算法唯一需要证明的点。用归纳法：

**初始**：队列里只有 `root`，它是第 0 层，恰好是"第 0 层的全部节点"。

**归纳**：假设进入某轮 `while` 时队列里恰好是第 `k` 层全部节点，共 `levelSize` 个。循环体处理 `levelSize` 次，每次出队一个第 `k` 层节点，并把它**非空的**子节点入队。循环结束时：

- 第 `k` 层节点全部出队
- 入队的全部是第 `k+1` 层节点，且每个第 `k+1` 层节点**恰好被它的父节点入队一次**

所以队列里恰好是第 `k+1` 层全部节点。（假设是二叉树，每个节点只有一个父节点。）

**结论**：快照 `levelSize` 之后，`for` 循环执行 `levelSize` 次刚好清空本层，而**不会碰到下一层**。

::: details 为什么"恰好一次"很关键
如果某个节点可能被多次入队（比如图里没做 `visited` 标记），队列里就会有重复，`levelSize` 就不等于"本层节点数"，层就乱了。

树没有环 + 每个节点一个父节点，所以天然"恰好一次"。**换成图，必须加 `visited`，在入队时标记（不是出队时）** —— 出队时标记会让同一节点在入队前被多次处理。这也是 994 腐烂的橘子容易错的地方。
:::

### `reserve` 和 `move` 的作用

```cpp
level.reserve(levelSize);          // 预分配，避免多次扩容
result.push_back(std::move(level)); // 转移所有权，避免深拷贝
```

这两行都是性能优化，不是正确性必需。但在 `n` 很大时有明显差别：

- 不 `reserve`：`level` 可能扩容 log 次，每次拷一半元素
- 不 `move`：`push_back(level)` 会复制整个 `vector<int>`，然后 `level` 析构时再释放

`std::move` 之后 `level` 变成"有效但未指定状态"，下一轮循环重新赋值前不能读它 —— 而代码里下一轮就是重新构造，所以安全。

### 空树为什么必须特判

```cpp
if (root == nullptr) return {};
```

不写会怎样：`queue.push(nullptr)`，然后 `queue.front()` 返回 `nullptr`，`node->val` → **解引用空指针，段错误**。

有些写法是在 `while` 内部判空：

```cpp
TreeNode* node = queue.front(); queue.pop();
if (!node) continue;    // 能跑，但会让 levelSize 语义错乱
```

`continue` 之后本层处理的节点数少了，`levelSize` 的语义（"本层节点数"）被破坏。**特判在函数开头最干净。**

## 坑点

::: warning 坑点
1. **`for` 里写 `i < queue.size()`**：`size()` 在循环中增长，本层循环会把下一层也吃掉，甚至无限循环。

2. **`queue.push(node->left)` 不判空**：空指针入队，之后取 `val` 崩溃。

3. **忘记 `queue.pop()`**：`front()` 永远是同一个节点 → 死循环 + 内存爆炸。

4. **`static_cast<int>` 省略**：`int levelSize = queue.size();` 有符号/无符号比较警告，严格编译选项下报错。

5. **`std::move(level)` 后又用 `level`**：`move` 之后 `level` 内容未指定。确保后面不再读它。

6. **多层结构用 `vector<vector<int>>` 逐层 `push_back`**：`result` 会多次扩容 + 拷贝。`n` 大时可以 `result.reserve(树高)`，但树高要另外求，通常不值得。
:::

::: danger 易错
把 `levelSize` 写在 `for` 的条件里而**没有报错**：

```cpp
for (int i = 0; i < queue.size(); ++i)   // 没有编译错误
```

这行代码逻辑上错得很严重（把后续层也算进来），但**编译通过、不崩溃、大部分测试用例还能过一部分** —— 最难查的那类。写完 BFS 一定检查这一行。
:::

## 变体与练习

| 变化 | 改什么 |
|---|---|
| 只求最大深度（[104](https://leetcode.cn/problems/maximum-depth-of-binary-tree/)） | 删掉 `level`，`while` 开头 `++depth` |
| 右视图（[199](https://leetcode.cn/problems/binary-tree-right-side-view/)） | `level` 只留最后一个：`rightmost = node->val` |
| 锯齿遍历（[103](https://leetcode.cn/problems/binary-tree-zigzag-level-order-traversal/)） | 处理完本层后按奇偶 `reverse` |
| 每层最大值（[515](https://leetcode.cn/problems/find-largest-value-in-each-tree-row/)） | `level` 只留 `max` |
| 最小深度（[111](https://leetcode.cn/problems/minimum-depth-of-binary-tree/)） | 遇到**叶子**节点立刻返回当前深度（不是遇到空就返回） |
| 图的最短路径（[1091](https://leetcode.cn/problems/shortest-path-in-binary-matrix/)） | 邻居换成四个方向，入队时标记 `visited` |

::: warning 坑点
111 最小深度有个经典陷阱：不能像最大深度那样"遇到空节点返回 0 再取 min"。因为单边树（`1 -> 2 -> 3`）在 `root` 处左子为空，会错误地返回 1。

正确做法是**只在叶子节点返回深度**，或者对单边情况特殊处理。这也是它比最大深度难的原因。
:::

::: info 补充
102 的模板是"按层 BFS"的母版。所有按层的问题都是在这四个位置之一做修改：

```
while (!queue.empty()) {
    int levelSize = queue.size();      // ① 层开始：计数、换方向
    for (int i = 0; i < levelSize; ++i) {
        node = pop();
        处理 node;                      // ② 本层节点：取值、判断、聚合
        push 子节点;                    // ③ 邻居定义：左右子 or 四个方向
    }
    // ④ 层结束：记录层结果、步数 +1
}
```

**记住这四段，就记住了所有按层 BFS。**
:::

回到 [专题总览](/topics/) 看看还有哪些专题没读，或者去 [题目索引](/problems/) 按标签挑题练手。
