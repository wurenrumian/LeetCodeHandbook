#include <cassert>
#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    int search(vector<int>& nums, int target) {
        int left = 0;
        int right = static_cast<int>(nums.size());  // [left, right)

        while (left < right) {
            int mid = left + (right - left) / 2;    // 防溢出
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) left = mid + 1;
            else                    right = mid;
        }
        return -1;
    }
};

int main() {
    Solution sol;

    vector<int> a{-1, 0, 3, 5, 9, 12};
    assert(sol.search(a, 9) == 4);
    assert(sol.search(a, -1) == 0);     // 最左端
    assert(sol.search(a, 12) == 5);     // 最右端
    assert(sol.search(a, 2) == -1);     // 不存在（中间）
    assert(sol.search(a, -5) == -1);    // 比所有元素都小
    assert(sol.search(a, 100) == -1);   // 比所有元素都大

    vector<int> empty{};
    assert(sol.search(empty, 1) == -1); // 空数组

    vector<int> single{7};
    assert(sol.search(single, 7) == 0);
    assert(sol.search(single, 8) == -1);

    cout << "all tests passed" << endl;
    return 0;
}
