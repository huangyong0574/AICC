/**
 * AI 大模型核心算法概念知识图谱
 * 数据源：src/feynman/data/algorithm-concepts.md
 * 用途：首页示例概念选择 + 冷启动知识图谱
 */
export interface AlgorithmConcept {
  /** 显示简称 */
  label: string
  /** 概念全称 */
  fullName: string
  /** 一句话描述 */
  description: string
  /** 论文/出处链接 */
  url: string
  /** 分类标签 */
  category: string
}

export const ALGORITHM_CONCEPTS: AlgorithmConcept[] = [
  // === 注意力机制与架构创新 ===
  {
    label: "Flash Attention",
    fullName: "FlashAttention: Fast and Memory-Efficient Exact Attention",
    description: "通过 IO 感知的分块计算实现精确注意力的显存优化与加速",
    url: "https://arxiv.org/abs/2205.14135",
    category: "注意力机制",
  },
  {
    label: "GQA（Grouped-Query Attention）",
    fullName: "Grouped-Query Attention",
    description: "将查询头分组共享 KV 对，在 MHA 精度与 MQA 速度间取最优平衡",
    url: "https://arxiv.org/abs/2305.13245",
    category: "注意力机制",
  },
  {
    label: "MLA（Multi-head Latent Attention）",
    fullName: "Multi-head Latent Attention",
    description: "将 KV 投影到低维潜空间，大幅压缩 KV Cache 同时保持多头表达力",
    url: "https://arxiv.org/abs/2405.04434",
    category: "注意力机制",
  },
  {
    label: "Sliding Window Attention",
    fullName: "Sliding Window Attention",
    description: "限制注意力窗口为固定大小实现线性复杂度长序列处理",
    url: "https://arxiv.org/abs/2310.06825",
    category: "注意力机制",
  },
  {
    label: "Ring Attention",
    fullName: "Ring Attention with Blockwise Transformers",
    description: "将序列分块分布到多设备环形传递，实现近无限上下文长度",
    url: "https://arxiv.org/abs/2310.01889",
    category: "注意力机制",
  },
  {
    label: "NSA（Native Sparse Attention）",
    fullName: "Native Sparse Attention",
    description: "硬件对齐的可原生训练稀疏注意力，兼顾效率与建模能力",
    url: "https://arxiv.org/abs/2502.11089",
    category: "注意力机制",
  },
  {
    label: "PagedAttention",
    fullName: "Paged Attention for KV Cache",
    description: "借鉴操作系统分页内存管理 KV Cache，提升推理吞吐量",
    url: "https://arxiv.org/abs/2309.06180",
    category: "注意力机制",
  },

  // === 位置编码 ===
  {
    label: "RoPE（Rotary Position Embedding）",
    fullName: "Rotary Position Embedding",
    description: "通过旋转矩阵编码相对位置，天然支持长度外推",
    url: "https://arxiv.org/abs/2104.09864",
    category: "位置编码",
  },

  // === 模型架构 ===
  {
    label: "MOE（Mixture-of-Experts）",
    fullName: "Mixture-of-Experts",
    description: "稀疏激活多专家网络，以固定计算量扩展模型容量",
    url: "https://arxiv.org/abs/2401.04088",
    category: "模型架构",
  },
  {
    label: "GDN（Gated Delta Network）",
    fullName: "Gated Delta Network",
    description: "用门控增量规则实现线性复杂度的选择性记忆更新",
    url: "https://arxiv.org/abs/2604.19021",
    category: "模型架构",
  },
  {
    label: "Mamba（Selective SSM）",
    fullName: "Selective State Space Model",
    description: "选择性状态空间模型，线性时间序列建模替代 Transformer",
    url: "https://arxiv.org/abs/2312.00752",
    category: "模型架构",
  },
  {
    label: "RetNet（Retentive Network）",
    fullName: "Retentive Network",
    description: "同时支持并行训练、循环推理和分块计算的三态架构",
    url: "https://arxiv.org/abs/2307.08621",
    category: "模型架构",
  },
  {
    label: "RWKV",
    fullName: "Receptance Weighted Key Value",
    description: "融合 Transformer 并行训练与 RNN 高效推理的线性架构",
    url: "https://arxiv.org/abs/2305.13048",
    category: "模型架构",
  },
  {
    label: "DiT（Diffusion Transformer）",
    fullName: "Diffusion Transformer",
    description: "用 Transformer 替代 U-Net 作为扩散模型骨干网络",
    url: "https://arxiv.org/abs/2212.09748",
    category: "模型架构",
  },
  {
    label: "KAN（Kolmogorov-Arnold Networks）",
    fullName: "Kolmogorov-Arnold Networks",
    description: "基于 Kolmogorov-Arnold 表示定理的可学习激活函数网络",
    url: "https://arxiv.org/abs/2404.19756",
    category: "模型架构",
  },
  {
    label: "mHC（Hyper-Connections）",
    fullName: "Manifold-Constrained Hyper-Connections",
    description: "流形约束的超连接，解决深层网络表示坍塌与训练不稳定",
    url: "https://arxiv.org/abs/2512.24880",
    category: "模型架构",
  },
  {
    label: "MoD（Mixture-of-Depths）",
    fullName: "Mixture-of-Depths",
    description: "动态分配计算深度，让 Transformer 对不同 token 用不同计算量",
    url: "https://arxiv.org/abs/2404.02258",
    category: "模型架构",
  },
  {
    label: "BLT（Byte Latent Transformer）",
    fullName: "Byte Latent Transformer",
    description: "无分词器架构，直接处理字节序列并动态分组为 patch",
    url: "https://arxiv.org/abs/2412.09871",
    category: "模型架构",
  },

  // === 训练与对齐 ===
  {
    label: "RLHF",
    fullName: "Reinforcement Learning from Human Feedback",
    description: "用人类偏好反馈训练奖励模型，再用 RL 对齐语言模型",
    url: "https://arxiv.org/abs/2203.02155",
    category: "训练与对齐",
  },
  {
    label: "DPO（Direct Preference Optimization）",
    fullName: "Direct Preference Optimization",
    description: "跳过奖励模型，直接用偏好数据优化语言模型策略",
    url: "https://arxiv.org/abs/2305.18290",
    category: "训练与对齐",
  },
  {
    label: "GRPO（Group Relative Policy Optimization）",
    fullName: "Group Relative Policy Optimization",
    description: "组内相对奖励替代 Critic，低成本实现推理能力强化",
    url: "https://arxiv.org/abs/2402.03300",
    category: "训练与对齐",
  },
  {
    label: "Constitutional AI（RLAIF）",
    fullName: "Constitutional AI",
    description: "用 AI 自身反馈替代人类标注实现规模化对齐",
    url: "https://arxiv.org/abs/2212.08073",
    category: "训练与对齐",
  },

  // === 高效微调与压缩 ===
  {
    label: "LoRA（Low-Rank Adaptation）",
    fullName: "Low-Rank Adaptation",
    description: "冻结原始权重，只训练低秩分解矩阵实现高效微调",
    url: "https://arxiv.org/abs/2106.09685",
    category: "高效微调",
  },
  {
    label: "GPTQ",
    fullName: "Post-Training Quantization for GPT",
    description: "基于二阶信息的逐层权重量化，4-bit 压缩几乎无损",
    url: "https://arxiv.org/abs/2210.17323",
    category: "高效微调",
  },
  {
    label: "AWQ（Activation-aware Weight Quantization）",
    fullName: "Activation-aware Weight Quantization",
    description: "根据激活分布保护关键权重通道的低比特量化",
    url: "https://arxiv.org/abs/2306.00978",
    category: "高效微调",
  },

  // === 推理加速 ===
  {
    label: "Speculative Decoding",
    fullName: "Speculative Decoding",
    description: "小模型草拟 + 大模型验证，无损加速自回归生成",
    url: "https://arxiv.org/abs/2211.17192",
    category: "推理加速",
  },
  {
    label: "Multi-Token Prediction",
    fullName: "Multi-Token Prediction",
    description: "训练模型同时预测多个未来 token，提升采样效率与表征质量",
    url: "https://arxiv.org/abs/2404.19737",
    category: "推理加速",
  },
  {
    label: "Test-Time Compute Scaling",
    fullName: "Test-Time Compute Scaling",
    description: "推理时增加计算（长思维链）换取更强推理能力",
    url: "https://openai.com/index/learning-to-reason-with-llms/",
    category: "推理加速",
  },

  // === 提示工程与推理范式 ===
  {
    label: "CoT（Chain-of-Thought）",
    fullName: "Chain-of-Thought Prompting",
    description: "用 Let us think step by step 引导 LLM 显式推理链",
    url: "https://arxiv.org/abs/2201.11903",
    category: "推理范式",
  },
  {
    label: "RAG（Retrieval-Augmented Generation）",
    fullName: "Retrieval-Augmented Generation",
    description: "检索外部知识增强生成，减少幻觉并保持知识时效性",
    url: "https://arxiv.org/abs/2005.11401",
    category: "推理范式",
  },
]
