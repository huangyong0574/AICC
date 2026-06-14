---
title: MLA（Multi-head Latent Attention）
subtitle: DeepSeek 如何用低秩投影把 KV Cache 压缩到极致
date: 2026-05-21
category: LLM 算法原理
tags: [mla, kv-cache, deepseek, low-rank]
status: 已定稿
readtime: 11 min
---

## TL;DR

> [!tldr] 一句话
> MLA 用低秩矩阵分解把 KV Cache 从「每层存 2×n_heads×d_head 个向量」压缩到「只存 1 个低维潜变量」，DeepSeek-V2/V3 用它把 KV Cache 大小减少了 **93.3%**，同时推理吞吐量提升了 5.76×。

## 它解决什么问题

KV Cache 是推理时的内存杀手：

- 标准 MHA（Multi-head Attention）：每个 token 每层存 `2 × n_heads × d_head` 个值
- GPT-3 规模（96层，96heads，128dim）：1k token 的 KV Cache ≈ **2.4GB**
- 长上下文或大 batch：KV Cache 轻松吃掉 80% 显存

现有方案对比：

| 方案 | 思路 | 代价 |
|------|------|------|
| GQA/MQA | 多个 Q head 共享 K、V | 有精度损失 |
| PagedAttention | 动态显存分配 | 不减少总量 |
| **MLA** | 低秩压缩，只存潜变量 | 推理需要解压，增加少量计算 |

## 核心思路：低秩分解

标准 KV Cache 存储：

```
K_cache: [seq_len, n_heads × d_head]
V_cache: [seq_len, n_heads × d_head]
```

MLA 的洞见：**K 和 V 矩阵的信息量远低于它们的维度**，可以用低秩潜变量 `c` 来表示：

```
c_KV: [seq_len, d_c]   # d_c << n_heads × d_head

# 推理时解压：
K = W_K @ c_KV    # W_K: [n_heads × d_head, d_c]
V = W_V @ c_KV    # W_V: [n_heads × d_head, d_c]
```

只存 `c_KV`，推理时用矩阵乘法恢复 K、V。

## 数字：DeepSeek-V2 的配置

```
标准 MHA KV Cache 每 token 每层：
  n_heads=128, d_head=128
  大小 = 2 × 128 × 128 = 32,768 float16 ≈ 64KB

MLA KV Cache 每 token 每层：
  d_c = 512（潜变量维度）
  大小 = 512 float16 ≈ 1KB

压缩比 = 64 / 1 = 64×（论文报告 93.3% 减少）
```

> [!note] 为什么不是精确 64×
> MLA 还有一个 RoPE 解耦设计：位置编码不能低秩化，需要额外存一份小的位置 KV。加上这部分后实际压缩比约为 93.3%。

## RoPE 解耦：难点在哪里

RoPE 是位置相关的旋转变换，不满足低秩分解的前提：

```
标准 RoPE：K = RoPE(W_k @ x)
```

如果先低秩压缩再加 RoPE，推理时就无法只存潜变量（因为 RoPE 已经混入了位置信息）。

MLA 的解法：**解耦 RoPE**，把 K 拆成两部分：

```
K = concat(RoPE(W_kr @ x),    # 带位置的部分（单独存）
           W_k  @ c_KV)       # 内容部分（从低秩潜变量恢复）
```

这样 KV Cache 里只需要额外存一份维度很小的位置 KV（`d_rope = 64`），其余全用潜变量表示。

## 推理时的计算流程

```python
# 推理时，对新 token x：
c_KV = W_down_kv @ x          # 压缩：生成潜变量，存入 KV Cache

# 计算注意力时：
K_content = W_uk @ c_KV        # 解压：内容部分
K_rope    = RoPE(W_kr @ x)     # 位置部分（每 token 存储）
K = concat(K_content, K_rope)  # 拼接完整 K

V = W_uv @ c_KV                # 解压 V

# 标准注意力计算
output = softmax(Q @ K.T / sqrt(d)) @ V
```

## 类比

把 KV Cache 比作「快递仓库」：

- **标准 MHA**：每件货物（token）存完整的 K+V 原装箱（大）
- **MQL/GQA**：把几件货物的配件合并（减少 K、V 数量）
- **MLA**：只存一张「货物清单」（潜变量），需要时按清单现场组装（解压）

边界：组装需要时间（额外的矩阵乘），但在内存带宽是瓶颈的场景下，组装比搬运大箱子快。

## 我现在还不懂的地方

- MLA 的低秩假设在不同任务（长文本理解 vs 代码生成）上是否都成立
- W_down_kv 的学习过程：是否会学到「丢弃」某些任务相关信息
- 与 GQA 混合使用时的最优配置
- 在 speculative decoding 场景下，MLA 的解压步骤如何处理 draft token 的 KV

## 知识关联

**上游依赖**：Multi-head Attention、KV Cache、低秩矩阵分解、RoPE

**下游延伸**：Flash Attention（KV Cache 读写优化）、PagedAttention（显存管理）、CSA（稀疏压缩）、DeepSeek-V2/V3 整体架构
