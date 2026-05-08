# AI 大模型核心算法概念知识图谱

> 收录 2022 年 GPT 问世以来，已广泛应用于全球热门大模型的关键算法技术概念。
> 每个条目包含：概念简称、全称、一句话描述、首次提出论文/出处链接。

---

## 注意力机制与架构创新

| 概念 | 全称 | 一句话描述 | 首次提出 |
|------|------|-----------|---------|
| Flash Attention | FlashAttention: Fast and Memory-Efficient Exact Attention | 通过 IO 感知的分块计算实现精确注意力的显存优化与加速 | [Dao et al., 2022](https://arxiv.org/abs/2205.14135) |
| GQA | Grouped-Query Attention | 将查询头分组共享 KV 对，在 MHA 精度与 MQA 速度间取最优平衡 | [Ainslie et al., 2023](https://arxiv.org/abs/2305.13245) |
| MLA | Multi-head Latent Attention | 将 KV 投影到低维潜空间，大幅压缩 KV Cache 同时保持多头表达力 | [DeepSeek-V2, 2024](https://arxiv.org/abs/2405.04434) |
| Sliding Window Attention | Sliding Window Attention | 限制注意力窗口为固定大小实现线性复杂度长序列处理 | [Mistral 7B, 2023](https://arxiv.org/abs/2310.06825) |
| Ring Attention | Ring Attention with Blockwise Transformers | 将序列分块分布到多设备环形传递，实现近无限上下文长度 | [Liu et al., 2023](https://arxiv.org/abs/2310.01889) |
| NSA | Native Sparse Attention | 硬件对齐的可原生训练稀疏注意力，兼顾效率与建模能力 | [DeepSeek, 2025](https://arxiv.org/abs/2502.11089) |
| PagedAttention | Paged Attention for KV Cache | 借鉴操作系统分页内存管理 KV Cache，提升推理吞吐量 | [Kwon et al., 2023 (vLLM)](https://arxiv.org/abs/2309.06180) |

## 位置编码

| 概念 | 全称 | 一句话描述 | 首次提出 |
|------|------|-----------|---------|
| RoPE | Rotary Position Embedding | 通过旋转矩阵编码相对位置，天然支持长度外推 | [Su et al., 2021/2024](https://arxiv.org/abs/2104.09864) |

## 模型架构

| 概念 | 全称 | 一句话描述 | 首次提出 |
|------|------|-----------|---------|
| MoE | Mixture-of-Experts | 稀疏激活多专家网络，以固定计算量扩展模型容量 | [Shazeer et al., 2017; Mixtral 2024](https://arxiv.org/abs/2401.04088) |
| GDN | Gated Delta Network | 用门控增量规则实现线性复杂度的选择性记忆更新 | [Yang et al., 2024/2025](https://arxiv.org/abs/2604.19021) |
| Mamba | Selective State Space Model | 选择性状态空间模型，线性时间序列建模替代 Transformer | [Gu & Dao, 2023](https://arxiv.org/abs/2312.00752) |
| RetNet | Retentive Network | 同时支持并行训练、循环推理和分块计算的三态架构 | [Sun et al., 2023 (Microsoft)](https://arxiv.org/abs/2307.08621) |
| RWKV | Receptance Weighted Key Value | 融合 Transformer 并行训练与 RNN 高效推理的线性架构 | [Peng et al., 2023](https://arxiv.org/abs/2305.13048) |
| DiT | Diffusion Transformer | 用 Transformer 替代 U-Net 作为扩散模型骨干网络 | [Peebles & Xie, 2023](https://arxiv.org/abs/2212.09748) |
| KAN | Kolmogorov-Arnold Networks | 基于 Kolmogorov-Arnold 表示定理的可学习激活函数网络 | [Liu et al., 2024 (MIT)](https://arxiv.org/abs/2404.19756) |
| mHC | Manifold-Constrained Hyper-Connections | 流形约束的超连接，解决深层网络表示坍塌与训练不稳定 | [DeepSeek, 2024](https://arxiv.org/abs/2512.24880) |
| MoD | Mixture-of-Depths | 动态分配计算深度，让 Transformer 对不同 token 用不同计算量 | [Raposo et al., 2024 (Google)](https://arxiv.org/abs/2404.02258) |
| BLT | Byte Latent Transformer | 无分词器架构，直接处理字节序列并动态分组为 patch | [Meta, 2024](https://arxiv.org/abs/2412.09871) |

## 训练与对齐

| 概念 | 全称 | 一句话描述 | 首次提出 |
|------|------|-----------|---------|
| RLHF | Reinforcement Learning from Human Feedback | 用人类偏好反馈训练奖励模型，再用 RL 对齐语言模型 | [Ouyang et al., 2022 (OpenAI)](https://arxiv.org/abs/2203.02155) |
| DPO | Direct Preference Optimization | 跳过奖励模型，直接用偏好数据优化语言模型策略 | [Rafailov et al., 2023 (Stanford)](https://arxiv.org/abs/2305.18290) |
| GRPO | Group Relative Policy Optimization | 组内相对奖励替代 Critic，低成本实现推理能力强化 | [DeepSeek, 2024](https://arxiv.org/abs/2402.03300) |
| Constitutional AI | Constitutional AI / RLAIF | 用 AI 自身反馈替代人类标注实现规模化对齐 | [Anthropic, 2022](https://arxiv.org/abs/2212.08073) |

## 高效微调与压缩

| 概念 | 全称 | 一句话描述 | 首次提出 |
|------|------|-----------|---------|
| LoRA | Low-Rank Adaptation | 冻结原始权重，只训练低秩分解矩阵实现高效微调 | [Hu et al., 2021 (Microsoft)](https://arxiv.org/abs/2106.09685) |
| GPTQ | Post-Training Quantization for GPT | 基于二阶信息的逐层权重量化，4-bit 压缩几乎无损 | [Frantar et al., 2022](https://arxiv.org/abs/2210.17323) |
| AWQ | Activation-aware Weight Quantization | 根据激活分布保护关键权重通道的低比特量化 | [Lin et al., 2023 (MIT)](https://arxiv.org/abs/2306.00978) |

## 推理加速

| 概念 | 全称 | 一句话描述 | 首次提出 |
|------|------|-----------|---------|
| Speculative Decoding | Speculative Decoding | 小模型草拟 + 大模型验证，无损加速自回归生成 | [Leviathan et al., 2022 (Google)](https://arxiv.org/abs/2211.17192) |
| Multi-Token Prediction | Multi-Token Prediction | 训练模型同时预测多个未来 token，提升采样效率与表征质量 | [Gloeckle et al., 2024 (Meta)](https://arxiv.org/abs/2404.19737) |
| Test-Time Compute | Test-Time Compute Scaling | 推理时增加计算（长思维链）换取更强推理能力 | [OpenAI o1, 2024](https://openai.com/index/learning-to-reason-with-llms/) |

## 提示工程与推理范式

| 概念 | 全称 | 一句话描述 | 首次提出 |
|------|------|-----------|---------|
| CoT | Chain-of-Thought Prompting | "让我们一步步思考"引导 LLM 显式推理链 | [Wei et al., 2022 (Google)](https://arxiv.org/abs/2201.11903) |
| RAG | Retrieval-Augmented Generation | 检索外部知识增强生成，减少幻觉并保持知识时效性 | [Lewis et al., 2020 (Meta)](https://arxiv.org/abs/2005.11401) |

---

## 数据格式说明

本文件同时作为前端"示例概念"的数据源。前端读取规则：
- 每个表格行中的 **概念** 列作为显示标签
- **全称** 列作为补充说明
- **首次提出** 列的链接作为参考 URL
- 前端按分类随机抽取展示，为用户提供冷启动选择
