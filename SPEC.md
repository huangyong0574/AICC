# AICC - AI Concept Penetration Learning Platform
## 产品规格说明书 (Product Specification)

> 版本：v1.0.1  
> 更新日期：2026-05-06  
> 状态：MVP 已完成，步骤闭环评价功能待实现  
> 代码包名：ai-knowledge-explorer

---

## 一、产品定位

**产品名称**：AICC (AI Concept Coach) / ai-knowledge-explorer  
**一句话描述**：面向 MaaS 行业非算法从业者的 AI 概念穿透学习平台，用费曼学习法在 15 分钟内讲透一个 AI 算法概念。  
**UI 展示名称**："你的AI认知教练"（header 展示）  
**副标题**："三大步骤流式 · 费曼内化 · Transformer 基线图谱"  
**首页标题**："算法实验到客户一线的认知桥梁"

**目标用户画像**：
- 大模型售前解决方案工程师
- AI 业务架构师
- 产品经理 / 技术销售
- 不写算法代码、不碰算法工程部署，但需要向客户讲解 AI 技术的从业者

**核心诉求**：在 arXiv、AI 实验室/科技公司技术论文上看到的算法概念，可以花 15 分钟左右理解，并以费曼学习法作为衡量标准，记录到长期记忆作为下次认知连结点。

**默认示例问题**（UI 中展示）：
- "什么是 GDN（Gated Delta Network）？"
- "Transformer 的 Attention 为什么是 O(N^2)？"
- "Mamba / 状态空间模型（SSM）和 RNN 的区别"
- "MoE（混合专家）的路由为什么有负载不均？"

---

## 二、核心痛点与产品解法

| 痛点 | 表现 | 产品解法 |
|------|------|----------|
| 认知频断层 | 论文/博客只讲数学或只讲业务，无法在"客户业务价值 <-> 工程收益 <-> 算法机制 <-> 数学公式"之间自由升维降维 | 三步骤递进：感性认识 -> 算法原理 -> 商业价值 |
| 认知负荷高 | 概念抽象、术语密集、公式抽象，非算法背景理解慢、易放弃 | 费曼学习法：预热 3 问倒逼思考 + 多角色讲解 + 通俗类比 + 动画可视化 |
| 知识碎片化 | Chatbox 问完即丢，无法与过往认知链接，无法形成个人方案资产复利 | 本地知识图谱自动挂载 + 笔记库持久化 + 多格式导出 |

---

## 三、功能架构

### 3.1 整体流程图

```
用户输入自然语言问题（如"GDN是什么意思？"）
        |
   费曼预热（3 问）<- LLM 动态生成
        |
   用户点击"我看完了，开始讲解"
        |
  +-----------------------------+
  |  步骤 1：装模作样            |
  |  概念与价值感性认识          |
  |  -> 价值铺垫 -> 专业定义    |
  |  -> 术语拆解 -> 示意图/动画 |
  |  -> 闭环问题（UI 占位）     |
  |  -> 用户点击确认，进入下一步 |
  +-----------------------------+
        | 确认
  +-----------------------------+
  |  步骤 2：像模像样            |
  |  算法原理与数学本质          |
  |  -> 技术演进时间轴           |
  |  -> 分步静态帧 + 动画演示   |
  |  -> Token 代入演算（LaTeX） |
  |  -> 闭环问题（UI 占位）     |
  |  -> 用户点击确认，进入下一步 |
  +-----------------------------+
        | 确认
  +-----------------------------+
  |  步骤 3：有模有样            |
  |  客户价值与商业价值          |
  |  -> 工程收益总结 + 指标表   |
  |  -> 业务价值总结 + 场景表   |
  |  -> 闭环 = 提示回到费曼 3 问|
  |  -> 确认后进入费曼内化面板   |
  +-----------------------------+
        | 确认
  +-----------------------------+
  |  费曼内化面板                |
  |  -> 用户填写 3 角色复述      |
  |  -> LLM 评估 + 知识图谱挂载 |
  +-----------------------------+
        | 完成
   素材导出（5 种方式）/ 查看知识图谱
```

### 3.2 功能模块清单

| 模块 | 功能 | 状态 | 备注 |
|------|------|------|------|
| **费曼预热** | 动态生成 3 个角色问题（业务总监/CTO/开发者） | ✅ 已实现 | LLM 调用 `callFeynmanWarmup()` |
| **步骤 1** | 概念与价值感性认识（4 部分 + 闭环占位） | ✅ 已实现 | LLM 调用 `callStep("step1")` |
| **步骤 2** | 算法原理与数学本质（时间轴+动画+公式+闭环占位） | ✅ 已实现 | LLM 调用 `callStep("step2")` |
| **步骤 3** | 客户价值与商业价值（工程+业务，无独立 loop 字段） | ✅ 已实现 | LLM 调用 `callStep("step3")` |
| **费曼内化** | 三角色复述评估 + 知识图谱自动生成 | ✅ 已实现 | LLM 调用 `callFeynmanReview()` |
| **知识图谱** | 以 Transformer 为基线的自动挂载 | ✅ 已实现 | `GraphDelta` 数据结构 |
| **笔记库** | 学习笔记的本地存储与管理 | ✅ 已实现 | localStorage 持久化 |
| **LLM 设置** | API Key / Base URL / 模型选择 / 离线模式 | ✅ 已实现 | 支持 qwen3.6-plus 等 |
| **素材导出** | 保存笔记库 + Markdown 下载/复制 + 讲稿片段 + PPT 要点 | ✅ 已实现 | 5 种导出方式 |
| **动画可视化** | 5 种内置动画（GDN-gate/Attention/Mamba/MoE/Generic） | ✅ 已实现 | CSS @keyframes + React 状态驱动 |
| **公式渲染** | KaTeX 数学公式渲染 | ✅ 已实现 | 支持 LaTeX 语法，自动标准化 |
| **离线预览** | 不消耗 API 的本地 fixture 演示 | ✅ 已实现 | 5 个 JSON 样本，模拟流式输出 |
| **闭环评价** | 步骤 1/2 闭环问题的 LLM 评分 + 解锁逻辑 | ⏳ UI 占位 | 当前为 disabled textarea，下一轮实现 |

### 3.3 步骤确认机制（当前实现）

> **重要说明**：当前版本中，步骤 1/2 的"闭环问题"仅为 UI 占位展示（`LoopBlock` 组件）。
> 用户点击"确认"按钮后直接进入下一步，**不经过 LLM 评价**。
> `LoopBlock` 的 Textarea 处于 `disabled` 状态，代码注释明确标注"下一轮会加入 LLM 评分 + 下一步解锁逻辑"。

---

## 四、技术架构

### 4.1 技术栈

| 类别 | 技术 | 版本 | 备注 |
|------|------|------|------|
| 前端框架 | React | 18.3.1 | 不使用 StrictMode（避免 LLM 双调用竞态） |
| 语言 | TypeScript | 5.6.2 | strict 模式 |
| 构建工具 | Vite | 6.0.5 | @vitejs/plugin-react |
| UI 组件库 | shadcn/ui + Radix UI | 最新 | dialog/label/progress/select/scroll-area/tabs 等 |
| 样式 | Tailwind CSS | 3.4.17 | + tailwindcss-animate + tailwind-merge |
| 图标 | Lucide React | 0.468.0 | |
| 公式渲染 | KaTeX | 0.16.45 | |
| Toast 通知 | Sonner | 2.0.7 | |
| 样式工具 | class-variance-authority | 0.7.1 | 组件变体管理 |
| LLM API | 阿里云 DashScope / 百炼 | - | 兼容 OpenAI 协议 |
| 数据存储 | localStorage | 浏览器原生 | |

**注意**：`package.json` 中列有 `react-router-dom@^7.1.1`，但代码中**未实际引用**（僵尸依赖），应用为单页无路由结构。

### 4.2 目录结构

```
AICC/
+-- src/
|   +-- gdn/                          # 主应用模块（当前活跃）
|   |   +-- GdnApp.tsx                # 应用入口
|   |   +-- types.ts                  # 数据类型定义（275 行）
|   |   +-- components/               # React 组件
|   |   |   +-- StepPipeline.tsx      # 三步骤管道（核心流程控制）
|   |   |   +-- FeynmanDigestPanel.tsx # 费曼内化面板
|   |   |   +-- GraphDialog.tsx       # 知识图谱对话框
|   |   |   +-- MechanismAnim.tsx     # GDN 门控动画（5 token 演示）
|   |   |   +-- SettingsDialog.tsx    # LLM 设置对话框
|   |   |   +-- LibraryDialog.tsx     # 笔记库对话框
|   |   |   +-- ExportBar.tsx         # 素材导出栏（5 种方式）
|   |   |   +-- FeynmanPrime.tsx      # 费曼预热卡片
|   |   |   +-- LoopBlock.tsx         # 闭环问题占位（disabled）
|   |   |   +-- Formula.tsx           # KaTeX 公式渲染组件
|   |   |   +-- views/
|   |   |       +-- Step1View.tsx     # 步骤 1 渲染
|   |   |       +-- Step2View.tsx     # 步骤 2 渲染
|   |   |       +-- Step3View.tsx     # 步骤 3 渲染
|   |   |       +-- PrincipleView.tsx # 原理分步帧视图
|   |   |       +-- MathView.tsx      # 数学公式与演算视图
|   |   |       +-- TimelineView.tsx  # 时间轴视图（旧版）
|   |   |       +-- AnalogyView.tsx   # 通俗类比视图（旧版）
|   |   |       +-- EngineeringView.tsx # 工程指标视图（旧版）
|   |   |       +-- BusinessView.tsx  # 商业价值视图（旧版）
|   |   |       +-- animations/
|   |   |           +-- AttentionOnTwoAnim.tsx
|   |   |           +-- MambaSsmAnim.tsx
|   |   |           +-- MoeRouteAnim.tsx
|   |   |           +-- GenericFlowAnim.tsx
|   |   +-- lib/
|   |   |   +-- llm.ts               # LLM 调用接口（含旧版 callQa/callQaStream）
|   |   |   +-- prompts.ts           # 提示词集中管理（284 行）
|   |   |   +-- storage.ts           # localStorage 持久化
|   |   |   +-- mdExport.ts          # 多格式导出工具
|   |   +-- mocks/
|   |       +-- fixtures.ts          # 离线预览 + 流式模拟
|   |       +-- data/                # 5 个 JSON 样本
|   +-- components/ui/               # shadcn/ui 基础组件（12 个）
|   +-- lib/utils.ts                 # 通用工具（cn 函数）
|   +-- App.tsx                      # 旧版入口（不再使用）
|   +-- main.tsx                     # 启动入口（直接渲染 GdnApp，无 Router）
|   +-- index.css                    # 全局样式 + CSS Variables
+-- scripts/
|   +-- test-main-flow.mjs           # 端到端测试
|   +-- test-step1.mjs               # 步骤 1 单元测试
+-- package.json
+-- tsconfig.json / tsconfig.app.json
+-- vite.config.ts
+-- tailwind.config.ts
+-- postcss.config.js
```

### 4.3 核心数据流

```
用户输入 -> GdnApp.tsx（状态管理，无 Router）
              |
    callFeynmanWarmup() -> LLM -> 3 个预热问题
              |
    用户确认（warmupConfirmed = true）
              |
    StepPipeline 自动触发 callStep("step1")
              |              |
    Step1View.tsx <- 解析 <- 流式渲染 (SSE onText 回调)
              |
    用户点击确认 -> confirmAndNext(0) -> 自动触发 callStep("step2")
              |
    Step2View.tsx <- 解析 <- 流式渲染 + 动画播放
              |
    用户点击确认 -> confirmAndNext(1) -> 自动触发 callStep("step3")
              |
    Step3View.tsx <- 解析 <- 流式渲染
              |
    用户点击确认 -> allConfirmed = true -> 显示 FeynmanDigestPanel
              |
    用户填写 3 角色复述 -> callFeynmanReview() -> LLM -> 评估 + GraphDelta
              |
    upsertGraph(graph) -> localStorage
```

### 4.4 LLM 调用矩阵

| 调用点 | 函数 | 模型 | 流式 | 联网 | 思考 | JSON Schema | 触发时机 |
|--------|------|------|------|------|------|-------------|----------|
| 费曼预热 | `callFeynmanWarmup` | qwen3.6-plus | x | yes | x | x | 问题输入后 |
| 步骤 1 | `callStep("step1")` | qwen3.6-plus | yes | yes | yes | json_object | 预热确认后（自动） |
| 步骤 2 | `callStep("step2")` | qwen3.6-plus | yes | yes | yes | json_object | step1 确认后（自动） |
| 步骤 3 | `callStep("step3")` | qwen3.6-plus | yes | yes | yes | json_object | step2 确认后（自动） |
| 费曼内化 | `callFeynmanReview` | qwen3.6-plus | x | yes | yes | json_object | 用户手动提交 |

### 4.5 存储系统

| Key | 内容 | 数据结构 |
|-----|------|----------|
| `gdn_llm_cfg_v3` | LLM 配置 | `{ apiKey, baseUrl, model, offlineMock }` |
| `gdn_notes_v3` | 笔记库 | `Note[]` 数组 |
| `gdn_graph_v3` | 知识图谱 | `GraphDelta[]` 数组 |

### 4.6 工程决策记录

| 决策 | 原因 | 代码位置 |
|------|------|----------|
| 不使用 React.StrictMode | 避免 useEffect 双跑导致 LLM 被调用两次 + AbortController 竞态 | `main.tsx` |
| 旧版六问代码保留 | `types.ts` 保留 QaKey/QaAnswerMap 等完整类型；`llm.ts` 保留 callQa/callQaStream 函数；`Note.qa?` 用于旧笔记兼容 | `types.ts`, `llm.ts` |
| react-router-dom 未使用 | 安装但未引入，应用为单页结构 | `package.json` |

---

## 五、详细功能规格

### 5.1 费曼预热

**目标**：用 3 个面向不同角色的问题倒逼用户认真思考后续讲解内容。

**输入**：用户原始问题（如"GDN是什么意思？"）

**LLM 生成要求**：
- 代入具体概念，不要用模板原话
- 以客户口吻来问
- 每个问题 <= 50 字
- 输出 JSON 数组：`[{role, question}]`

**三个角色**（UI 标签文案）：
1. `biz` - "你可以和客户的非技术人员说明白吗？（例如业务总监）"
   - hint: "让完全不懂技术的人快速理解价值"
2. `cto` - "你可以和客户的技术高管建立价值链接吗？（例如 CTO）"
   - hint: "和技术决策者对话，关心成本/稳定性/改造影响"
3. `dev` - "你可以和客户的程序员共情这个优势吗？（例如程序员/运维）"
   - hint: "工程师视角，关心怎么调、踩坑在哪、上手时间"

**UI 展示**：竖向列表展示 3 个问题卡片（含角色图标 + 动态问题文本），下方显示"我看完了，开始讲解"按钮。

---

### 5.2 步骤 1：装模作样｜概念与价值感性认识

**LLM 输出 Schema**：

```typescript
interface Step1Answer {
  valueLead: string;          // 通俗案例铺垫（100-200 字）
  officialDefinition: string; // 权威专业定义（80-150 字，引用来源）
  glossaryTerms: {            // 术语拆解（GlossaryTerm[]）
    term: string;             // 专业术语名
    plainHint: string;        // 大白话/生活比喻
    techNote: string;         // 技术含义
  }[];
  diagram: {                  // ConceptDiagram
    animationKey: "gdn-gate" | "attention-on2" | "mamba-ssm" | "moe-route" | "generic-flow";
    caption: string;          // 结合案例的说明（<60 字）
  };
  loop: {                     // LoopCheck
    prompt: string;           // 闭环问题（<60 字）
    userAnswer?: string;      // 用户回答（当前版本未启用输入）
    review?: LoopReview;      // LLM 评价（当前版本未实现）
  };
}
```

**内容结构**：
1. **价值铺垫**：用生活化案例先揭示旧问题/痛点
2. **专业定义**：基于权威资料的精确定义
3. **术语拆解**：基于 Transformer 基线，挑出可能不懂的专业词（双解释：通俗类比 + 技术视角）
4. **示意图/动画**：选择匹配的动画演示
5. **闭环问题**：让用户用自己的话说原理与价值（当前为 UI 占位，不发送给 LLM）

**animationKey 选择规则**：
- GDN -> `gdn-gate`（MechanismAnim 组件：5 token 门控动画）
- Attention -> `attention-on2`（AttentionOnTwoAnim）
- Mamba/SSM -> `mamba-ssm`（MambaSsmAnim）
- MoE -> `moe-route`（MoeRouteAnim）
- 其他 -> `generic-flow`（GenericFlowAnim）

---

### 5.3 步骤 2：像模像样｜算法原理与数学本质

**LLM 输出 Schema**：

```typescript
interface Step2Answer {
  timeline: TimelineNodeV2[];   // 技术演进时间轴（扩展版）
  principle: PrincipleAnswer;   // 分步静态帧演示（复用旧版类型）
  math: MathAnswer;             // 真实 token 代入公式演算
  loop: LoopCheck;              // 闭环问题（当前为 UI 占位）
}

interface TimelineNodeV2 {
  era: string;              // 年份，如 "2017"
  tech: string;             // 技术名称
  algo?: string;            // 算法原理一句话（可选）
  formula?: string;         // 数学公式 LaTeX（可选）
  problem: string;          // 技术问题
  valueLimit?: string;      // 价值限制（可选）
  nextDriver?: string;      // 下一步演进驱动（可选）
}

interface PrincipleAnswer {
  coreIdea: string;         // 一句话核心机制（<50 字）
  steps: {
    label: string;          // 步骤名称
    desc: string;           // 动作描述（含参数来源+类比回扣，<=100 字）
    symbol?: string;        // 符号，如 g_t（可选）
  }[];
  animationKey: "gdn-gate" | "attention-on2" | "mamba-ssm" | "moe-route" | "generic-flow";
  note: string;             // 看动画关键点（<80 字，末尾引用步骤 1 类比）
}

interface MathAnswer {
  formula: string;          // 核心公式（LaTeX）
  intuition: string;        // 直觉解释（<60 字）
  variables: {
    symbol: string;         // 符号
    meaning: string;        // 含义
    trainRole: string;      // 训练阶段作用
    inferRole: string;      // 推理阶段作用
  }[];
  calculationExample: string; // 真实 Token 演算示例（<300 字）
  trainFlow: string;        // 训练流程说明（<120 字）
  inferFlow: string;        // 推理流程说明（<120 字）
}
```

**内容结构**：
1. **技术演进时间轴**：从 Transformer 开始的演进节点（TimelineV2 组件渲染，水平轴+渐变圆点）
2. **分步静态帧 + 动画**：以步骤+符号方式演示原理（PrincipleView 组件）
3. **数学与 Token 演算**：真实 Token 代入公式的分步演算（MathView 组件 + Formula 组件渲染 LaTeX）
4. **闭环问题**：让用户说明当前技术与以前技术的区别（LoopBlock 占位）

---

### 5.4 步骤 3：有模有样｜客户价值与商业价值

**LLM 输出 Schema**：

```typescript
interface Step3Answer {
  engSummary: string;         // 工程收益总结（100-180 字）
  engMetrics: {               // EngineeringMetric[]
    name: string;             // 指标名称
    baseline: string;         // 基线值
    current: string;          // 当前值
    delta: string;            // 变化幅度
    favor: "up" | "down" | "neutral";
  }[];                        // 最多 6 条
  bizSummary: string;         // 业务价值总结（100-180 字）
  bizScenarios: {             // BusinessScenario[]
    scenario: string;         // 业务场景
    apiCostDelta: string;     // API 成本变化
    uxDelta: string;          // 体验变化
    bizFit: string;           // 业务适配度
  }[];                        // 最多 5 条
  // 注意：Step3Answer 没有 loop 字段
  // 步骤 3 的闭环由 FeynmanDigestPanel 独立承载
}
```

**内容结构**：
1. **工程收益总结**：面向 AI 应用开发与运维人员
2. **工程收益对比表**：基线 vs 当前（表格渲染，含趋势图标）
3. **业务价值总结**：面向 MaaS API 调用客户的高管视角
4. **业务价值对比表**：场景 x API 计费/体验/业务适配
5. **闭环提示**：硬编码 UI 文案，引导用户去底部费曼内化面板

---

### 5.5 费曼内化评估

**输入**：
- 学习主题（topic）
- 步骤 1/2/3 完整内容 JSON（context: `Array<{key, answer}>`）
- 用户对 3 个角色的复述答案（`FeynmanAnswers: {biz, cto, dev}`）

**前端数据结构**（`types.ts` 中定义）：

```typescript
interface FeynmanDigest {
  answers: FeynmanAnswers;      // 用户填写的三角色复述
  reviews: FeynmanReviewItem[]; // LLM 评估结果（每角色一条）
  graphDelta: GraphDelta;       // 知识图谱挂载增量
}

interface FeynmanAnswers {
  biz: string;
  cto: string;
  dev: string;
}

interface FeynmanReviewItem {
  role: "biz" | "cto" | "dev";
  score: number;            // 0-100
  oneLine: string;          // 总评一句话
  strengths: string[];      // 优点
  gaps: string[];           // 不足
  followups: string[];      // 追问
}

interface GraphDelta {
  concept: string;            // 概念名称（如 "GDN"）
  parent: string;             // 父节点（默认 "Transformer"）
  relation: string;           // 与父节点的一句关系
  tags: string[];             // 3-5 个标签
  oneLine: string;            // 一句话精髓
}
```

**LLM 返回 Schema**（`callFeynmanReview` 返回）：

```typescript
// LLM 实际返回的 JSON 结构（注意字段名与前端 FeynmanDigest 不同）：
{
  reviews: FeynmanReviewItem[];
  graph: GraphDelta;            // LLM 返回用 "graph"
}
// 前端代码将 LLM 返回的 graph 映射到 FeynmanDigest.graphDelta
```

**评估后动作**：
- 调用 `upsertGraph(graph)` 将 GraphDelta 存入 localStorage
- Toast 提示：`` `已评估并挂载到知识图谱：${graph.concept} ← ${graph.parent}` ``

---

### 5.6 素材导出

`ExportBar` 组件提供 5 种导出方式：

| 按钮 | 功能 | 实现函数 |
|------|------|----------|
| 保存到笔记库 | addNote -> localStorage | `storage.ts#addNote` |
| 下载 .md | 生成 Markdown 文件下载 | `mdExport.ts#downloadMarkdown` |
| 复制 Markdown | 复制到剪贴板 | `mdExport.ts#toMarkdown` |
| 讲稿片段 | 提取价值铺垫+定义+收益摘要 | `mdExport.ts#toSpeechScript` |
| PPT 要点 | 提取要点列表 | `mdExport.ts#toPptBullets` |

Markdown 导出含 frontmatter：`title`, `question`, `tags`, `parent: Transformer`, `createdAt`

---

### 5.7 笔记数据结构

```typescript
interface Note {
  id: string;               // 格式：note_{timestamp}_{random}
  topic: string;            // 概念名
  rawQuestion: string;      // 用户原始问题
  steps: StepEntry[];       // 三大步骤（主字段）
  qa?: QaEntry[];           // 旧版六问（向后兼容历史笔记）
  feynman?: FeynmanDigest;  // 费曼内化结果
  tags: string[];
  createdAt: string;        // ISO 时间戳
}
```

---

## 六、设计系统

### 6.1 配色方案

**基础色系**（HSL 格式，定义在 `src/index.css` :root）：
| Token | 用途 | HSL 值 |
|-------|------|--------|
| `--background` | 页面背景 | `0 0% 100%` |
| `--background-secondary` | 次级背景 | `0 0% 98%` |
| `--foreground` | 主文本 | `0 0% 3.9%` |
| `--primary` | 主要操作 | `0 0% 9%` |
| `--secondary` | 次要操作 | `0 0% 96.1%` |
| `--accent` | 强调色 | `0 0% 96.1%` |
| `--muted-foreground` | 弱化文本 | `0 0% 45.1%` |
| `--destructive` | 危险操作 | `0 72% 50%` |
| `--success` | 成功状态 | `142 55% 35%` |
| `--warning` | 警告状态 | `35 85% 45%` |

**四层学习递进色**（步骤标签区分，克制低饱和）：
| Layer | 含义 | HSL 值 | 用途 |
|-------|------|--------|------|
| `--layer-1` | 步骤 1：概念感性认识 | `24 55% 42%`（土褐） | StepPipeline tone="layer1" |
| `--layer-2` | 步骤 2：算法原理 | `152 35% 35%`（墨绿） | StepPipeline tone="layer2" |
| `--layer-3` | 预留扩展 | `205 45% 38%`（钢蓝） | 暂未使用 |
| `--layer-4` | 步骤 3：商业价值 | `258 35% 48%`（哑紫） | StepPipeline tone="layer4" |

### 6.2 UI 原则

1. **极简设计**：无首页、无登录、无社交功能，纯自然语言输入
2. **流式交互**：LLM 输出通过 SSE 流式渲染，实时展示 partial JSON
3. **确认推进**：用户手动点击"确认"按钮推进到下一步（非自动）
4. **本地私密**：所有数据存 localStorage，从不上云
5. **基线统一**：所有陌生名词锚定"传统 Transformer"作为认知参照物
6. **动画自驱**：动画组件通过 React 状态 + CSS @keyframes 实现，无第三方动画库

### 6.3 字体与排版

- **字体**：系统默认 sans-serif
- **字体特性**：`font-feature-settings: "cv02", "cv03", "cv04", "cv11"`
- **抗锯齿**：`-webkit-font-smoothing: antialiased`
- **标题**：font-weight 600-700
- **正文**：font-weight 400
- **代码/公式**：monospace，KaTeX 渲染

---

## 七、LLM 提示词系统

### 7.1 全局系统提示词（SYSTEM_BASE）

所有 LLM 调用的第一条消息（定义于 `src/gdn/lib/prompts.ts`）：

```text
你是面向非算法 / 非技术领域读者的 AI 概念穿透教练，风格深入浅出。
读者画像：大模型售前解决方案、业务架构师、产品经理、甚至完全不懂技术的管理者
硬性要求：
1. 输出必须是单一合法 JSON 对象，不加任何 Markdown 代码围栏、不加前后缀说明。
2. 语言：简体中文。首次出现的术语给中文+括号英文。
3. 禁止把陌生希腊字母直接甩给读者，必要时必须紧接中文解释。
4. 回答要丰富、有温度，像资深专家在耐心讲解一样，不要过于精简或碎片化。
5. 基线参照：以传统 Transformer（Attention/QKV）为默认认知起点。
6. 每次回答都必须基于本轮实时互联网搜索到的权威资料（论文、官方博客、技术媒体），
   不得只凭记忆作答；关键数字、模型版本、发布时间以搜索结果为准。
```

### 7.2 概念告知消息

每次调用（除费曼预热外）的第二条消息：

```text
用户提出的概念：{rawQuestion}

请以这个概念为主体，进入六问穿透讲解。下一条消息会告知第几问。
```

### 7.3 API 配置

| 参数 | 默认值 | 说明 |
|------|--------|------|
| model | `qwen3.6-plus` | 可用户自定义 |
| base_url | `https://dashscope.aliyuncs.com/compatible-mode/v1` | 可配置 |
| temperature | 0.5（预热）/ 0.3（步骤）/ 0.5（内化） | |
| enable_thinking | false（预热）/ true（步骤 1/2/3 + 内化） | 思考模式 |
| enable_search | true（全局） | 联网搜索 |
| search_options | `{ forced_search: true, enable_source: true, enable_citation: true }` | 强制搜索 |
| response_format | 无（预热）/ `{ type: "json_object" }`（其余） | |
| stream | 无（预热/内化）/ true（步骤 1/2/3） | |

---

## 八、已知问题与优化方向

### 8.1 性能风险

| 问题 | 原因 | 影响 | 优化建议 |
|------|------|------|----------|
| 流式 JSON 解析复杂 | 深层嵌套 JSON 的 partial 渲染容易卡顿 | step2/step3 加载慢 | 引入 partial-json 解析器，逐步渲染 |
| 上下文膨胀 | step3 messages 达 8KB | step3 推理延迟 62s（step1 的 3 倍） | 精简 history 为摘要，或并行三步 |
| 思考模式耗时 | thinking token 占大头 | step2 85s、费曼 90s | 评估关闭 thinking 后的耗时对比 |
| 联网搜索耗时 | forced_search 对所有概念都开启 | 纯数学概念增加 10-30s 检索 | 按概念类型动态决定是否搜索 |

### 8.2 提示词冲突

| 冲突 | 表现 | 建议 |
|------|------|------|
| "丰富有温度" vs 字数限制 | LLM 摇摆，字段过长或过短 | 明确优先级：schema 注释优先 |
| schema 嵌套深 | 流式容错难 | 扁平化 schema，减少嵌套层级 |

### 8.3 存储与兼容

| 问题 | 风险 | 建议 |
|------|------|------|
| localStorage 容量限制 | 笔记库+图谱积累可能超 5-10MB | 引入数据清理机制或 IndexedDB 迁移 |
| StepPipeline / FeynmanDigestPanel apiKey 检查 | 离线模式下若 apiKey 为空，两处组件都会阻断调用（GdnApp 入口已正确处理 `!cfg.apiKey && !cfg.offlineMock`） | 统一 offlineMock 前置判断 |

---

## 九、开发规范

### 9.1 代码规范

- **TypeScript**：strict 模式，ES2020 target，ESNext module
- **路径别名**：`@/*` -> `./src/*`（tsconfig.app.json + vite.config.ts）
- **组件风格**：函数组件 + Hooks，优先使用 shadcn/ui 组件
- **样式**：Tailwind CSS 原子类，CSS Variables 管理主题色
- **编译范围**：`src/main.tsx`, `src/gdn/**`, `src/components/ui/**`, `src/lib/**`

### 9.2 数据规范

- **LLM 输出**：必须为合法 JSON，不使用 Markdown 围栏
- **流式处理**：SSE 协议（`data:` 前缀行），AbortController 取消，容错解析（正则提取 JSON）
- **错误处理**：网络错误、JSON 解析失败、API 限流等场景需有兜底 toast 提示
- **类型安全**：每个 LLM 返回值通过解构映射到强类型（非 `any` 直接返回）

### 9.3 测试规范

- **端到端测试**：`scripts/test-main-flow.mjs`（Node.js 脚本）
- **单元测试**：`scripts/test-step1.mjs`
- **离线预览**：`fixtures.ts` + `mocks/data/*.json`（模拟 40 片段 x 35ms 的流式打字机）

---

## 十、运行方式

```bash
# 开发环境
npm run dev                 # http://localhost:5173

# 生产构建
npm run build               # tsc -b && vite build -> dist/

# 预览构建结果
npm run preview
```

---

## 十一、后续迭代路线图

### P0（高优先级）
- [ ] 实现步骤 1/2 的闭环 LLM 评价（LoopBlock 从占位升级为可交互）
- [ ] 优化流式 JSON 解析性能（partial-json 渲染）
- [ ] 精简 step3 历史上下文（摘要替代完整 JSON）

### P1（中优先级）
- [ ] 评估关闭 thinking 模式对耗时的影响
- [ ] 按概念类型动态决定是否开启联网搜索
- [ ] 扁平化 step2/step3 的 JSON Schema
- [ ] localStorage 容量告警 + 数据导出/清理
- [ ] 清理僵尸依赖（react-router-dom）

### P2（低优先级）
- [ ] 增加更多动画类型（覆盖更多算法概念）
- [ ] 支持多语言（英文）
- [ ] 学习进度追踪 + 间隔重复复习提醒
- [ ] 清理旧版六问代码（或明确标记 @deprecated）

---

## 附录

### A. 数据类型完整定义

见 `src/gdn/types.ts`（275 行），包含两套并行结构：
- **新版三步骤**：`StepKey`, `StepEntry`, `Step1Answer`, `Step2Answer`, `Step3Answer`（活跃使用）
- **旧版六问**：`QaKey`, `QaEntry`, `BackgroundAnswer`, `PrincipleAnswer` 等（代码保留，UI 不再引用，`Note.qa` 用于旧笔记兼容）

### B. 提示词完整快照

见 `src/gdn/lib/prompts.ts`（284 行），包含：
- `SYSTEM_BASE` 全局系统提示词
- `buildFeynmanWarmupPrompt()` 费曼预热
- `buildConceptIntro()` 概念告知
- `BUILD_STEP_PROMPT` 三步骤 prompt + schema（step1/step2/step3）
- `BUILD_PROMPT` 旧版六问 prompt + schema（保留兼容）
- `buildFeynmanSystemPrompt()` 费曼评估系统提示词

### C. 示例数据

| 文件 | 内容 | 大小 |
|------|------|------|
| `mocks/data/feynman-warmup-sample.json` | 费曼预热 3 问 | 474B |
| `mocks/data/step1-sample.json` | 步骤 1 示例 | 1.7KB |
| `mocks/data/step2-sample.json` | 步骤 2 示例 | 3.5KB |
| `mocks/data/step3-sample.json` | 步骤 3 示例 | 2.4KB |
| `mocks/data/feynman-review-sample.json` | 费曼评估示例 | 3.5KB |

### D. 动画组件清单

| 组件 | 文件 | 对应 animationKey | 实现方式 |
|------|------|-------------------|----------|
| MechanismAnim | `components/MechanismAnim.tsx` | `gdn-gate` | React useState + setTimeout 序列动画 |
| AttentionOnTwoAnim | `views/animations/AttentionOnTwoAnim.tsx` | `attention-on2` | CSS @keyframes + React 状态 |
| MambaSsmAnim | `views/animations/MambaSsmAnim.tsx` | `mamba-ssm` | CSS @keyframes + React 状态 |
| MoeRouteAnim | `views/animations/MoeRouteAnim.tsx` | `moe-route` | CSS @keyframes + React 状态 |
| GenericFlowAnim | `views/animations/GenericFlowAnim.tsx` | `generic-flow` | CSS @keyframes + React 状态 |

---

> **文档维护**：此 SPEC 基于工程代码逐文件核实生成，需基于实际开发持续同步更新。
> **变更日志**：每次功能变更需同步更新此文档的对应章节。
