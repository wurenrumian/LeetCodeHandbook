---
layout: home

hero:
  name: LeetCode 算法手册
  text: 从代码形态讲清算法
  tagline: 不是"读懂题解就完事"，而是搞明白每个变量为什么长这样、每一行边界为什么不能改。C++ 现代写法，完整可编译。
  actions:
    - theme: brand
      text: 开始阅读
      link: /guide/
    - theme: alt
      text: 按题号找题
      link: /problems/
    - theme: alt
      text: 专题列表
      link: /topics/

features:
  - title: 模板 + 变体对照
    details: 每个专题先给一份可背诵的模板，再逐题标出"这题相对模板改了哪几行"。改哪、为什么改，一眼看到。
  - title: 字段语义优先
    details: 重点讲自动机里每个字段的业务含义 —— left/right 代表什么区间、dp[i] 是"凑出 i 的最少枚数"还是"前 i 个物品"。
  - title: 坑点来自真实错误
    details: 死循环、越界、重复解、不可达状态被当成 0 —— 每条坑点都对应代码里一个具体位置。
  - title: 完整可编译代码
    details: 不只给 class Solution，还带 main 和测试用例，复制下来 g++ 就能跑，改一行就能验证你的猜想。
---
