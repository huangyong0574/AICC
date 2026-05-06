// ===== Types =====
export interface ChartConfig {
  type: 'dual-compare' | 'scenario-bar' | 'process-flow' | 'recursive-transform'
  title: string
  data: Record<string, unknown>
}

export interface LayerContent {
  id: string
  level: 1 | 2 | 3 | 4
  label: string
  subtitle: string
  analogy: string
  chart: ChartConfig
  conclusion: string
}

export interface MaterialTemplate {
  id: string
  type: 'pitch' | 'proposal' | 'qa' | 'calculator'
  title: string
  icon: string
  /** Each segment: string = fixed text; { placeholder, hint } = fill-in-blank */
  segments: Array<string | { placeholder: string; hint: string }>
}

export interface FeynmanCheckItem {
  id: string
  scenario: string
  question: string
  writePrompt?: string
}

export interface GraphNode {
  id: string
  label: string
  category: 'value' | 'app' | 'eng' | 'math' | 'concept'
  connections: string[]
}

export interface ExplorationResult {
  query: string
  layers: LayerContent[]
  materials: MaterialTemplate[]
  feynmanChecks: FeynmanCheckItem[]
  graphNodes: GraphNode[]
}

// ===== Four-Layer Content for "RAG 如何帮助企业落地大模型" =====

export const sampleResult: ExplorationResult = {
  query: 'RAG（检索增强生成）如何帮助企业落地大模型？',

  layers: [
    {
      id: 'l1',
      level: 1,
      label: '客户价值',
      subtitle: '为什么企业应该关注 RAG？',
      analogy:
        '想象你新招了一个天才实习生（大模型），聪明绝顶但入职第一天对公司一无所知。你不会让他背下公司所有文档——你会给他一个智能搜索系统，让他每次回答前先查阅相关资料。RAG 就是这个"入职第一天即可用"的智能搜索系统。',
      chart: {
        type: 'dual-compare',
        title: '纯大模型 vs RAG 增强',
        data: {
          left: {
            label: '纯大模型直接回答',
            items: [
              { label: '企业知识准确率', value: 35, unit: '%' },
              { label: '回答时效性', value: 20, unit: '%' },
              { label: '可追溯性', value: 10, unit: '%' },
              { label: '部署后即用', value: 40, unit: '%' },
            ],
          },
          right: {
            label: 'RAG 增强回答',
            items: [
              { label: '企业知识准确率', value: 88, unit: '%' },
              { label: '回答时效性', value: 92, unit: '%' },
              { label: '可追溯性', value: 95, unit: '%' },
              { label: '部署后即用', value: 85, unit: '%' },
            ],
          },
        },
      },
      conclusion:
        'RAG 让大模型从"通用聪明人"变成"企业专属顾问"——不改变模型本身，只给它配上企业知识库，即可获得准确、可追溯、实时更新的专业回答。对企业而言，这意味着更低的落地门槛和更快的价值验证周期。',
    },
    {
      id: 'l2',
      level: 2,
      label: '应用表现',
      subtitle: 'RAG 在不同场景下表现如何？',
      analogy:
        '就像一个优秀的咨询顾问——接到问题后不会立刻拍脑袋，而是先翻阅过往案例库和行业报告，确认事实后再给出有理有据的建议。RAG 让 AI 具备了"先查后答"的工作习惯。',
      chart: {
        type: 'scenario-bar',
        title: '不同场景下 RAG 提升幅度',
        data: {
          bars: [
            { label: '客服知识库问答', before: 42, after: 91, unit: '分' },
            { label: '合同条款审查', before: 28, after: 85, unit: '分' },
            { label: '产品文档检索', before: 35, after: 93, unit: '分' },
            { label: '市场研报分析', before: 30, after: 78, unit: '分' },
            { label: '内部流程咨询', before: 38, after: 89, unit: '分' },
          ],
        },
      },
      conclusion:
        '在知识密集型场景（如客服、合规、文档检索）中，RAG 可将回答质量从 30-40 分提升至 80-93 分。提升最显著的场景特征：知识更新频繁、需要引用具体来源、答案需要高准确性。',
    },
    {
      id: 'l3',
      level: 3,
      label: '工程机制',
      subtitle: 'RAG 的工作流程是怎样的？',
      analogy:
        '就像一座现代图书馆的运作——读者（用户问题）到前台，图书管理员（检索系统）根据问题找到最相关的几本书（知识片段），然后交给专家（大模型）阅读这些资料后给出综合回答。',
      chart: {
        type: 'process-flow',
        title: 'RAG 工程管线',
        data: {
          steps: [
            { id: 's1', label: '文档切片', desc: '将企业文档按语义段落分割为 Chunks' },
            { id: 's2', label: '向量编码', desc: '通过 Embedding 模型将文本转为高维向量' },
            { id: 's3', label: '存入向量库', desc: '写入 Milvus / Pinecone 等向量数据库' },
            { id: 's4', label: '问题编码', desc: '用户问题同样转为向量表示' },
            { id: 's5', label: '相似度检索', desc: '在向量库中找出 Top-K 最相关片段' },
            { id: 's6', label: 'Prompt 组装', desc: '将检索片段注入 Prompt 模板' },
            { id: 's7', label: 'LLM 生成', desc: '大模型基于上下文生成最终回答' },
          ],
        },
      },
      conclusion:
        'RAG 的核心工程链路 = 离线索引（切片→编码→入库）+ 在线查询（编码→检索→组装→生成）。关键工程决策点：Chunk 大小、Embedding 模型选择、检索策略（混合检索 vs 纯向量）、Prompt 模板设计。',
    },
    {
      id: 'l4',
      level: 4,
      label: '数学本质',
      subtitle: '检索增强为何有效？',
      analogy:
        '就像在一个超高维空间（比如 1536 维）中，每段文本都是一个点。"查找相关内容"本质上就是"找这个空间里最近的几个点"——这就是向量相似度搜索的几何直觉。',
      chart: {
        type: 'recursive-transform',
        title: '从文本到向量的变换',
        data: {
          transforms: [
            { from: '原始文本', to: 'Token 序列', formula: 'Tokenize(text) → [t₁, t₂, ..., tₙ]' },
            { from: 'Token 序列', to: '嵌入矩阵', formula: 'Embed(tokens) → ℝⁿˣᵈ' },
            { from: '嵌入矩阵', to: '语义向量', formula: 'Pool(H) → v ∈ ℝᵈ' },
            { from: '查询向量 q', to: 'Top-K 结果', formula: 'sim(q, dᵢ) = q·dᵢ / (‖q‖·‖dᵢ‖)' },
          ],
        },
      },
      conclusion:
        '数学本质：RAG 将离散的自然语言映射到连续向量空间，通过余弦相似度（或内积）度量语义距离，检索出最相关的上下文片段。这比关键词匹配更强大，因为它捕获了语义层面的"含义相似"而非"字面相同"。',
    },
  ],

  materials: [
    {
      id: 'm1',
      type: 'pitch',
      title: '客户沟通话术',
      icon: 'messageSquare',
      segments: [
        '您好，关于贵司在',
        { placeholder: '___客户行业___', hint: '如：金融/制造/零售' },
        '领域落地大模型的需求，我们建议采用 RAG 架构方案。通俗来讲，RAG 就是',
        { placeholder: '___用一句话类比解释___', hint: '如：给大模型配一本随时更新的企业专属词典' },
        '。在类似场景中，客户部署 RAG 后，',
        { placeholder: '___核心指标___', hint: '如：客服首次解决率' },
        '提升了约',
        { placeholder: '___百分比___', hint: '如：45%' },
        '，同时大幅降低了人工复核成本。',
      ],
    },
    {
      id: 'm2',
      type: 'proposal',
      title: '方案文案段落',
      icon: 'fileText',
      segments: [
        '【方案概述】本方案为',
        { placeholder: '___客户名称___', hint: '如：XX集团' },
        '的',
        { placeholder: '___业务场景___', hint: '如：智能客服/知识管理' },
        '场景提供 RAG 增强型大模型解决方案。核心架构包含：1）企业知识库向量化索引层；2）混合检索引擎；3）大模型推理与回答生成层。预期可在',
        { placeholder: '___时间周期___', hint: '如：4-6周' },
        '内完成 POC 验证，关键验证指标为',
        { placeholder: '___验证指标___', hint: '如：回答准确率 ≥ 85%' },
        '。',
      ],
    },
    {
      id: 'm3',
      type: 'qa',
      title: '技术质疑应对',
      icon: 'shield',
      segments: [
        '【客户提问】"为什么不直接微调模型，而要用 RAG？"\n\n【建议回答】微调和 RAG 不是非此即彼。微调适合',
        { placeholder: '___微调适用场景___', hint: '如：固定的语气风格/特定任务格式' },
        '，而 RAG 的优势在于：1）知识可随时更新，无需重新训练；2）回答可追溯到具体来源文档；3）部署成本显著更低。对于',
        { placeholder: '___客户具体场景___', hint: '如：政策法规频繁变更的合规审查' },
        '场景，RAG 是更务实的选择，因为',
        { placeholder: '___给出具体原因___', hint: '如：法规月均更新3次，微调周期无法覆盖' },
        '。',
      ],
    },
    {
      id: 'm4',
      type: 'calculator',
      title: 'ROI 测算框架',
      icon: 'calculator',
      segments: [
        '【成本项】向量数据库月费 ≈ ¥',
        { placeholder: '___向量库费用___', hint: '如：3,000' },
        ' + LLM API 调用费 ≈ ¥',
        { placeholder: '___API月费___', hint: '如：8,000' },
        '/月（按日均',
        { placeholder: '___调用量___', hint: '如：5,000' },
        '次估算）\n\n【收益项】人工处理减少 ≈',
        { placeholder: '___减少人数___', hint: '如：3' },
        '人 × ¥',
        { placeholder: '___人均月薪___', hint: '如：15,000' },
        '/月 + 响应速度提升带来的客户满意度增长 ≈',
        { placeholder: '___满意度提升___', hint: '如：20%' },
        '\n\n【预计 ROI 周期】',
        { placeholder: '___回本周期___', hint: '如：2-3个月' },
      ],
    },
  ],

  feynmanChecks: [
    {
      id: 'f1',
      scenario: '老板问你',
      question: '如果老板问"RAG 和直接用 ChatGPT 有什么区别"，你能用一个比喻在 30 秒内讲清楚吗？',
      writePrompt: '写下你的 30 秒电梯话术：',
    },
    {
      id: 'f2',
      scenario: '客户质疑',
      question: '客户说"我们数据量不大，有必要上 RAG 吗？"——你能列出 3 个仍然需要 RAG 的理由吗？',
      writePrompt: '写下你的 3 个理由：',
    },
    {
      id: 'f3',
      scenario: '技术对接',
      question: '你能画出 RAG 的 7 步工程管线吗？（从文档切片到最终生成）',
    },
    {
      id: 'f4',
      scenario: '竞品对比',
      question: '竞对说他们的方案"用微调更好"，你能解释为什么 RAG 在知识频繁更新场景下优于微调吗？',
      writePrompt: '写下你的反驳要点：',
    },
    {
      id: 'f5',
      scenario: '内部汇报',
      question: '你能用"余弦相似度"这个概念向非技术同事解释向量检索为什么比关键词搜索更准确吗？',
      writePrompt: '用生活中的例子解释：',
    },
  ],

  graphNodes: [
    { id: 'rag', label: 'RAG', category: 'concept', connections: ['embedding', 'vectordb', 'llm', 'chunking', 'prompt'] },
    { id: 'embedding', label: '向量编码', category: 'eng', connections: ['rag', 'cosine', 'vectordb'] },
    { id: 'vectordb', label: '向量数据库', category: 'eng', connections: ['rag', 'embedding', 'retrieval'] },
    { id: 'llm', label: '大语言模型', category: 'eng', connections: ['rag', 'prompt', 'finetuning'] },
    { id: 'chunking', label: '文档切片', category: 'eng', connections: ['rag', 'embedding'] },
    { id: 'prompt', label: 'Prompt 工程', category: 'eng', connections: ['rag', 'llm'] },
    { id: 'cosine', label: '余弦相似度', category: 'math', connections: ['embedding', 'retrieval'] },
    { id: 'retrieval', label: '语义检索', category: 'app', connections: ['vectordb', 'cosine', 'customer-service'] },
    { id: 'customer-service', label: '智能客服', category: 'app', connections: ['retrieval', 'business-value'] },
    { id: 'business-value', label: '企业价值', category: 'value', connections: ['customer-service', 'roi'] },
    { id: 'roi', label: 'ROI 测算', category: 'value', connections: ['business-value'] },
    { id: 'finetuning', label: '模型微调', category: 'eng', connections: ['llm'] },
  ],
}

// Quick suggestions for the input screen
export const quickSuggestions = [
  'RAG 如何帮助企业落地大模型？',
  'MoE 混合专家架构对推理成本有什么影响？',
  'Agent 框架能给企业带来什么价值？',
  '大模型幻觉问题怎么向客户解释？',
]
