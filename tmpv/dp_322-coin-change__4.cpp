#include <algorithm>
#include <cassert>
#include <iostream>
#include <vector>
using namespace std;

class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        if (amount == 0) return 0;                    // 边界：0 元不需要硬币

        // dp[i] = 凑出金额 i 的最少硬币数
        // amount + 1 是安全哨兵：真实答案不可能超过 amount
        const int INF = amount + 1;
        vector<int> dp(amount + 1, INF);
        dp[0] = 0;                                    // 起点：凑 0 元要 0 枚

        for (int i = 1; i <= amount; ++i) {           // 容量正序 = 完全背包
            for (int coin : coins) {
                if (coin > i) continue;               // 面值超过目标金额
                // dp[i-coin] 若仍为 INF，INF+1 > INF，min 不会选中它
                dp[i] = min(dp[i], dp[i - coin] + 1);
            }
        }

        return dp[amount] > amount ? -1 : dp[amount];
    }
};

int main() {
    Solution sol;

    {
        vector<int> coins{1, 2, 5};
        assert(sol.coinChange(coins, 11) == 3);       // 5+5+1
    }
    {
        vector<int> coins{2};
        assert(sol.coinChange(coins, 3) == -1);       // 不可达
    }
    {
        vector<int> coins{1};
        assert(sol.coinChange(coins, 0) == 0);        // 边界：0
    }
    {
        vector<int> coins{2};
        assert(sol.coinChange(coins, 0) == 0);        // 边界：0（和面值无关）
    }
    {
        vector<int> coins{1};
        assert(sol.coinChange(coins, 100) == 100);    // 全用 1
    }
    {
        vector<int> coins{186, 419, 83, 408};
        assert(sol.coinChange(coins, 6249) == 20);    // 力扣官方大用例
    }
    {
        vector<int> coins{5};
        assert(sol.coinChange(coins, 3) == -1);       // 面值大于目标
    }
    {
        vector<int> coins{1, 2147483647};
        assert(sol.coinChange(coins, 2) == 2);        // 极大面值不应溢出
    }

    cout << "all tests passed" << endl;
    return 0;
}
