#include <cassert>
#include <cstdint>
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
        TreeNode* cur = queue.front();
        queue.pop();
        if (i < data.size() && data[i] != -1000) {
            cur->left = new TreeNode(data[i]);
            queue.push(cur->left);
        }
        ++i;
        if (i < data.size() && data[i] != -1000) {
            cur->right = new TreeNode(data[i]);
            queue.push(cur->right);
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
