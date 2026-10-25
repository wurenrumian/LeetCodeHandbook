#include <cassert>
#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    vector<int> searchRange(vector<int>& nums, int target) {
        // 找第一个 >= target 的位置（左边界）
        int first = bound(nums, target, true);
        // 找第一个 > target 的位置，再减一得到最后一个 target
        int last = bound(nums, target, false) - 1;

        // 两个失效条件：一个是左边界越界，一个是 target 根本不存在
        if (first == static_cast<int>(nums.size()) || nums[first] != target)
            return {-1, -1};

        return {first, last};
    }

private:
    // lower == true  : 第一个 >= target
    // lower == false : 第一个 >  target
    int bound(const vector<int>& nums, int target, bool lower) {
        int left = 0;
        int right = static_cast<int>(nums.size());  // [left, right)

        while (left < right) {
            int mid = left + (right - left) / 2;
            bool goRight = lower ? (nums[mid] < target) : (nums[mid] <= target);
            if (goRight) left = mid + 1;   // mid 太小（或需要跳过等值）
            else         right = mid;      // mid 可能是答案，保留
        }
        return left;   // 第一个不满足 goRight 条件的位置
    }
};

int main() {
    Solution sol;

    vector<int> a{5, 7, 7, 8, 8, 10};
    assert((sol.searchRange(a, 8) == vector<int>{3, 4}));
    assert((sol.searchRange(a, 6) == vector<int>{-1, -1}));   // 不存在
    assert((sol.searchRange(a, 5) == vector<int>{0, 0}));      // 最左端
    assert((sol.searchRange(a, 10) == vector<int>{5, 5}));     // 最右端
    assert((sol.searchRange(a, 0) == vector<int>{-1, -1}));    // 比所有都小
    assert((sol.searchRange(a, 100) == vector<int>{-1, -1}));  // 比所有都大

    vector<int> empty{};
    assert((sol.searchRange(empty, 0) == vector<int>{-1, -1})); // 空数组

    vector<int> allSame{2, 2, 2, 2};
    assert((sol.searchRange(allSame, 2) == vector<int>{0, 3})); // 全是 target

    vector<int> single{1};
    assert((sol.searchRange(single, 1) == vector<int>{0, 0}));
    assert((sol.searchRange(single, 0) == vector<int>{-1, -1}));

    cout << "all tests passed" << endl;
    return 0;
}
