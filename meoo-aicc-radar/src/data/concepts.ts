export interface Concept {
  id: string;
  name: string;
  shortName: string;
  category: 'frontier' | 'mature' | 'emerging';
  maturity: number;
  impact: number;
  complexity: number;
  summary: string;
  keyInsight: string;
  applications: string[];
  year: number;
}

export const concepts: Concept[] = [
  {
    id: 'flash-attention',
    name: 'Flash Attention',
    shortName: 'FA',
    category: 'mature',
    maturity: 92,
    impact: 95,
    complexity: 60,
    summary: 'IO 感知分块计算，注意力显存 O(N²)→O(N)，数学精确等价。',
    keyInsight: '不是近似——重新安排计算顺序避免 HBM 读写瓶颈。',
    applications: ['LLM 训练加速', '长序列推理', '实时语音'],
    year: 2022,
  },
  {
    id: 'mla',
    name: 'Multi-head Latent Attention',
    shortName: 'MLA',
    category: 'frontier',
    maturity: 65,
    impact: 88,
    complexity: 75,
    summary: 'KV Cache 压缩到低秩潜空间，大幅减少推理显存开销。',
    keyInsight: 'KV Cache 不需完整向量——低秩投影足以恢复注意力权重。',
    applications: ['超长上下文', '低成本部署', 'DeepSeek 核心'],
    year: 2024,
  },
  {
    id: 'csa',
    name: 'Compressed Sparse Attention',
    shortName: 'CSA',
    category: 'frontier',
    maturity: 45,
    impact: 82,
    complexity: 70,
    summary: '稀疏+压缩，进一步降低计算和存储成本。',
    keyInsight: '大部分注意力权重接近零——只计算重要 token 对。',
    applications: ['百万 token 上下文', '边缘设备', '实时翻译'],
    year: 2025,
  },
  {
    id: 'rope',
    name: 'Rotary Position Encoding',
    shortName: 'RoPE',
    category: 'mature',
    maturity: 90,
    impact: 85,
    complexity: 45,
    summary: '旋转矩阵编码位置，天然具备相对位置感知。',
    keyInsight: '旋转满足可加性——点积只取决于相对距离。',
    applications: ['几乎所有现代 LLM', '长度外推', '多模态编码'],
    year: 2021,
  },
  {
    id: 'langgraph',
    name: 'LangGraph State Machine',
    shortName: 'LGS',
    category: 'emerging',
    maturity: 70,
    impact: 78,
    complexity: 55,
    summary: 'Agent 工作流建模为有向图状态机，支持循环与人机交互。',
    keyInsight: 'Agent 不是线性管道——真实决策需要循环和状态回溯。',
    applications: ['多步推理 Agent', '人机协作', '复杂任务编排'],
    year: 2024,
  },
  {
    id: 'swarm',
    name: 'Swarm Agent Framework',
    shortName: 'SWA',
    category: 'emerging',
    maturity: 55,
    impact: 72,
    complexity: 50,
    summary: '轻量多 Agent 协作，handoff 机制传递控制权。',
    keyInsight: '多 Agent 不需中央调度——Agent 间可直接交接任务。',
    applications: ['客服路由', '代码审查流水线', '研究助手'],
    year: 2024,
  },
];

export const categoryLabels: Record<Concept['category'], string> = {
  frontier: '前沿探索',
  mature: '成熟落地',
  emerging: '新兴趋势',
};

export const categoryColors: Record<Concept['category'], string> = {
  frontier: 'bg-purple-100 text-purple-700',
  mature: 'bg-green-100 text-green-700',
  emerging: 'bg-amber-100 text-amber-700',
};
