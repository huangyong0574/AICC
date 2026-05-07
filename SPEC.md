# AICC - AI Concept Penetration Learning Platform
## Product Specification

> Version: v2.0.0  
> Updated: 2026-05-07  
> Status: MVP completed, step loop evaluation pending  
> Package: ai-knowledge-explorer

---

## 1. Product Positioning

**Product Name**: AICC (AI Concept Coach) / ai-knowledge-explorer  
**One-liner**: MaaS industry non-algorithm professionals' AI concept penetration learning platform, using Feynman learning method to explain an AI algorithm concept within 15 minutes.  
**UI Display Name**: "你的AI认知教练" (header)  
**Subtitle**: "四大步骤流式 · 费曼内化 · Transformer 基线图谱"  
**Hero Title**: "如果你不能简单地解释它，你就没有真正理解它。"  
**Hero Sub**: "如果你和我一样，看到新技术想了解，但论文又不太懂，看看这个页面是否适合你"

**Target Users**:
- Large model pre-sales solution engineers
- AI business architects
- Product managers / technical sales
- Professionals who don't write algorithm code but need to explain AI technology to customers

**Core Demand**: Understand an algorithm concept found in arXiv/tech papers within ~15 minutes, validated by Feynman method, recorded as long-term memory for future cognitive linkage.

**Default Example Questions** (UI EXAMPLES array):
- "什么是 GDN（Gated Delta Network）？"
- "Transformer 的 Attention 为什么是 O(N²)？"
- "Mamba / 状态空间模型（SSM）和 RNN 的区别"
- "MoE（混合专家）的路由为什么有负载不均？"

---

## 2. Core Problems & Solutions

| Pain Point | Symptom | Solution |
|---|---|---|
| Cognitive fragmentation | Papers only cover math OR business, can't bridge dimensions | 3-step progression: perception -> principle -> business value |
| High cognitive load | Abstract concepts, dense terminology, hard math | Feynman method: 3 warmup questions + multi-role explanation + analogies + animation |
| Knowledge fragmentation | ChatBox conversations lost, no linkage to past knowledge | Local knowledge graph auto-mount + note library persistence + multi-format export |

---

## 3. Functional Architecture

### 3.1 Overall Flow

```
User inputs natural language question (e.g. "GDN是什么意思？")
        |
   Feynman Warmup (3 questions) <- LLM dynamic generation
        |
   User clicks "我看完了，开始讲解"
        |
  +-----------------------------+
  |  Step 1: L1 类比理解          |
  |  Concept & Value Perception  |
  |  -> Value lead -> Definition |
  |  -> Glossary -> SVG Diagram  |
  |  -> Loop question (UI only)  |
  |  -> User confirms, next step |
  +-----------------------------+
        | confirm
  +-----------------------------+
  |  Step 2: L2 场景边界          |
  |  Scenario Selection          |
  |  -> Intro overview           |
  |  -> Applicable scenarios     |
  |  -> Inapplicable scenarios   |
  |  -> Selection criteria       |
  |  -> Loop question (UI only)  |
  |  -> User confirms, next step |
  +-----------------------------+
        | confirm
  +-----------------------------+
  |  Step 3: L3 深入原理          |
  |  Algorithm & Math Essence    |
  |  -> Timeline evolution       |
  |  -> Principle steps + anim   |
  |  -> Token math (LaTeX)       |
  |  -> Loop question (UI only)  |
  |  -> User confirms, next step |
  +-----------------------------+
        | confirm
  +-----------------------------+
  |  Step 4: L4 本质总结          |
  |  Essence Summary (McKinsey)  |
  |  -> One-liner (<=30 chars)   |
  |  -> Anchor analogy           |
  |  -> Contrast pair            |
  |  -> Framework note           |
  |  -> 3 Takeaways              |
  |  -> User confirms            |
  +-----------------------------+
        | confirm (allConfirmed=4)
  +-----------------------------+
  |  Feynman Digest Panel        |
  |  -> User writes 3-role retell|
  |  -> LLM review + graph mount |
  +-----------------------------+
        | done
   Export (5 methods) / View Knowledge Graph
```

### 3.2 Module List

| Module | Function | Status | Notes |
|---|---|---|---|
| **Feynman Warmup** | Dynamic 3 role-based questions (biz/CTO/dev) | Done | `callFeynmanWarmup()` |
| **Step 1** | Concept perception (4 parts + loop placeholder) | Done | `callStep("step1")` |
| **Step 2** | Algorithm principle & math (timeline+anim+formula+loop) | Done | `callStep("step2")` |
| **Step 3** | Business value (engineering+business, no loop field) | Done | `callStep("step3")` |
| **Feynman Digest** | 3-role review + knowledge graph generation | Done | `callFeynmanReview()` |
| **Knowledge Graph** | Transformer-based auto-mount | Pending (待上线) | Header button disabled + "soon" badge |
| **Note Library** | Local storage & management | Pending (待上线) | Header button disabled + "soon" badge |
| **LLM Settings** | API Key / Base URL / Model / Offline Mode | Done | deepseek-v4-flash default |
| **Export** | Save + MD download/copy + speech script + PPT bullets | Done | 5 export methods |
| **Animation** | 5 built-in animations (GDN-gate/Attention/Mamba/MoE/Generic) | Done | CSS @keyframes + React state |
| **Formula Render** | KaTeX math rendering | Done | LaTeX syntax |
| **SVG Diagrams** | Step1 concept diagram via SVG template renderer | Done | 5 layout types |
| **Offline Preview** | Local fixture demo without API consumption | Done | 6 JSON samples |
| **Streaming Parse** | Partial JSON field-by-field rendering during SSE | Done | `partialJson.ts` |
| **Loop Evaluation** | Step 1/2/3 loop question LLM scoring + unlock | UI Placeholder | disabled textarea, next iteration |
| **Cognitive NavBar** | Top sticky progress bar showing 6 cognitive nodes | Implemented & Tested | `CognitiveNavBar` component, maps flow: 开场提问→L1-L4→闭环 |

### 3.3 Cognitive Navigation Bar (认知导航条)

> **设计理念**：学习不是线性阅读，而是认知层级的递进攀升。导航条将整个学习旅程映射为 6 个认知台阶，用户始终知道"我在哪一层、还差几层到真正理解"。

**位置**：固定在 header 下方（sticky），始终可见，随页面内容进度自动演进。

**结构**：

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  ●━━━━━━●━━━━━━●━━━━━━●━━━━━━○━━━━━━○━━━━━━○                                    │
│ [开场提问] [类比理解] [场景边界] [深入原理] [本质总结] [开场提问闭环]                │
│   已读      已读      已读      当前       未读       未读                        │
└──────────────────────────────────────────────────────────────────────────────────┘
```

**6 个认知节点与内容映射**：

| Node | Label | Level | Maps To | Trigger Condition |
|---|---|---|---|---|
| 1 | 开场提问 | - | Feynman Warmup: 3 角色预热问题 | warmupConfirmed |
| 2 | 类比理解 | Level 1 | Step 1: 生活化类比 + 定义 + 术语 + 概念图 | Step 1 confirmed |
| 3 | 场景边界 | Level 2 | Step 2: 适用/不适用场景 + 选型标准 | Step 2 confirmed |
| 4 | 深入原理 | Level 3 | Step 3: 时间轴 + 原理分步 + 动画 + 数学公式 | Step 3 confirmed |
| 5 | 本质总结 | Level 4 | Step 4: 一句话本质 + 锚点类比 + 对比 + 要点 | Step 4 confirmed |
| 6 | 开场提问闭环 | - | Feynman Digest: 回答开场 3 问 + LLM review | Feynman Digest 提交完成 |

**节点状态**：

| Status | Visual | Meaning |
|---|---|---|
| `completed` (已读) | 实心圆 + 高亮连线 + 文字正常色 | 用户已通过该认知层 |
| `active` (当前) | 实心圆 + 脉冲动画 + 文字加粗 | 正在此认知层学习 |
| `pending` (未读) | 空心圆 + 灰色连线 + 文字弱化 | 尚未到达 |

**进度演进规则**：

1. **初始状态**：用户点击"开始讲解"后，导航条出现，node 1（开场提问）为 `active`
2. **开场提问完成**：warmupConfirmed → node 1 completed，node 2（类比理解）active
3. **步骤推进**：stepN confirmed → node N+1 completed，node N+2 active（step1→node2, step2→node3, step3→node4, step4→node5）
4. **最终状态**：Feynman Digest 提交后，全部 6 节点变为 `completed`，显示"认知穿透完成"

**认知层级哲学**（与产品定位关联）：

```
开场提问          -> 费曼预热：3 个角色问题逼迫学习者先思考
Level 1 (感性认识) -> 类比理解：用生活化案例让完全不懂的人建立初步印象
Level 2 (场景认知) -> 场景边界：哪些业务能用、哪些不能用，建立实用判断力
Level 3 (原理推演) -> 深入原理：能用机制和公式向工程师解释
Level 4 (本质内化) -> 本质总结：一句话本质 + 锚点类比 + 对比（顾问级提炼）
开场提问闭环       -> 费曼内化：回答开场 3 问，LLM 评分验证真正理解
```

**UI 规格**：
- 高度：~48px（紧凑，不抢占内容区空间）
- 背景：`bg-background/95 backdrop-blur-sm`，底部细线分隔
- 连线：水平轨道，`completed` 段用 `--primary` 色，`pending` 段用 `--muted`
- 节点圆：8px 直径，`active` 时附带 `animate-pulse` 微动
- 标签文字：`text-[11px]`，`active` 时 `font-semibold text-foreground`，`pending` 时 `text-muted-foreground`
- 响应式：移动端仅显示节点圆 + 当前标签（折叠其余标签）

**组件设计**：
- 组件名：`CognitiveNavBar`
- Props：`{ currentNode: 1-6, completedNodes: number[] }`
- 放置位置：`GdnApp.tsx` 中 header 下方，`started && warmupConfirmed` 时显示
- 状态来源：从 `steps[]` 的 streaming/confirmed 状态 + feynman digest 状态计算得出

---

### 3.4 Step Confirmation Mechanism

> **Important**: Current version's "loop questions" in steps 1/2 are UI placeholders only (`LoopBlock` component).
> User clicks "confirm" to proceed directly without LLM evaluation.
> `LoopBlock` textarea is `disabled`, code comment: "当前版本：输入占位；下一轮会加入 LLM 评分 + 下一步解锁逻辑"

---

## 4. Technical Architecture

### 4.1 Tech Stack

| Category | Technology | Version | Notes |
|---|---|---|---|
| Frontend | React | 18.3.1 | No StrictMode (avoids LLM double-call race) |
| Language | TypeScript | 5.6.2 | strict mode |
| Build | Vite | 6.0.5 | @vitejs/plugin-react |
| UI Components | shadcn/ui + Radix UI | latest | dialog/label/progress/select/scroll-area/tabs |
| Styles | Tailwind CSS | 3.4.17 | + tailwindcss-animate + tailwind-merge |
| Icons | Lucide React | 0.468.0 | |
| Formula | KaTeX | 0.16.45 | |
| Toast | Sonner | 2.0.7 | |
| Variants | class-variance-authority | 0.7.1 | |
| LLM API | Alibaba DashScope / Bailian | - | OpenAI compatible protocol |
| Storage | localStorage | native | |

**Note**: `package.json` includes `react-router-dom@^7.1.1` but code **never imports it** (zombie dependency). App is single-page with no router.

### 4.2 Directory Structure

```
AICC/
+-- src/
|   +-- gdn/                          # Main app module (active)
|   |   +-- GdnApp.tsx                # App entry (309 lines)
|   |   +-- types.ts                  # Data types (287 lines)
|   |   +-- components/
|   |   |   +-- StepPipeline.tsx      # 4-step pipeline (core flow control)
|   |   |   +-- FeynmanDigestPanel.tsx # Feynman digest panel
|   |   |   +-- QaPipeline.tsx        # Old 6-question pipeline (retained)
|   |   |   +-- GraphDialog.tsx       # Knowledge graph dialog
|   |   |   +-- MechanismAnim.tsx     # GDN gate animation (5 token demo)
|   |   |   +-- SettingsDialog.tsx    # LLM settings dialog
|   |   |   +-- LibraryDialog.tsx     # Note library dialog
|   |   |   +-- ExportBar.tsx         # Export bar (5 methods)
|   |   |   +-- FeynmanPrime.tsx      # Feynman warmup cards
|   |   |   +-- LoopBlock.tsx         # Loop question placeholder (disabled)
|   |   |   +-- Formula.tsx           # KaTeX formula component
|   |   |   +-- StreamingSection.tsx  # Streaming section skeleton
|   |   |   +-- views/
|   |   |       +-- Step1View.tsx     # Step 1 render
|   |   |       +-- Step2View.tsx     # Step 2 render
|   |   |       +-- Step3View.tsx     # Step 3 render
|   |   |       +-- Step4View.tsx     # Step 4 render
|   |   |       +-- PrincipleView.tsx # Principle steps view
|   |   |       +-- MathView.tsx      # Math formula view
|   |   |       +-- TimelineView.tsx  # Timeline view
|   |   |       +-- AnalogyView.tsx   # Analogy view (legacy)
|   |   |       +-- EngineeringView.tsx # Engineering view (legacy)
|   |   |       +-- BusinessView.tsx  # Business view (legacy)
|   |   |       +-- animations/
|   |   |           +-- AttentionOnTwoAnim.tsx
|   |   |           +-- MambaSsmAnim.tsx
|   |   |           +-- MoeRouteAnim.tsx
|   |   |           +-- GenericFlowAnim.tsx
|   |   +-- lib/
|   |   |   +-- llm.ts               # LLM call interface (437 lines)
|   |   |   +-- prompts.ts           # Prompt centralized management (291 lines)
|   |   |   +-- storage.ts           # localStorage persistence (88 lines)
|   |   |   +-- mdExport.ts          # Multi-format export tools
|   |   |   +-- partialJson.ts       # Streaming partial JSON field extraction
|   |   |   +-- svgRenderer.ts       # SVG template renderer (5 layouts)
|   |   +-- mocks/
|   |       +-- fixtures.ts          # Offline preview + stream simulation
|   |       +-- data/                # 5 JSON samples
|   +-- components/ui/               # shadcn/ui base components (12)
|   +-- lib/utils.ts                 # Utility (cn function)
|   +-- App.tsx                      # Legacy entry (unused)
|   +-- main.tsx                     # Entry (renders GdnApp directly, no Router)
|   +-- index.css                    # Global styles + CSS Variables
+-- scripts/
|   +-- test-main-flow.mjs           # E2E test
|   +-- test-step1.mjs               # Step 1 unit test
+-- package.json
+-- tsconfig.json / tsconfig.app.json
+-- vite.config.ts
+-- tailwind.config.ts
+-- postcss.config.js
```

### 4.3 Core Data Flow

```
User input -> GdnApp.tsx (state management, no Router)
              |
    callFeynmanWarmup() -> LLM -> 3 warmup questions
              |
    User confirms (warmupConfirmed = true)
              |
    StepPipeline auto-triggers callStep("step1")
              |              |
    Step1View.tsx <- parse <- SSE streaming (onText callback)
              |
    User confirms -> confirmAndNext(0) -> auto callStep("step2")
              |
    Step2View.tsx <- parse <- streaming (scenario selection)
              |
    User confirms -> confirmAndNext(1) -> auto callStep("step3")
              |
    Step3View.tsx <- parse <- streaming + animation play
              |
    User confirms -> confirmAndNext(2) -> auto callStep("step4")
              |
    Step4View.tsx <- parse <- streaming (McKinsey essence)
              |
    User confirms -> allConfirmed (4/4) -> show FeynmanDigestPanel
              |
    User fills 3-role retell -> callFeynmanReview() -> LLM -> review + GraphDelta
              |
    upsertGraph(graph) -> localStorage
```

### 4.4 LLM Call Matrix

| Call Point | Function | Default Model | Streaming | Search | Thinking | JSON Format | Temperature | Trigger |
|---|---|---|---|---|---|---|---|---|
| Feynman Warmup | `callFeynmanWarmup` | deepseek-v4-flash | No | **No** | No | No (array) | 0.8 | After question input |
| Step 1 | `callStep("step1")` | deepseek-v4-flash | Yes | **Yes** (forced) | **No** | json_object | 0.3 | After warmup confirm (auto) |
| Step 2 | `callStep("step2")` | deepseek-v4-flash | Yes | **Yes** (forced) | **No** | json_object | 0.3 | After step1 confirm (auto) |
| Step 3 | `callStep("step3")` | deepseek-v4-flash | Yes | **No** | **No** | json_object | 0.3 | After step2 confirm (auto) |
| Step 4 | `callStep("step4")` | deepseek-v4-flash | Yes | **No** | **No** | json_object | 0.3 | After step3 confirm (auto) |
| Feynman Review | `callFeynmanReview` | deepseek-v4-flash | No | **Yes** (forced) | **Yes** | json_object | 0.5 | User manual submit |

**Design Rationale for Call Matrix**:
- **Warmup no search**: Avoid LLM being misled by homonymous business concepts (e.g. PolarDB GDN = Global Database Network)
- **Warmup high temperature (0.8)**: Ensure diversity without garbled output; disable thinking for JSON stability
- **All steps no thinking**: Avoid thinking token stream slowing response
- **Step 1+2 search**: Concept perception and scenario selection benefit from real-time web data
- **Step 3+4 no search**: Algorithm derivation, math, and essence summary are based on prior step context, no external search needed

### 4.5 Storage System

| Key | Content | Structure |
|---|---|---|
| `gdn_llm_cfg_v3` | LLM config | `{ apiKey, baseUrl, model, offlineMock }` |
| `gdn_notes_v3` | Note library | `Note[]` array |
| `gdn_graph_v3` | Knowledge graph | `GraphDelta[]` array |

**Default Config** (`storage.ts`):
```typescript
DEFAULT_CFG = {
  apiKey: "",
  baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  model: "deepseek-v4-flash",
  offlineMock: false,
}
```

**Legacy Model Migration**: `loadCfg()` contains auto-migration logic. If stored model is in `LEGACY_MODELS = ["qwen3.6-plus", "qwen-plus", "deepseek-v4-pro"]`, it auto-upgrades to current default (`deepseek-v4-flash`) without changing localStorage key version.

### 4.6 Model Options (SettingsDialog)

| Model | Label | Notes |
|---|---|---|
| `deepseek-v4-flash` | "deepseek-v4-flash（推荐 · 更快）" | Default, fastest |
| `deepseek-v4-pro` | "deepseek-v4-pro（更强）" | Stronger reasoning |
| `qwen3.6-plus` | "qwen3.6-plus（thinking 模式）" | Legacy default |
| `qwen-plus` | "qwen-plus" | |
| `qwen-turbo` | "qwen-turbo（更快）" | |
| `qwen-max` | "qwen-max" | |

### 4.7 Engineering Decisions

| Decision | Reason | Code Location |
|---|---|---|
| No React.StrictMode | Avoids useEffect double-run causing LLM double-call + AbortController race | `main.tsx` |
| Legacy 6-question code retained | `types.ts` retains QaKey/QaAnswerMap; `llm.ts` retains callQa/callQaStream; `QaPipeline.tsx` retained; `Note.qa?` for old note compat | `types.ts`, `llm.ts`, `QaPipeline.tsx` |
| react-router-dom unused | Installed but never imported, app is single-page | `package.json` |
| Partial JSON streaming | `partialJson.ts` field-by-field balanced bracket scan instead of try/catch storm | `lib/partialJson.ts` |
| SVG template for Step1 diagrams | LLM returns structured nodes/edges, `svgRenderer.ts` renders locally (no external image API) | `lib/svgRenderer.ts` |

---

## 5. Detailed Functional Spec

### 5.1 Feynman Warmup

**Goal**: 3 role-based questions forcing user to think carefully before explanation.

**Input**: User's raw question (e.g. "GDN是什么意思？")

**LLM Generation Requirements**:
- Embed the specific concept, don't use template text
- Ask in client's voice
- Each question <= 50 chars
- Output JSON array: `[{role, question}]`

**Three Roles** (UI label text from `FEYNMAN_ROLES`):
1. `biz` - "客户的业务人员问："
   - hint: ""
   - loadingText: "正在代入业务人员视角…"
2. `cto` - "客户的技术高管问："
   - hint: "和技术决策者对话，关心成本/稳定性/改造影响"
   - loadingText: "正在代入技术高管视角…"
3. `dev` - "客户的工程师问："
   - hint: "工程师视角，关心怎么调、踩坑在哪、上手时间"
   - loadingText: "正在代入工程师视角…"

**UI**: Vertical list of 3 question cards (role icon + dynamic question text), below shows "我看完了，开始讲解" button.

---

### 5.2 Step 1: L1 类比理解 它是什么？

**LLM Output Schema**:

```typescript
interface Step1Answer {
  valueLead: string;          // Popular case leading (no word limit)
  officialDefinition: string; // Authoritative definition (no word limit)
  glossaryTerms: {            // GlossaryTerm[]
    term: string;             // Technical term name
    plainHint: string;        // Plain language / life analogy
    techNote: string;         // Technical meaning in papers
  }[];
  diagram: ConceptDiagram;    // SVG template-based concept diagram (NOT animationKey)
  loop: LoopCheck;            // Loop question (UI placeholder only)
}

interface ConceptDiagram {
  templateType: 'flowchart' | 'comparison' | 'hierarchy' | 'cycle' | 'architecture';
  nodes: Array<{
    id: string;
    label: string;       // Node title (Chinese, 6-12 chars)
    sublabel?: string;   // Subtitle / analogy (optional, 10-15 chars)
    color?: string;      // Optional: #3b82f6/#10b981/#f59e0b/#6b7280
  }>;
  edges: Array<{
    from: string;        // Source node ID
    to: string;          // Target node ID
    label?: string;      // Arrow label (optional, 2-4 chars)
  }>;
  caption: string;       // One-line caption linking visual to core mechanism (20-30 chars)
  svg: string;           // Frontend-rendered SVG from template + data
}

interface LoopCheck {
  prompt: string;         // Display question
  userAnswer?: string;    // User answer (not enabled this version)
  review?: LoopReview;    // LLM review (not implemented this version)
}
```

**Content Structure**:
1. **Value Lead**: Life-like case revealing old problem/pain point
2. **Official Definition**: Precise definition from authoritative sources
3. **Glossary Terms**: Based on Transformer baseline, pick unfamiliar terms (dual explanation: analogy + technical)
4. **SVG Diagram**: LLM returns structured nodes/edges/templateType, `svgRenderer.ts` renders locally
5. **Loop Question**: User describes concept's principle & value in own words (UI placeholder, not sent to LLM)

**Important**: Step 1 does NOT output animationKey. Animation display is exclusive to Step 3.

---

### 5.3 Step 2: L2 场景边界 | Scenario Selection

**LLM Output Schema**:

```typescript
interface Step2Answer {
  intro: string;              // Overview of applicable domain
  applicable: ScenarioCard[]; // Scenarios where this tech fits well
  inapplicable: ScenarioCard[]; // Scenarios where this tech is not suitable
  selectionCriteria: string;  // Criteria for choosing this tech
  loop: LoopCheck;            // Loop question (UI placeholder)
}

interface ScenarioCard {
  scene: string;              // Scenario name
  why: string;                // Why it fits/doesn't fit
  fit: "excellent" | "good" | "neutral" | "poor" | "unsuitable";
}
```

**Content Structure**:
1. **Intro**: Brief overview of applicable domain and key strengths
2. **Applicable Scenarios**: 3-5 scenarios where this tech excels (with fit level)
3. **Inapplicable Scenarios**: 2-4 scenarios where this tech is not suitable (with reason)
4. **Selection Criteria**: Key factors for deciding whether to adopt this tech
5. **Loop Question**: User describes when they would/wouldn't recommend this tech (LoopBlock placeholder)

---

### 5.4 Step 3: L3 深入原理 | Algorithm Principle & Math Essence

**LLM Output Schema**:

```typescript
interface Step3Answer {
  timeline: TimelineNodeV2[];   // Tech evolution timeline
  principle: PrincipleAnswer;   // Step-by-step principle demo
  math: MathAnswer;             // Real token formula calculation
  loop: LoopCheck;              // Loop question (UI placeholder)
}
```

(See Section 7.5 for full sub-interface definitions: TimelineNodeV2, PrincipleAnswer, MathAnswer)

**Content Structure**:
1. **Tech Evolution Timeline**: Evolution nodes from Transformer (TimelineV2 component)
2. **Principle Steps + Animation**: Step-by-step with symbols (PrincipleView component)
3. **Math & Token Calculation**: Real token substitution into formulas (MathView + Formula/KaTeX)
4. **Loop Question**: User explains difference between current and previous tech (LoopBlock placeholder)

**animationKey Selection** (Step 3 principle.animationKey):
- GDN -> `gdn-gate` (MechanismAnim: 5 token gate animation)
- Attention -> `attention-on2` (AttentionOnTwoAnim)
- Mamba/SSM -> `mamba-ssm` (MambaSsmAnim)
- MoE -> `moe-route` (MoeRouteAnim)
- Other -> `generic-flow` (GenericFlowAnim)

---

### 5.5 Step 4: L4 本质总结 | Essence Summary (McKinsey Style)

**LLM Output Schema**:

```typescript
interface Step4Answer {
  oneLiner: string;           // One-sentence essence (<=30 chars)
  anchor: string;             // Anchor analogy (<=40 chars)
  contrastPair: {
    before: string;           // Before learning this concept
    after: string;            // After learning this concept
  };
  frameworkNote: string;      // Framework/mental model note
  takeaway: string[];         // 3 key takeaways (each <=25 chars)
}
```

**Content Structure**:
1. **One-Liner**: The absolute essence in one sentence (bold centered display)
2. **Anchor**: A memorable analogy anchoring the concept to something familiar
3. **Contrast Pair**: Before vs After learning (2-column grid)
4. **Framework Note**: How this fits into the broader mental model
5. **3 Takeaways**: Numbered key points for retention

**Design Philosophy**: McKinsey consulting deck style - distill complexity into executive-ready insights.

---

### 5.6 Feynman Digest Evaluation

**Input**:
- Learning topic (topic)
- Steps 1/2/3 full content JSON (context: `Array<{key, answer}>`)
- User's 3-role retell answers (`FeynmanAnswers: {biz, cto, dev}`)

**Frontend Data Structure** (`types.ts`):

```typescript
interface FeynmanDigest {
  answers: FeynmanAnswers;      // User-written 3-role retell
  reviews: FeynmanReviewItem[]; // LLM review results (one per role)
  graphDelta: GraphDelta;       // Knowledge graph mount delta
}

interface FeynmanAnswers {
  biz: string;
  cto: string;
  dev: string;
}

interface FeynmanReviewItem {
  role: "biz" | "cto" | "dev";
  score: number;            // 0-100
  oneLine: string;          // One-line summary
  strengths: string[];      // Strengths
  gaps: string[];           // Gaps
  followups: string[];      // Follow-up questions
}

interface GraphDelta {
  concept: string;            // Concept name (e.g. "GDN")
  parent: string;             // Parent node (default "Transformer")
  relation: string;           // One-line relation to parent
  tags: string[];             // 3-5 tags
  oneLine: string;            // One-line essence
}
```

**LLM Return Schema** (`callFeynmanReview` returns):

```typescript
// LLM actual return JSON structure (field names differ from frontend FeynmanDigest):
{
  reviews: FeynmanReviewItem[];
  graph: GraphDelta;            // LLM returns "graph"
}
// Frontend maps LLM's "graph" to FeynmanDigest.graphDelta
```

**Post-evaluation Actions**:
- Call `upsertGraph(graph)` to store GraphDelta in localStorage
- Toast: `` `已评估并挂载到知识图谱：${graph.concept} ← ${graph.parent}` ``

---

### 5.7 Export Bar

`ExportBar` component provides 5 export methods:

| Button | Function | Implementation |
|---|---|---|
| 保存到笔记库 | addNote -> localStorage | `storage.ts#addNote` |
| 下载 .md | Generate Markdown file download | `mdExport.ts#downloadMarkdown` |
| 复制 Markdown | Copy to clipboard | `mdExport.ts#toMarkdown` |
| 讲稿片段 | Extract value lead + definition + benefit summary | `mdExport.ts#toSpeechScript` |
| PPT 要点 | Extract bullet points | `mdExport.ts#toPptBullets` |

Markdown export includes frontmatter: `title`, `question`, `tags`, `parent: Transformer`, `createdAt`

---

### 5.8 Note Data Structure

```typescript
interface Note {
  id: string;               // Format: note_{timestamp}_{random}
  topic: string;            // Concept name
  rawQuestion: string;      // User's original question
  steps: StepEntry[];       // 4 steps (primary field)
  qa?: QaEntry[];           // Legacy 6-question (backward compat)
  feynman?: FeynmanDigest;  // Feynman digest result
  tags: string[];
  createdAt: string;        // ISO timestamp
}
```

---

## 6. Design System

### 6.1 Color Scheme

**Base Colors** (HSL format, defined in `src/index.css` :root):
| Token | Usage | HSL |
|---|---|---|
| `--background` | Page background | `0 0% 100%` |
| `--background-secondary` | Secondary background | `0 0% 98%` |
| `--foreground` | Main text | `0 0% 3.9%` |
| `--primary` | Primary action | `0 0% 9%` |
| `--secondary` | Secondary action | `0 0% 96.1%` |
| `--accent` | Accent | `0 0% 96.1%` |
| `--muted-foreground` | Muted text | `0 0% 45.1%` |
| `--destructive` | Danger | `0 72% 50%` |
| `--success` | Success | `142 55% 35%` |
| `--warning` | Warning | `35 85% 45%` |

**Four-layer Learning Progression** (step label differentiation, muted saturation):
| Layer | Meaning | HSL | Usage |
|---|---|---|---|
| `--layer-1` | Step 1: 类比理解 | `24 55% 42%` (earthy brown) | StepPipeline tone="layer1" |
| `--layer-2` | Step 2: 场景边界 | `152 35% 35%` (ink green) | StepPipeline tone="layer2" |
| `--layer-3` | Step 3: 深入原理 | `205 45% 38%` (steel blue) | StepPipeline tone="layer3" |
| `--layer-4` | Step 4: 本质总结 | `258 35% 48%` (muted purple) | StepPipeline tone="layer4" |

### 6.2 UI Principles

1. **Minimal**: No homepage, no login, no social features, pure natural language input
2. **Streaming**: LLM output via SSE streaming with partial JSON field-by-field rendering
3. **Confirm-driven**: User manually clicks "confirm" to advance (not automatic)
4. **Local-private**: All data in localStorage, never cloud-uploaded
5. **Baseline-unified**: All unfamiliar terms anchored to "Traditional Transformer"
6. **Self-driven animation**: Animations via React state + CSS @keyframes, no third-party animation library

### 6.3 Typography

- **Font**: System default sans-serif
- **Font features**: `font-feature-settings: "cv02", "cv03", "cv04", "cv11"`
- **Antialiasing**: `-webkit-font-smoothing: antialiased`
- **Headings**: font-weight 600-700
- **Body**: font-weight 400
- **Code/Formula**: monospace, KaTeX rendering

---

## 7. LLM Prompt System (Complete Reference)

### 7.1 System Prompts (Independent Per Step)

Each step has its own complete system prompt (defined in `src/gdn/lib/prompts.ts`). Below is SYSTEM_STEP1 as representative example (others follow similar structure with role-specific persona):

```text
你是面向非算法 / 非技术领域读者的 AI 概念穿透教练，风格深入浅出。
读者画像：大模型售前解决方案、业务架构师、产品经理、甚至完全不懂技术的管理者
硬性要求：
1. 输出必须是单一合法 JSON 对象，不加任何 Markdown 代码围栏、不加前后缀说明。
2. 语言：简体中文。英文专业术语要符合AI语境，用英文(中文)格式表达。
3. 禁止把陌生希腊字母直接抛给读者，必要时必须紧接中文解释。
4. 回答要丰富、有温度，像资深专家在耐心讲解一样，不要过于精简或碎片化。
5. 基线参照：以传统Transformer为默认已经深度理解的认知起点。
6. 每次回答都必须基于本轮实时互联网搜索到的权威资料（论文、官方博客、技术媒体），不得只凭记忆作答；关键数字、模型版本、发布时间以搜索结果为准。
7. 严禁在正文字段中输出任何形如 [1]、[2]、[3][5]、[1,2] 的方括号引用角标、脚注编号或文献编号；如需传递权威来源，直接在文内自然表述（如"MiniMax-01 技术报告指出..."），不准留任何方括号数字引用标记。注：圆圈数字①②③ 仅在 schema 明确要求的括号结构标记位置（如 steps[].desc 末尾的"①参数来源②对应场景"）可用，正文被述中禁用。
```

### 7.2 Concept Introduction Message (buildConceptIntro)

Second message in all calls EXCEPT warmup and Feynman review (which uses its own system prompt):

```text
用户提出的概念：{rawQuestion}

请以这个概念为主体，进入四大步骤讲解。下一条消息会告知第几步。
```

### 7.3 Feynman Warmup Prompt (buildFeynmanWarmupPrompt)

Used in `callFeynmanWarmup()`. Messages: `[SYSTEM_WARMUP, user: warmupPrompt]`

```text
用户想学习的概念：{rawQuestion}

请基于这个概念，为 MaaS 从业者（大模型售前解决方案、业务架构师）生成 3 个费曼学习法预热问题，分别面向：
1. 完全不懂技术的客户公司的业务总监
2. 客户的 CTO
3. 客户的开发者（调用大模型的人）

要求：
- 每个问题都要代入这个具体概念，不要用模板原话
- 每个问题都要以客户的口吻来问
- 问题要能倒逼学习者认真思考后续讲解内容
- **每个问题严格限制在 50 字以内**
- 输出必须是 JSON 数组，格式：[{"role":"biz","question":"..."},{"role":"cto","question":"..."},{"role":"dev","question":"..."}]
- 不要加任何 Markdown 围栏或前后缀
```

**API Parameters**:
- temperature: 0.8
- enable_thinking: false
- enable_search: NOT set (no search)
- response_format: NOT set (returns array)
- stream: false

### 7.4 Step 1 Prompt (buildStep1Prompt)

Used in `callStep("step1")`. Messages: `[SYSTEM_STEP1, user: concept + question + schema]`

**Question Text** (`STEP_DEFAULT_QUESTIONS.step1`):
```text
步骤1 装模作样｜概念与价值感性认识。请按四部分输出：
1.【价值铺垫】用生活化通俗案例类比这个技术的价值，先揭示以前的问题。
2.【专业定义】给出专业定义（要依据权威资料）。
3.【术语拆解】基于传统 Transformer 基线，挑出客户可能不理解的专业词，给出通俗类比与技术视角双解释。
4.【示意图】选一个合适的动画 key（参考 animationKey 枚举），并给出一句结合通俗案例的 caption 说明。
最后生成一个闭环问题，让学习者用自己的话说该技术的原理与价值。
```

**JSON Schema**:
```text
{
  "valueLead": "用生活化案例先揭示旧问题/痛点，为技术价值做铺垫（多段深入讲解，让读者建立共鸣，不限字数）",
  "officialDefinition": "该概念的权威专业定义（引用论文/官方文档，展开解读，不限字数）",
  "glossaryTerms": [
    {"term":"专业术语名","plainHint":"用大白话/生活比喻通俗解释","techNote":"该术语在论文/文档中的技术含义"}
  ],
  "diagram": {
    "templateType": "Choose one: 'flowchart' (linear process), 'comparison' (old vs new), 'hierarchy' (tree/pyramid), 'cycle' (iterative loop), 'architecture' (layered system)",
    "nodes": [
      {"id": "unique_id_1", "label": "节点标题（中文，6-12字）", "sublabel": "副标题/通俗比喻（可选，10-15字）", "color": "可选：#3b82f6/#10b981/#f59e0b/#6b7280"}
    ],
    "edges": [
      {"from": "起点id", "to": "终点id", "label": "箭头标签（可选，2-4字）"}
    ],
    "caption": "图片下方一句话点睛：把画面与概念核心机制勾连（20-30字，中文）"
  },
  "loop": {
    "prompt": "展示给学习者的闭环问题：请用自己的话说说当前这个概念的原理与价值（自然表达，问到点子上）"
  }
}
注意：步骤1 不要选择/输出任何动画 key，动画展示由步骤2 独占。diagram.svg 必须是合法 SVG 代码且不超过 2000 字符。
```

**API Parameters**:
- temperature: 0.3
- enable_thinking: false
- enable_search: true, search_options: { forced_search: true, enable_source: true, enable_citation: true }
- response_format: { type: "json_object" }
- stream: true

### 7.5 Step 2 Prompt (buildStep2Prompt)

Used in `callStep("step2")`. Messages: `[SYSTEM_STEP2, user: concept + question + schema]`

**Question Text** (`STEP_DEFAULT_QUESTIONS.step2`):
```text
步骤2 像模像样｜算法原理与数学本质。请按三部分输出：
1.【技术演进时间轴】从 Transformer 开始，列出每个演进节点，每个节点必须包含：算法原理(algo)、数学公式(formula)、技术问题(problem)、价值限制(valueLimit)。
2.【分步静态帧】以步骤+符号方式静态演示当前技术的实现原理，从上下文步骤1 中的类比场景回扣。
3.【数学与 token 演算】用真实 token 代入公式做一次完整分步演算。
最后生成一个闭环问题，让学习者用自己的话说明当前技术和以前技术的区别、为什么要用这个新技术。
```

**JSON Schema**:
```text
{
  "timeline": [
    {"era":"2017","tech":"Transformer","algo":"算法原理一句话","formula":"Attention(Q,K,V)=softmax(QK^T/\\sqrt{d})V","problem":"O(N^2) 显存/算力暴涨","valueLimit":"长序列推理成本高","nextDriver":"需要线性化方案"}
  ],
  "principle": {
    "coreIdea": "一句话核心机制（精炼表达，表意完整）",
    "steps": [
      {"label":"第1步名称","desc":"动作描述，详细展开讲清楚，末尾用括号注明：①参数来源（训练固定值 or 推理上游传入）②对应步骤1 类比中的哪个场景（不限字数）","symbol":"可选符号如 g_t"}
    ],
    "animationKey": "gdn-gate|attention-on2|mamba-ssm|moe-route|generic-flow",
    "note": "看动画时要抓住的关键点，末尾用括号引用步骤1 的类比场景（自然表达，把点说透）"
  },
  "math": {
    "formula": "核心公式（LaTeX 或符号串）",
    "intuition": "公式在直觉上意味着什么（一段话说到位，不限字数）",
    "variables": [
      {"symbol":"g_t","meaning":"门控强度","trainRole":"可学习参数更新","inferRole":"每 token 动态计算"}
    ],
    "calculationExample": "以实际 token（如"我 爱 你"）为例子，假设 d=4 维度，给出 k_t、v_t、α_t、β_t 的示例数值，然后分步展示：擦除旧记忆→计算门控→写入新信息→更新 S_t 的完整演算过程（每步清晰展开，不限字数）",
    "trainFlow": "训练阶段完整流程说明（不限字数）",
    "inferFlow": "推理阶段完整流程说明（不限字数）"
  },
  "loop": {
    "prompt": "展示给学习者的闭环问题：用自己的话说说当前技术和之前技术的区别、为什么要用这个（自然表达，问到点子上）"
  }
}
```

**API Parameters**:
- temperature: 0.3
- enable_thinking: false
- enable_search: true, search_options: { forced_search: true, enable_source: true, enable_citation: true }
- response_format: { type: "json_object" }
- stream: true

### 7.6 Step 3 Prompt (buildStep3Prompt)

Used in `callStep("step3")`. Messages: `[SYSTEM_STEP3, user: concept + question + schema]`

**Question Text** (`STEP_DEFAULT_QUESTIONS.step3`):
```text
步骤3 有模有样｜客户价值与商业价值。请按四部分输出：
1.【工程收益总结】基于演进前之间的对比，面向 AI 应用开发和运维人员讲清餐技术和算法工程上的收益。
2.【工程收益对比表】给出指标及基线 vs 当前对比。
3.【业务价值总结】面向调用 MaaS API 的客户（不考虑私有化部署），讲清餐业务价值，可隐射高管视角。
4.【业务价值对比表】给出场景 × API 计费/体验/业务适配 的对比。
```

**JSON Schema**:
```text
{
  "engSummary": "工程收益总结，面向 AI 应用开发与运维，结合演进前对比（多段充分阐述，不限字数）",
  "engMetrics": [
    {"name":"推理延迟","baseline":"O(N^2)","current":"O(N)","delta":"-65%","favor":"up"}
  ],
  "bizSummary": "业务价值总结，面向调用 MaaS API 的客户高管，结合演进前对比（多段充分阐述，不限字数）",
  "bizScenarios": [
    {"scenario":"长文档问答","apiCostDelta":"-40% token 费","uxDelta":"首字延迟减半","bizFit":"高度适配"}
  ]
}
favor 取值：up=更好，down=更差，neutral=中性。engMetrics 最多 6 条，bizScenarios 最多 5 条。
```

**API Parameters**:
- temperature: 0.3
- enable_thinking: false
- enable_search: false (no search for step3)
- response_format: { type: "json_object" }
- stream: true

### 7.7 Feynman Review System Prompt (buildFeynmanSystemPrompt)

Used in `callFeynmanReview()`. Uses its OWN system prompt (not SYSTEM_BASE):

```text
你是费曼学习法评估教练。学习者刚通过六问讲解了"{topic}"这个 AI 概念，现在要以三种听众身份复述。请从三个听众视角分别评估，并为知识图谱生成一个挂载项（以 Transformer 为基线父节点）。
必须返回单一合法 JSON：
{
  "reviews": [
    {"role":"biz","score":0-100,"oneLine":"业务总监总评","strengths":["..."],"gaps":["..."],"followups":["..."]},
    {"role":"cto","score":0-100,"oneLine":"...","strengths":["..."],"gaps":["..."],"followups":["..."]},
    {"role":"dev","score":0-100,"oneLine":"...","strengths":["..."],"gaps":["..."],"followups":["..."]}
  ],
  "graph": {"concept":"{topic}","parent":"Transformer","relation":"与父节点的一句关系","tags":["标签1","标签2","标签3"],"oneLine":"一句话精髓"}
}
若某角色 answers 为空，仍给 0-20 分并在 gaps 写"未提交该角色答案"。
```

**User Message** (constructed inline):
```text
讲解内容 JSON：
{JSON.stringify(context.map(q => ({ key: q.key, answer: q.answer })))}

学习者原问题：{rawQuestion}

学习者分别对三类听众的复述：
- 业务总监：{answers.biz || "（未填）"}
- CTO：{answers.cto || "（未填）"}
- 开发者：{answers.dev || "（未填）"}
```

**API Parameters**:
- temperature: 0.5
- enable_thinking: true
- enable_search: true, search_options: { forced_search: true, enable_source: true, enable_citation: true }
- response_format: { type: "json_object" }
- stream: false

### 7.8 Legacy 6-Question Prompts (BUILD_PROMPT)

Retained for backward compatibility. Used by `callQa`/`callQaStream` (not in active 3-step flow).

**6 Question Keys**: `background`, `principle`, `analogy`, `engineering`, `math`, `business`

Each question has a `DEFAULT_QUESTIONS[key]` text and corresponding `build*Prompt()` function returning `{question, schema}`.

| Key | Question Summary | Schema Output |
|---|---|---|
| background | 四步结构介绍概念 (value lead + definition + glossary + summary) | `{valueLead, officialDefinition, glossaryTerms, summary, timeline}` |
| principle | 核心工作流程4步演示 | `{coreIdea, steps[], animationKey, note}` |
| analogy | 通俗案例类比 | `{title, story, mapping[], diagramHint}` |
| engineering | 工程收益指标对比 | `{summary, metrics[], deployNote}` |
| math | 实际 token 代入公式演算 | `{formula, intuition, variables[], calculationExample, trainFlow, inferFlow}` |
| business | MaaS API 客户商业价值 | `{oneLine, scenarios[], recommendation}` |

### 7.9 API Configuration Summary

| Parameter | Warmup | Step 1 | Step 2 | Step 3 | Step 4 | Feynman Review |
|---|---|---|---|---|---|---|
| model | deepseek-v4-flash | deepseek-v4-flash | deepseek-v4-flash | deepseek-v4-flash | deepseek-v4-flash | deepseek-v4-flash |
| temperature | 0.8 | 0.3 | 0.3 | 0.3 | 0.3 | 0.5 |
| enable_thinking | false | false | false | false | false | true |
| enable_search | - (not set) | true | true | false | false | true |
| search_options | - | forced_search | forced_search | - | - | forced_search |
| response_format | - (array) | json_object | json_object | json_object | json_object | json_object |
| stream | false | true | true | true | true | false |
| system prompt | SYSTEM_WARMUP | SYSTEM_STEP1 | SYSTEM_STEP2 | SYSTEM_STEP3 | SYSTEM_STEP4 | buildFeynmanSystemPrompt |

---

## 8. Streaming & Partial JSON

### 8.1 SSE Protocol

All streaming calls use standard SSE:
- Each line prefixed with `data: `
- Delta content extracted from `obj.choices[0].delta.content`
- Stream terminates with `data: [DONE]`
- AbortController used for cancellation

### 8.2 Partial JSON Field Extraction (`partialJson.ts`)

Strategy: Given known field order, find each key position, then balanced-bracket/string scan from `:` to determine if value is complete. Only fully-parsed fields are rendered.

**Field Orders**:
- Step 1: `["valueLead", "officialDefinition", "glossaryTerms", "diagram", "loop"]`
- Step 2: `["intro", "applicable", "inapplicable", "selectionCriteria", "loop"]`
- Step 3: `["timeline", "principle", "math", "loop"]`
- Step 4: `["oneLiner", "anchor", "contrastPair", "frameworkNote", "takeaway"]`

This enables progressive rendering: as each field completes in the stream, its corresponding UI section appears immediately.

---

## 9. Known Issues & Optimization Direction

### 9.1 Performance Risks

| Issue | Cause | Impact | Suggestion |
|---|---|---|---|
| Streaming JSON parse complexity | Deep nested JSON partial rendering | step2/step3 loading slow | Partial-json field-by-field (already implemented via `partialJson.ts`) |
| Context inflation | step3 messages reach ~8KB | step3 inference delayed | Summarize history instead of full JSON |
| Search latency | forced_search on step1 | Pure math concepts +10-30s search | Dynamic search decision by concept type |

### 9.2 Prompt Conflicts

| Conflict | Symptom | Suggestion |
|---|---|---|
| "Rich & warm" vs no word limit | LLM may over-generate | Monitor field length, add soft max in schema |
| Schema nesting depth | Streaming fault-tolerance harder | Flatten schema where possible |

### 9.3 Storage & Compatibility

| Issue | Risk | Suggestion |
|---|---|---|
| localStorage capacity limit | Notes + graph accumulation may exceed 5-10MB | Introduce cleanup or IndexedDB migration |
| StepPipeline / FeynmanDigestPanel apiKey check | Offline mode blocked if apiKey empty (GdnApp entry correctly handles `!cfg.apiKey && !cfg.offlineMock`) | Unify offlineMock pre-check |

---

## 10. Development Standards

### 10.1 Code Standards

- **TypeScript**: strict mode, ES2020 target, ESNext module
- **Path alias**: `@/*` -> `./src/*` (tsconfig.app.json + vite.config.ts)
- **Component style**: Function components + Hooks, prefer shadcn/ui
- **Styles**: Tailwind CSS atomic classes, CSS Variables for theme
- **Compilation scope**: `src/main.tsx`, `src/gdn/**`, `src/components/ui/**`, `src/lib/**`

### 10.2 Data Standards

- **LLM output**: Must be valid JSON, no Markdown fences
- **Streaming**: SSE protocol (`data:` prefix lines), AbortController cancel, fault-tolerant parsing (regex JSON extraction)
- **Error handling**: Network errors, JSON parse failures, API rate limits all need fallback toast
- **Type safety**: Every LLM return value mapped to strong types via destructuring

### 10.3 Testing

- **E2E test**: `scripts/test-main-flow.mjs` (Node.js script)
- **Unit test**: `scripts/test-step1.mjs`
- **Offline preview**: `fixtures.ts` + `mocks/data/*.json` (simulates 40 chunks x 35ms stream typewriter)

---

## 11. Running

```bash
# Development
npm run dev                 # http://localhost:5173

# Production build
npm run build               # tsc -b && vite build -> dist/

# Preview build
npm run preview
```

---

## 12. Iteration Roadmap

### P0 (High Priority)
- [ ] Implement step 1/2 loop LLM evaluation (LoopBlock upgrade from placeholder to interactive)
- [ ] Optimize step3 history context (summary instead of full JSON)

### P1 (Medium Priority)
- [ ] Dynamic search decision by concept type
- [ ] localStorage capacity warning + data export/cleanup
- [ ] Clean zombie dependency (react-router-dom)

### P2 (Low Priority)
- [ ] Add more animation types (cover more algorithm concepts)
- [ ] Multi-language support (English)
- [ ] Learning progress tracking + spaced repetition reminders
- [ ] Clean legacy 6-question code (or mark @deprecated)

---

## Appendix

### A. Complete Type Definitions

See `src/gdn/types.ts` (287 lines), containing two parallel systems:
- **New 4-step**: `StepKey`, `StepEntry`, `Step1Answer`, `Step2Answer`, `Step3Answer`, `Step4Answer` (active)
- **Legacy 6-question**: `QaKey`, `QaEntry`, `BackgroundAnswer`, `PrincipleAnswer`, etc. (retained for `Note.qa` compat)

### B. Offline Fixture Data

| File | Content | Size |
|---|---|---|
| `mocks/data/feynman-warmup-sample.json` | Feynman warmup 3 questions | 474B |
| `mocks/data/step1-sample.json` | Step 1 example | 1.7KB |
| `mocks/data/step2-sample.json` | Step 2 example (scenario selection) | 2.8KB |
| `mocks/data/step3-sample.json` | Step 3 example (timeline/principle/math) | 3.5KB |
| `mocks/data/step4-sample.json` | Step 4 example (McKinsey essence) | 1.2KB |
| `mocks/data/feynman-review-sample.json` | Feynman review example | 3.5KB |

**simulateStream** defaults: 50 chunks x 30ms. But `callStep` invokes with `{ chunks: 40, intervalMs: 35 }`.

### C. Animation Components

| Component | File | animationKey | Implementation |
|---|---|---|---|
| MechanismAnim | `components/MechanismAnim.tsx` | `gdn-gate` | React useState + setTimeout sequence |
| AttentionOnTwoAnim | `views/animations/AttentionOnTwoAnim.tsx` | `attention-on2` | CSS @keyframes + React state |
| MambaSsmAnim | `views/animations/MambaSsmAnim.tsx` | `mamba-ssm` | CSS @keyframes + React state |
| MoeRouteAnim | `views/animations/MoeRouteAnim.tsx` | `moe-route` | CSS @keyframes + React state |
| GenericFlowAnim | `views/animations/GenericFlowAnim.tsx` | `generic-flow` | CSS @keyframes + React state |

### D. SVG Template Renderer

`src/gdn/lib/svgRenderer.ts` (13.4KB) supports 5 layout types for Step 1 concept diagrams:
- `flowchart`: Linear process flow
- `comparison`: Old vs new side-by-side
- `hierarchy`: Tree/pyramid structure
- `cycle`: Iterative loop
- `architecture`: Layered system

Uses shadcn-compatible color palette, renders nodes (150x72px, rounded 12px) with edges and labels.

---

> **Document Maintenance**: This SPEC is verified against engineering source code file-by-file and must be kept in sync with every code change.
> **Change Log**: Every feature change must update the corresponding section of this document.
> **Change Log**: Every feature change must update the corresponding section of this document.
|---|---|---|---|
| MechanismAnim | `components/MechanismAnim.tsx` | `gdn-gate` | React useState + setTimeout sequence |
| AttentionOnTwoAnim | `views/animations/AttentionOnTwoAnim.tsx` | `attention-on2` | CSS @keyframes + React state |
| MambaSsmAnim | `views/animations/MambaSsmAnim.tsx` | `mamba-ssm` | CSS @keyframes + React state |
| MoeRouteAnim | `views/animations/MoeRouteAnim.tsx` | `moe-route` | CSS @keyframes + React state |
| GenericFlowAnim | `views/animations/GenericFlowAnim.tsx` | `generic-flow` | CSS @keyframes + React state |

### D. SVG Template Renderer

`src/gdn/lib/svgRenderer.ts` (13.4KB) supports 5 layout types for Step 1 concept diagrams:
- `flowchart`: Linear process flow
- `comparison`: Old vs new side-by-side
- `hierarchy`: Tree/pyramid structure
- `cycle`: Iterative loop
- `architecture`: Layered system

Uses shadcn-compatible color palette, renders nodes (150x72px, rounded 12px) with edges and labels.

---

> **Document Maintenance**: This SPEC is verified against engineering source code file-by-file and must be kept in sync with every code change.
> **Change Log**: Every feature change must update the corresponding section of this document.

> **Document Maintenance**: This SPEC is verified against engineering source code file-by-file and must be kept in sync with every code change.
> **Change Log**: Every feature change must update the corresponding section of this document.
---

> **Document Maintenance**: This SPEC is verified against engineering source code file-by-file and must be kept in sync with every code change.
> **Change Log**: Every feature change must update the corresponding section of this document.
> **Change Log**: Every feature change must update the corresponding section of this document.
