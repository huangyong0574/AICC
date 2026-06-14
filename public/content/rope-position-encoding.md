---
title: RoPE 旋转位置编码：从公式到工程实现
subtitle: 为什么相对位置 = 绝对位置的旋转？把欧拉公式重新讲一遍
date: 2026-05-15
category: LLM 算法原理
tags: [rope, position-encoding, llama, transformer]
status: 审计中
readtime: 13 min
---

## TL;DR

> [!tldr] 一句话
> RoPE 用旋转矩阵编码绝对位置，使得 QK 点积只依赖两者的**相对位置差**，优雅地将「相对位置」编码进 Attention 计算，同时支持长度外推。LLaMA、GPT-NeoX、Mistral 等主流模型都用它。

## 它解决什么问题

Transformer 的 Self-Attention 本身是**置换不变的**（permutation-invariant）：打乱 token 顺序，输出不变。但语言有顺序，所以必须显式注入位置信息。

位置编码的历史：

| 方法 | 代表 | 问题 |
|------|------|------|
| 绝对正弦位置编码 | 原始 Transformer | 不能感知相对位置 |
| 可学习绝对位置编码 | BERT, GPT-2 | 长度不可外推 |
| 相对位置编码（T5 bias）| T5 | 计算开销大，需修改 Attention 矩阵 |
| **RoPE** | LLaMA, DeepSeek | 优雅、高效、支持外推 |

RoPE 的核心优势：**不需要修改 Attention 计算结构**，只在 Q 和 K 上乘以旋转矩阵，相对位置自动从点积中涌现。

## 数学推导

### 二维情形

设 token 位置 m，向量 q = [q₁, q₂]（2维）。RoPE 定义旋转函数：

```
R(m) = [[cos(mθ), -sin(mθ)],
         [sin(mθ),  cos(mθ)]]

f(q, m) = R(m) @ q
```

计算位置 m 的 q 和位置 n 的 k 的点积：

```
f(q, m)ᵀ f(k, n)
= (R(m)q)ᵀ (R(n)k)
= qᵀ R(m)ᵀ R(n) k
= qᵀ R(n-m) k         ← 只依赖相对位置 (n-m)！
```

关键性质：`R(m)ᵀ R(n) = R(n-m)`，因为旋转矩阵满足 `R(a)ᵀ = R(-a)`。

### 扩展到高维

实际的 head dimension d=128。RoPE 把向量分成 d/2 个二维对：

```
q = [q₁, q₂, q₃, q₄, ..., q_{d-1}, q_d]
  →  [(q₁,q₂), (q₃,q₄), ..., (q_{d-1},q_d)]

每对使用不同频率 θᵢ = 10000^(-2i/d)
```

完整旋转矩阵是块对角矩阵：

```
R(m) = diag(R(mθ₁), R(mθ₂), ..., R(mθ_{d/2}))
```

### 用复数理解（最简洁视角）

把每个二维对 (q₁, q₂) 视为复数 q₁ + iq₂：

```
f(q, m) = q × e^{imθ}    # 乘以单位复数 = 旋转

点积：Re[(f(q,m))* × f(k,n)]
    = Re[q* e^{-imθ} × k e^{inθ}]
    = Re[q* k × e^{i(n-m)θ}]    ← 只依赖 (n-m)
```

这就是为什么说「相对位置 = 绝对位置的旋转差」。

## 工程实现

### PyTorch 实现

```python
def precompute_freqs_cis(dim: int, max_seq_len: int, theta: float = 10000.0):
    """预计算旋转频率（复数形式）"""
    freqs = 1.0 / (theta ** (torch.arange(0, dim, 2).float() / dim))
    t = torch.arange(max_seq_len)
    freqs = torch.outer(t, freqs)  # [seq_len, dim/2]
    # 转为复数：cos + i*sin
    freqs_cis = torch.polar(torch.ones_like(freqs), freqs)
    return freqs_cis

def apply_rotary_emb(xq, xk, freqs_cis):
    """对 Q 和 K 应用 RoPE"""
    # 把最后一维重塑为复数
    xq_ = torch.view_as_complex(xq.float().reshape(*xq.shape[:-1], -1, 2))
    xk_ = torch.view_as_complex(xk.float().reshape(*xk.shape[:-1], -1, 2))
    # 旋转（复数乘法）
    xq_out = torch.view_as_real(xq_ * freqs_cis).flatten(3)
    xk_out = torch.view_as_real(xk_ * freqs_cis).flatten(3)
    return xq_out.type_as(xq), xk_out.type_as(xk)
```

### θ 值的选择

原始 RoPE 使用 `θ = 10000`。长上下文模型通常增大 θ：

```
LLaMA 2（4096 ctx）：θ = 10000
LLaMA 3（128k ctx）：θ = 500000
DeepSeek-V2：        θ = 10000（配合 YaRN 外推）
```

增大 θ 使低频分量旋转更慢，长距离 token 之间的位置差异更小，有助于长度外推。

## 类比

把 RoPE 比作「表盘刻度」：

- 每个 token 像一根表针，位置决定它转到哪个角度
- 两根表针的点积（相关性）只取决于**它们之间的夹角**，不取决于绝对位置
- 不同频率的表盘（θᵢ）像时钟的秒针、分针、时针，分别记录细粒度和粗粒度的位置信息

边界：表针是定长的，RoPE 的向量模长不变，只旋转方向。

## 我现在还不懂的地方

- YaRN（Yet another RoPE extensioN）的内插公式与原始 position interpolation 的具体差异
- RoPE 在 MLA（低秩 KV 压缩）里的解耦实现细节
- `θ` 值对不同语言（中文 vs 英文）的影响是否有实测数据
- Flash Attention 里 RoPE 是在 kernel 内还是 kernel 外应用

## 知识关联

**上游依赖**：Self-Attention、欧拉公式、复数乘法

**下游延伸**：YaRN（长度外推）、ALiBi（无旋转的相对偏置）、MLA（RoPE 解耦）、LongRoPE
