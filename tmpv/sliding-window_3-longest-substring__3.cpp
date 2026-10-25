#include <algorithm>
#include <array>
#include <cassert>
#include <iostream>
#include <string>
using namespace std;

class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        array<int, 128> window{};   // ASCII 字符计数，值初始化为 0
        int left = 0;
        int best = 0;
        const int n = static_cast<int>(s.size());

        for (int right = 0; right < n; ++right) {
            ++window[s[right]];                  // 1. 右端字符入窗

            while (window[s[right]] > 1) {       // 2. 只剩它可能重复
                --window[s[left]];               //    左端字符出窗
                ++left;
            }

            best = max(best, right - left + 1);  // 3. 此刻窗口合法，取长度
        }
        return best;
    }
};

int main() {
    Solution sol;

    assert(sol.lengthOfLongestSubstring("abcabcbb") == 3);
    assert(sol.lengthOfLongestSubstring("bbbbb") == 1);
    assert(sol.lengthOfLongestSubstring("pwwkew") == 3);
    assert(sol.lengthOfLongestSubstring("") == 0);
    assert(sol.lengthOfLongestSubstring(" ") == 1);
    assert(sol.lengthOfLongestSubstring("au") == 2);
    assert(sol.lengthOfLongestSubstring("dvdf") == 3);      // "vdf"
    assert(sol.lengthOfLongestSubstring("abba") == 2);      // "ab" / "ba"
    assert(sol.lengthOfLongestSubstring("tmmzuxt") == 5);   // "mzuxt"

    cout << "all tests passed" << endl;
    return 0;
}
