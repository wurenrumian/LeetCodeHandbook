#include <cassert>
#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    int removeDuplicates(vector<int>& nums) {
        if (nums.empty()) return 0;   // 特判：否则 slow=1 越界

        int slow = 1;                 // [0, slow) 是已确认的无重复前缀
        for (int fast = 1; fast < static_cast<int>(nums.size()); ++fast) {
            // 和"已保留的最后一个"比较，而不是 fast-1
            if (nums[fast] != nums[slow - 1]) {
                nums[slow] = nums[fast];
                ++slow;
            }
        }
        return slow;                  // slow 既是长度，也是下一个空位
    }
};

// 辅助：打印前 k 个元素，方便肉眼验证
void dump(const vector<int>& v, int k) {
    cout << "[";
    for (int i = 0; i < k; ++i) cout << (i ? ", " : "") << v[i];
    cout << "]";
}

int main() {
    Solution sol;

    vector<int> a{1, 1, 2};
    int k1 = sol.removeDuplicates(a);
    assert(k1 == 2);
    assert((vector<int>(a.begin(), a.begin() + k1) == vector<int>{1, 2}));

    vector<int> b{0, 0, 1, 1, 1, 2, 2, 3, 3, 4};
    int k2 = sol.removeDuplicates(b);
    assert(k2 == 5);
    assert((vector<int>(b.begin(), b.begin() + k2) == vector<int>{0, 1, 2, 3, 4}));

    vector<int> c{1};
    assert(sol.removeDuplicates(c) == 1);

    vector<int> d{};
    assert(sol.removeDuplicates(d) == 0);        // 空数组

    vector<int> e{2, 2, 2, 2};
    assert(sol.removeDuplicates(e) == 1);        // 全相同

    vector<int> f{1, 2, 3};
    assert(sol.removeDuplicates(f) == 3);        // 无重复

    cout << "all tests passed" << endl;
    return 0;
}
