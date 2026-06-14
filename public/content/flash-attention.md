---
title: Flash Attention 2 与 3 的工程实现差异
subtitle: 为什么 Attention 的瓶颈不是 FLOPs 而是 IO？
date: 2026-05-22
category: LLM 算法原理
tags: [attention, flash-attention, gpu, cuda]
status: 已定稿
readtime: 14 min
---

## TL;DR

> [!tldr] 一句话
> Flash Attention 的核心洞见：Attention 的真正瓶颈是 HBM 访存带宽，而不是计算量。Tiling + Recomputation 把内存读写降到 O(N)，Flash Attention 3 进一步在 H100 上利用异步流水线把 GPU 利用率推到 75%+。

## 它解决什么问题

标准 Attention 在序列长度 N 时，中间矩阵 S = QK^T 和 P = softmax(S) 都是 N×N 大小，存储复杂度 O(N²)。

对于长序列（N=8192 时，N² ≈ 67M 个 float16，约 **134MB**），每次前向都要把这些矩阵写入 HBM、再读回 HBM——而 HBM 带宽只有 2TB/s 左右，远低于 SRAM 的 19TB/s。

Flash Attention 的洞见：**不写 N×N 矩阵到 HBM**，直接在 SRAM 里分块计算并累积输出。

## 为什么

### 访存复杂度对比

| 实现 | HBM 读写次数 | 显存占用 |
|------|-------------|---------|
| 标准 Attention | O(N²d) | O(N²) |
| Flash Attention | O(N²d / M) | O(N) |

其中 M 是 SRAM 大小（约 192KB/SM），d 是 head dim。访存量减少 **M/d** 倍。

### 三个核心技术

**Tiling（分块）**：把 Q、K、V 切成小块，逐块载入 SRAM 计算，避免 N×N 矩阵的 HBM 读写。

**Recomputation（重计算）**：反向传播时不存中间矩阵 S、P，而是重新计算。以少量 FLOPs 换大量 HBM 节省。

**Online Softmax**：Softmax 需要全局 max 和 sum，分块时用增量更新技巧维护数值稳定性，无需提前看完整行。

## 怎么做

### Flash Attention 1 → 2 的改进

Flash Attention 2 的主要工程改进：

- 减少非矩阵运算（rescaling 操作合并）
- 序列长度维度上并行：Q 的分块在不同 Warp 上并行，而不是只在 batch/head 上并行
- Warp 调度优化：避免 shared memory 的 split-K 通信瓶颈

实测 A100 上 Flash Attention 2 吞吐量是 Flash Attention 1 的 **2×**，是 PyTorch 标准 Attention 的 **5-9×**。

### Flash Attention 3（H100 专属）

H100 引入了 Tensor Memory Accelerator（TMA）和 WGMMA 指令，Flash Attention 3 专门针对这两个特性：

```python
# 伪代码示意：异步流水线
async def flash_attention_3_kernel(Q, K, V):
    # Stage 1: 异步加载 K, V 块到 SRAM (TMA)
    tma_load(K_block)
    tma_load(V_block)
    
    # Stage 2: WGMMA 计算 QK^T，同时异步加载下一块
    S = wgmma(Q, K_block)          # Tensor Core 计算
    tma_load(K_block_next)          # 同时加载下一块
    
    # Stage 3: Softmax + 累积 O
    P = online_softmax(S)
    O += wgmma(P, V_block)
```

关键改进：计算和内存加载**异步重叠**，GPU 利用率从 Flash Attention 2 的 35% 提升到 **75%+**。

### 可视化：Tiling 过程

```
HBM                    SRAM (per SM, ~192KB)
┌──────────┐          ┌────────────┐
│  Q[0:Br] │ ────→   │  Q_block   │
│          │          │            │  → 计算 QK^T
│  K[0:Bc] │ ────→   │  K_block   │  → online softmax
│  K[Bc:2Bc]│────→   │  (覆盖写) │  → 累积到 O
│  ...     │          │            │
│  V[0:Bc] │ ────→   │  V_block   │
└──────────┘          └────────────┘
     ↑                       ↓
     最终 O 只写一次到 HBM
```

## 类比

把 GPU 计算比作一个厨房：

- **HBM** = 食材仓库（大、慢）
- **SRAM** = 案板（小、极快）
- **标准 Attention** = 每道菜都跑到仓库取原料、做完再放回去
- **Flash Attention** = 一次拿够一批原料在案板上做完，只在最后把成品送回仓库

边界：这个类比掩盖了 online softmax 的数值技巧和 Warp 级别的并发细节。

## 我现在还不懂的地方

- Flash Attention 3 的 FP8 路径在实际 LLM 训练中的精度损失是否可接受
- Hopper 的 TMA descriptor 配置细节
- 在 MoE 模型（不规则 batch）里 Flash Attention 的 padding 策略

## 知识关联

**上游依赖**：Self-Attention、Softmax 数值稳定性、GPU 内存层次结构

**下游延伸**：Flash Decoding（推理并行）、PagedAttention（KV Cache 管理）、CSA（稀疏压缩 Attention）
