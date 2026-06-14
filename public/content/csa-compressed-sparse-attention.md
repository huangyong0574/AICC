---
title: CSA（Compressed Sparse Attention）
subtitle: 把长上下文压缩后再精准检索——DeepSeek-V4 的百万 Token 方案
date: 2026-05-24
category: LLM 算法原理
tags: [csa, sparse-attention, deepseek, long-context]
status: 已定稿
readtime: 12 min
---

## TL;DR

> [!tldr] 一句话
> CSA 用「先压缩、再检索、再注意力」三步把百万 token 的全量 Attention 变成「本地精读 + 远程摘要检索」，DeepSeek-V4 用它支持百万级上下文，同时把 KV Cache 压缩率做到 4×。

## 它解决什么问题

标准 Attention 在长上下文里有两个大问题：

1. **计算量**随着上下文长度平方增长：N=1M token 时，N² = 10¹² 次乘加，完全不可行。
2. **KV Cache** 非常大：1M token × 每层 KV 向量 → 推理时显存和带宽压力极高。

DeepSeek-V4 想支持 100 万 token 级别上下文。CSA 的思路：先把历史 KV 沿序列维度**压缩**成更少的条目，再用一个轻量**索引器**从压缩条目里挑出最相关的一小部分参与注意力。

核心问题转化：**在 100 万 token 里全量注意力 → 本地精读 + 远程摘要检索**。

## 用最小例子理解

假设你要回答一本 100 万字书里的问题。

最笨的方法：每次回答问题，都从第 1 页读到最后 1 页。

CSA 的方法：

1. 先把书每几页压缩成一张**信息卡片**
2. 问题来了，先用一个很快的**索引器**找出最可能相关的卡片
3. 真正回答时，只**精读**这些相关卡片
4. 同时保留**最近几页原文**，因为近处细节不能只靠摘要

对应到模型里：

| 直觉 | 技术实现 |
|------|---------|
| 信息卡片 | 压缩后的 KV entry |
| 索引器 | Lightning Indexer |
| 精读相关卡片 | sparse attention top-k |
| 最近几页原文 | sliding window attention |

## 数字推导

以 DeepSeek-V4-Flash 典型配置理解：

- CSA 压缩率 `m = 4`
- sliding window 大小 `n_win = 128`
- CSA top-k = 512
- 上下文长度：1,000,000 token

计算过程：

```
历史 token 数：      1,000,000
压缩后 KV entry 数： 1,000,000 / 4 = 250,000
索引器选中的 entry： top-k = 512
本地窗口 token 数：  128（未压缩原文）

实际参与 Attention 的：128 (local) + 512 (compressed) = 640
```

> [!note] 注意
> 这不等价于「只看 640 个原始 token」。每个压缩 entry 本身融合了多个 token 的信息。直觉上，把「扫描 100 万 token」变成了「精读 640 个摘要+原文」。

## CSA 的三个模块

### 1. 压缩层（KV Compression）

使用**可学习的卷积压缩**，不是简单平均池化。关键：

```python
# 伪代码：重叠窗口压缩
def compress_kv(K, V, m=4):
    # K: [seq_len, d_head]
    # 每 m 个 token → 1 个压缩 entry，使用重叠窗口
    compressed_K = learnable_conv(K, kernel_size=m, stride=m//2)
    compressed_V = learnable_conv(V, kernel_size=m, stride=m//2)
    return compressed_K, compressed_V
```

### 2. Lightning Indexer（轻量索引器）

用 **FP4 精度**的轻量注意力对压缩 KV 打分，选出 top-k 个最相关 entry：

- Query head 数：64（独立于 main attention）
- index head dimension：128
- 精度：FP4 量化（节省带宽）
- 实测 recall：99.7%（比随机选好得多）

### 3. Sparse Attention 核心计算

融合两个分支：

```
Output = Attention(Q, [local_K; selected_compressed_K],
                      [local_V; selected_compressed_V])
```

`local` 是最近 `n_win=128` 个未压缩 token，`selected_compressed` 是 Lightning Indexer 选出的 512 个压缩 entry。

## 类比（含边界）

**类比**：图书馆检索系统

准确的地方：
- 不需要每次把全馆所有书都翻一遍
- 先用索引找到相关区域，再读取重点内容
- 最近刚读过的几页可以保留原文，不用压缩

会误导的地方：
- CSA 的「摘要卡片」不是人写的自然语言摘要，而是模型内部的**向量压缩**
- 索引器不是关键词搜索，而是**可学习的向量相关性打分**
- 被选中的压缩 entry 仍然会进入 Attention 计算，不是传统数据库里的直接命中返回

## 在哪些模型中出现

DeepSeek-V4 技术报告中，CSA 是 Hybrid Attention 的一部分，和 HCA（Heavily Compressed Attention）交替使用：

- 前 2 层：纯 sliding window attention
- 后续层：CSA 和 HCA 交替（CSA 压缩率 4，HCA 压缩率更高）
- CSA indexer query heads：64，index head dimension：128，sparse attention top-k：512

适用场景：百万 token 长上下文、多文档分析、长代码仓库理解、Agent 长轨迹记忆。

## 我现在还不懂的地方

- CSA 压缩权重在不同层中学到的模式是否可解释
- Lightning Indexer 的 top-k 错选时，模型后续层如何补偿
- CSA 与 HCA 交替的最佳比例是经验设计，还是可以从任务分布中推导
- FP4 indexer QK 路径带来的 99.7% recall 是否在所有长上下文任务上都稳定

## 知识关联

**上游依赖**：Self-Attention、KV Cache、稀疏注意力、MQA、RoPE

**下游延伸**：HCA（Heavily Compressed Attention）、DeepSeek-V4 混合注意力、长上下文推理、KV Cache 管理
