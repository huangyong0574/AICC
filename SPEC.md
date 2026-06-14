# AICC — AI 认知操作系统 / AI Cognition Connector Platform
## Product Specification（总纲 · 唯一事实来源）

> Version: v3.0.0
> Updated: 2026-06-14
> Status: 多页面平台 + 认知状态机闭环已完成；费曼步骤内 loop 评分待迭代
> Package: ai-knowledge-explorer
>
> **本文档定位**：AICC 工程的唯一事实来源（Single Source of Truth），供未来 AI Coding 参照。
> 任何改动若影响「认知状态机 / 存储契约 / 路由 / 页面职责」，必须同步本文档。
> 设计稿源码归档于 `design/aicc-html-bundle/`，与 `src/` 实现对照。
>
> **v3 关键变化**：产品从单一「费曼概念教练」升级为以**认知状态机**为主线的多页面平台
> （discovered→in-plan→learning→published）。费曼引擎降为「learning」阶段的深度学习子系统，
> 其详细规格见第 5/7/8 章（仍然有效）。

---

## 1. Product Positioning

**Product Name**: AICC (AI Cognition Connector) / ai-knowledge-explorer
**One-liner**: 个人「AI 认知操作系统」——把「刷到一个 AI 概念 → 看不懂 → 遗忘」的零散循环，
重构成一条可追踪、可沉淀的认知流水线：**发现 → 计划 → 费曼学习 → 成稿**，全程本地持久化为你的「第二大脑」。
**核心信念**：**输出你的理解，而非 AI 的理解。**

**Target Users**:
- MaaS / 大模型行业的售前方案、AI 业务架构师、产品 / 技术销售
- 不写算法代码、但需要向客户讲清 AI 技术的从业者
- 任何希望长期、系统地积累 AI 认知（而非依赖 AI 即时问答）的人

**Core Demand**: 在 ~15 分钟内穿透理解一个 arXiv / 技术论文里的 AI 概念，
用费曼法验证「我真的懂了」，并把它沉淀为长期记忆与可复用的文章，跨周累积形成认知复利。

**产品哲学（来自 `/` 一封信 · LetterHome）**——这是产品的灵魂，所有功能都为它服务：

| 章节 | 内容 | 对应的系统化回答 |
|---|---|---|
| 01 症状 | **认知断裂**（论文数学/原理晦涩）、**认知单点**（学了不与已有知识链接）、**认知丢失**（ChatBox 学完即忘，无复利） | 费曼四步穿透 / 认知图谱 + 跨周计划 / 状态机 + 本地持久化 |
| 02 信念 | AI 认知是行业工作者的**认知基石**；AI 时代可构建自己的**第二大脑**；时刻**警惕 AI 外包你的理解** | 认知状态机即「第二大脑」机制；费曼「你来讲/评价」对抗 AI 外包 |
| 03 自省 | 人性弱点：贪图短期反馈 / 问了 AI 就以为学会 / 表演式学习 | 设计上以「能讲清/能评价」为完成标准，而非「问过了」 |
| 04 防腐 | 提问与评价定稿；24h 后产出 MD；每周 LLM 审计知识库与图谱 | 编辑器成稿 / 费曼内化评分 / （周度审计待系统化，见第 12 章） |

**Hero Title（费曼工作台）**: "如果你不能简单地解释它，你就没有真正理解它。"

**Default Example Questions**: 费曼工作台每次从知识库随机抽取（如 GDN、Flash Attention、Mamba/SSM、MoE 路由等）。

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

**平台主流程 = 认知状态机**（每个概念在此流水线上流转，全程持久化于 localStorage）：

```
  ┌─────────────┐   加入计划    ┌──────────┐  开始费曼   ┌────────────┐  去成稿/发布  ┌─────────────┐
  │ discovered  │ ───────────► │ in-plan  │ ─────────► │  learning  │ ──────────► │  published  │
  │ 雷达发现     │              │ 待启动    │            │  学习中     │             │  已成稿      │
  │ RadarPage   │              │ PlanPage │            │ FeynmanApp │             │ Editor→     │
  └─────────────┘              └──────────┘            └────────────┘             │   Article   │
        ▲                           │                        │                    └─────────────┘
        │                           │ 移除(仅in-plan免确认)    │                          │
    每周雷达数据                      ▼                        ▼ （详见下方费曼子流程）       ▼
   (radarData.ts)              深度计划看板               费曼四步穿透               文章页 / 认知图谱(绿)

  状态映射：cognition.tsx · localStorage[aicc-cognition-state] = { [id]: CognitionItem }
  当前认知点：sessionStorage[aicc-active-concept]（跨刷新保活，保证 published 回写不断链）
```

**「learning」阶段内部 = 费曼四步穿透子流程**：

```
User inputs natural language question (e.g. "GDN是什么意思？")  ← 计划页带入概念标题预填
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
   Export (5 methods) / 「去成稿」→ EditorPage（携带 conceptId）
        |
   发布 → upsert(conceptId, {slug, state:'published'}) → 文章页 / 计划页「已成稿」
```

### 3.2 Module List

**平台页面模块（路由 + 状态机角色）**：

| Page | Route | 职责 | 状态机角色 | 关键 props / 入口 |
|---|---|---|---|---|
| LetterHome | `/` (`/philosophy`) | 产品文化·一封信（症状/信念/自省/防腐） | 价值观层 | `onEnter`（→ 雷达归档）/ `onNavigate` |
| RadarArchivePage | `/radar` | 认知雷达**归档/全集合**：按周列出每期，时间轴卡片（期号/标题/日期/认知点数/前沿·成熟·已加入计划） | 入口 | `onNavigate` / `onOpenWeek(weekId)` |
| RadarPage | `/radar/:weekId` | 某一**周切片**的雷达卡片（缺省 weekId 时取最新周） | **discovered→in-plan** | `weekId` / `onNavigate`；`addToPlan()`；learning/published 卡片删除需二次确认；含「← 归档」返回 |
| PlanPage | `/plan` | 跨周深度计划看板 | in-plan/learning/published 看板 | `onOpenFeynman(id)` / `onOpenArticle(slug)` |
| FeynmanApp | `/feynman` | 费曼四步穿透学习引擎；**套 AICC SiteHeader + 来源上下文条**（← 深度计划 / 学习中 / 概念 / 来源周 / 设置），不再是飞地 | **in-plan→learning** | `conceptId` / `initialQuestion` / `onGoToEditor(id)` / `onNavigate` |
| EditorPage | `/editor` | Markdown 编辑 + 实时预览 + 发布 | **learning→published** | `conceptId` / `onBack` / `onPublished(slug)` |
| GraphPage | `/graph` | 认知图谱（**全局累积**：跨周全部认知点按概念去重，按来源周聚类、按状态着色）+ 第二大脑成长总览（已成稿/学习中/累积概念/积累天数，真实数据） | 累积 + 成长仪表盘 | `onNavigate`（`useRadarArchive` 取全部周；节点 click→雷达归档） |
| ArticlePage | `/article/:slug` | 文章阅读页 | published 产物 | 先读 `aicc-article-md:<slug>`，回退 `public/content/<slug>.md` |

> 路由编排集中在 `main.tsx`：`pathToState`/`stateToPath` 双向映射，`handleOpenFeynman`/`handleGoToEditor`
> 负责状态流转与 `activeConceptId`（sessionStorage）保活，详见第 3.5 节。

**费曼引擎子模块（learning 阶段内部）**：

| Module | Function | Status | Notes |
|---|---|---|---|
| **Feynman Warmup** | Dynamic 3 role-based questions (biz/CTO/dev) | Done | `callFeynmanWarmup()` |
| **Step 1** | Concept perception (4 parts + loop placeholder) | Done | `callStep("step1")` |
| **Step 2** | Algorithm principle & math (timeline+anim+formula+loop) | Done | `callStep("step2")` |
| **Step 3** | Business value (engineering+business, no loop field) | Done | `callStep("step3")` |
| **Feynman Digest** | 3-role review + knowledge graph generation | Done | `callFeynmanReview()` |
| **Knowledge Graph** | Transformer-based auto-mount | Pending (待上线) | Header button disabled + "soon" badge |
| **Note Library** | Local storage & management | Pending (待上线) | Header button disabled + "soon" badge |
| **LLM Settings** | API Key / Base URL / Model | Done | deepseek-v4-flash default |
| **Export** | Save + MD download/copy + speech script + PPT bullets | Done | 5 export methods |
| **Animation** | 5 built-in animations (GDN-gate/Attention/Mamba/MoE/Generic) | Done | CSS @keyframes + React state |
| **Formula Render** | KaTeX math rendering | Done | LaTeX syntax |
| **SVG Diagrams** | Step1 concept diagram via SVG template renderer | Done | 5 layout types |
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
- 放置位置：`FeynmanApp.tsx` 中 header 下方，`started && warmupConfirmed` 时显示
- 状态来源：从 `steps[]` 的 streaming/confirmed 状态 + feynman digest 状态计算得出

---

### 3.4 Step Confirmation Mechanism

> **Important**: Current version's "loop questions" in steps 1/2 are UI placeholders only (`LoopBlock` component).
> User clicks "confirm" to proceed directly without LLM evaluation.
> `LoopBlock` textarea is `disabled`, code comment: "当前版本：输入占位；下一轮会加入 LLM 评分 + 下一步解锁逻辑"

---

### 3.5 Cognition State Machine（认知状态机）★ 平台主线

> 实现：`src/lib/cognition.tsx`（`CognitionProvider` + `useCognition`）。这是 AICC 的数据脊柱，
> 与设计稿 `aicc-html-bundle` 共享同一套 localStorage 模型。**任何改动须保持以下契约。**

**数据模型**

```ts
type CognitionStateValue = "discovered" | "in-plan" | "learning" | "published"

interface CognitionItem {
  state: CognitionStateValue
  title: string         // 中文标题
  titleEn?: string      // 英文标题（雷达 eyebrow）
  slug?: string         // 成稿后对应文章 slug（published 时写入）
  addedAt?: number      // 加入计划时间戳（ms）；流转中保持不变
  sourceWeek?: string   // 来源周，如 2026-W22
  sourceFile?: string   // 来源雷达快照文件名（可选）
}

type CognitionMap = Record<string /* id */, CognitionItem>
```

**状态标签**（`STATE_LABELS`）：`discovered=已发现`、`in-plan=待启动`、`learning=学习中`、`published=已成稿`。

**存储契约**

| Key | 作用域 | 内容 |
|---|---|---|
| `aicc-cognition-state` | localStorage | 核心 `CognitionMap` |
| `aicc-deep-plan` | localStorage | 派生：所有 `state !== 'discovered'` 的 id 列表（每次 persist 自动重算） |
| `aicc-active-concept` | **sessionStorage** | 当前认知点 id；`main.tsx` 在进入费曼/编辑器时写、发布后清 |

**状态转移表**

| From → To | 触发 UI | 代码路径 | 副作用 |
|---|---|---|---|
| ∅ → in-plan | 雷达「加入深入计划」 | `RadarPage.addToPlan(id, meta)` | 写 title/titleEn/sourceWeek，补 `addedAt` |
| in-plan → learning | 计划「开始费曼学习」 | `PlanPage.onOpenFeynman(id)` → `main.handleOpenFeynman` | `setState(id,'learning')` + 写 `aicc-active-concept` + 进 `/feynman`，标题预填 |
| learning → published | 费曼「去成稿」→ 编辑器发布 | `FeynmanApp.onGoToEditor(id)` → `EditorPage.confirmPublish` | `upsert(id,{slug,title,state:'published'})`；发布后清 `aicc-active-concept` |
| any(非discovered) → ∅ | 雷达再次点击 / 计划「移除」 | `remove(id)` | 硬删除条目；**雷达页对 learning/published 需二次确认** |

**Context API（`useCognition()`）**

| 方法 | 说明 |
|---|---|
| `map` | 当前 `CognitionMap` |
| `upsert(id, patch)` | 浅合并写入（保留已有字段）；EditorPage 发布走此路径 |
| `setState(id, state)` | 仅切状态；切到非 discovered 且无 `addedAt` 时补时间戳 |
| `addToPlan(id, meta)` | discovered → in-plan |
| `remove(id)` | 删除条目 |
| `plannedItems()` | 返回非 discovered 条目，按 `addedAt` 新→旧 |

**关键不变量 / 护栏（务必维持）**

1. **`activeConceptId` 必须可跨整页重载恢复**：通用「编辑器」导航入口要 `setActiveConcept('')` 清空（防止把无关文章误回写到上一个 learning 概念）；「去成稿」才携带 id；发布成功后清空。
2. **`addedAt` 在整个生命周期保持不变**（用于计划页排序），流转只改 `state`/`slug`。
3. **跨页同步**：Provider 监听 `storage` / `focus` 事件回灌，多标签页一致。
4. **id 一致性**：雷达、计划、图谱、编辑器必须用同一个 `id`（当前取 `radarData` 的 slug，如 `dynamic-workflows`）。
5. **删除是硬删除**：会丢失 learning 进度与 published 的 slug 关联——非 in-plan 必须二次确认。

---

### 3.6 Radar Data Source & Ingestion（雷达数据来源 · 外循环）

> 「发现」入口的数据由**外部 skill 摄取**，工程动态消费——这是状态机的源头，单独成节。

**上游：`ai-cognitive-radar` skill**（个人知识系统的外循环感知层，运行在 Qoder，仓库外）
每周扫描 YouTube 频道 / AI 公司博客 / 权威媒体 → 速览层 + 精选 5-8 个深度认知点（带成熟度）。
产出：① Markdown 周报（存 Obsidian）② 静态 HTML（部署 ECS `/weekly/{date}.html`）③ **结构化 JSON（喂工程）** ④ 微信推送。

**数据契约（唯一来源）：`public/content/radar/`**

| 文件 | 内容 |
|---|---|
| `index.json` | `{ weeks: RadarIndexEntry[] }`，新→旧，`weeks[0]` 为最新周 |
| `{weekId}.json` | 一周的 `RadarWeek`：`{ weekId, dateRange, generatedAt, insights: RadarInsight[] }` |

`RadarInsight` 字段：`id`(=`{weekId}-{NN}-{slug}`) / index / eyebrow(英) / title(中) / tagline(一句话) / maturity(`frontier`🟡 \| `mature`🟢 \| `experimental`🔴) / corePrinciple / whyMatters / org / dateRange / sourceUrl。

**下游：工程动态加载**（`src/data/radarData.ts`，三个 hook）
- `useRadarArchive()` → 读 `index.json` 全部周 + 各周 JSON → 归档页（`RadarArchivePage`）列每期卡片；**`GraphPage` 也用它做全局累积**。
- `useRadarWeekById(weekId?)` → 按 weekId 查 index 取对应文件加载（缺省取最新周）→ 周切片页（`RadarPage`）。
- `useLatestRadarWeek()` → 取 `weeks[0]` 最新周（保留，作兜底/未来概览用）。
- 任何环节失败回退内置 seed `radarWeekData`。**id 规范** `{weekId}-{NN}-{slug}` 使归档周分组、PlanPage 编号、图谱按概念去重、状态机存储自洽。

**两级雷达 IA（对齐产品链路②③）**：`/radar` 归档全集合 → 点某期 → `/radar/{weekId}` 该周切片 → 选 1 个认知点 → 费曼。

> 即：**skill 每周摄取 → 写 `public/content/radar/*.json`（+ 更新 index）→ 归档页自动多出一期 → 进某期 → 加入计划进入状态机**。新增一周无需改代码。

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
├── src/
│   ├── main.tsx                     # App 路由（手写 History）+ CognitionProvider + 状态机流转编排
│   ├── lib/
│   │   ├── cognition.tsx            # ★ 认知状态机（Provider/useCognition/存储模型）
│   │   ├── markdown.ts              # frontmatter 解析 + 文章正文渲染（编辑器/文章页共用）
│   │   └── utils.ts                 # cn() 等工具
│   ├── pages/                       # 平台页面（每页对应一个路由/状态机角色）
│   │   ├── LetterHome.tsx           # 产品文化·一封信
│   │   ├── RadarArchivePage.tsx     # 认知雷达归档/全集合（周时间轴）
│   │   ├── RadarPage.tsx            # 某周雷达切片（discovered→in-plan）
│   │   ├── PlanPage.tsx             # 深度计划看板
│   │   ├── EditorPage.tsx           # 文章编辑器（learning→published）
│   │   ├── GraphPage.tsx            # 认知图谱（全局累积 + 第二大脑成长总览）
│   │   ├── ArticlePage.tsx          # 文章详情页
│   │   └── SiteHeader.tsx           # 全局导航条（5 Tab）+ useDarkModeShared
│   │   # 注：认知工作台 Dashboard 已下线（数字/图谱为占位，价值并入图谱与计划）
│   ├── components/
│   │   ├── radar/                   # RadarCard / RadarHero / RadarToolbar / MaturityPill / PlanToggle
│   │   └── ui/                      # shadcn/ui 基础组件
│   ├── data/
│   │   └── radarData.ts             # 雷达周数据（weekId + insights[]，状态机 id 来源）
│   ├── feynman/                     # 费曼引擎（learning 阶段子系统）
│   │   ├── FeynmanApp.tsx           # 主应用（接 conceptId/initialQuestion/onGoToEditor）
│   │   ├── types.ts                 # 数据契约
│   │   ├── components/              # StepPipeline / FeynmanPrime / DigestPanel / views/ / animations/ …
│   │   ├── lib/                     # llm.ts / prompts.ts / storage.ts / partialJson.ts / svgRenderer.ts
│   │   └── data/                    # algorithm-concepts.ts(.md)（30 概念 + arXiv 链接）
│   ├── App.tsx                      # 旧单页入口（已无人 import，遗留）
│   └── index.css                    # 全局样式 + CSS 变量
├── public/content/                  # 静态文章库（articles.json + *.md/*.html）
├── design/aicc-html-bundle/         # ★ 设计稿源（归口为唯一来源，与 src/ 对照）
├── package.json / tsconfig*.json / vite.config.ts / tailwind.config.ts
└── .claude/launch.json              # dev server 配置（端口 5188）
```

### 4.3 Core Data Flow

```
User input -> FeynmanApp.tsx (learning 阶段内部状态管理)
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
| Step 1 | `callStep("step1")` | deepseek-v4-flash | Yes | **Yes** (forced) | **No** | json_object | 0.3 | 用户「提交猜想 / 直接看」后（先猜后揭，§5.0） |
| Step 2 | `callStep("step2")` | deepseek-v4-flash | Yes | **Yes** (forced) | **No** | json_object | 0.3 | 进入该步 → 先写猜想 → 提交后揭晓 |
| Step 3 | `callStep("step3")` | deepseek-v4-flash | Yes | **No** | **No** | json_object | 0.3 | 同上 |
| Step 4 | `callStep("step4")` | deepseek-v4-flash | Yes | **No** | **No** | json_object | 0.3 | 同上 |
| 认知差 Gap | `callGap` | deepseek-v4-flash | No | **No** | No | json_object | 0.3 | 揭晓后，若用户写过非空猜想（对比猜想 vs 答案） |
| Feynman Review | `callFeynmanReview` | deepseek-v4-flash | No | **Yes** (forced) | **Yes** | json_object | 0.5 | User manual submit |

**Design Rationale for Call Matrix**:
- **Warmup no search**: Avoid LLM being misled by homonymous business concepts (e.g. PolarDB GDN = Global Database Network)
- **Warmup high temperature (0.8)**: Ensure diversity without garbled output; disable thinking for JSON stability
- **All steps no thinking**: Avoid thinking token stream slowing response
- **Step 1+2 search**: Concept perception and scenario selection benefit from real-time web data
- **Step 3+4 no search**: Algorithm derivation, math, and essence summary are based on prior step context, no external search needed
- **先猜后揭（不再 auto）**: 每步不再自动触发；进入该步先停在「预测」阶段，用户写下猜想（或选「不确定，直接看」=空猜想）后才调用 `callStep` 揭晓。揭晓后若猜想非空，追加一次 `callGap` 对比生成「认知差（命中/遗漏/偏差）」。详见 §5.0。
- **Gap 非流式**: `callGap` 返回 `{hit,miss,wrong}`（每类 ≤4 条、≤20 字），失败静默（不阻断揭晓）

### 4.5 Storage System

> 完整数据契约。分两层：**平台状态机层（aicc-*）** 与 **费曼引擎层（aicc-feynman-* / aicc-llm-cfg，原 gdn_* 已迁移）**。

**平台层（认知状态机 + 文章 + 主题）**

| Key | 作用域 | 写入方 | Structure |
|---|---|---|---|
| `aicc-cognition-state` | localStorage | `cognition.tsx` | `Record<id, CognitionItem>`（状态机核心） |
| `aicc-deep-plan` | localStorage | `cognition.tsx` | `string[]`（非 discovered 的 id，派生） |
| `aicc-active-concept` | **sessionStorage** | `main.tsx` | `string`（当前认知点 id，跨刷新保活） |
| `aicc-published-articles` | localStorage | `EditorPage.tsx` | 已发布文章索引 `{slug,title,subtitle,category,date,status,tags}[]` |
| `aicc-article-md:<slug>` | localStorage | `EditorPage` → `ArticlePage` | 已发布文章 Markdown 原文（文章页优先回读） |
| `aicc-theme` | localStorage | `SiteHeader.tsx` | `"dark" \| "light"` |

**费曼引擎层**

| Key | Content | Structure |
|---|---|---|
| `aicc-llm-cfg` | LLM config | `{ apiKey, baseUrl, model }` |
| `aicc-feynman-notes` | Note library | `Note[]` array |
| `aicc-feynman-graph` | Knowledge graph | `GraphDelta[]` array |

**Default Config** (`storage.ts`):
```typescript
DEFAULT_CFG = {
  apiKey: "",
  baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  model: "deepseek-v4-flash",
}
```

**Legacy Model Migration**: `loadCfg()` contains auto-migration logic. If stored model is in `LEGACY_MODELS = ["qwen3.6-plus", "qwen-plus"]`, it auto-upgrades to current default (`deepseek-v4-flash`) without changing localStorage key version.
> ⚠️ `deepseek-v4-pro` 必须**不**在 `LEGACY_MODELS` 里——它是 SettingsDialog 的有效选项（§4.6）。曾误列入导致用户选 pro 后被静默降级回 flash（model-downgrade bug，已修）。

**内化回流（费曼 → 平台图谱）**：`aicc-cognition-state` 的 `CognitionItem` 含可选 `relation?: { parent; text; tags?; oneLine? }`。费曼内化完成时 `FeynmanApp.onInternalized(id, delta)` → `main.tsx:handleInternalized` → `cognition.upsert(id,{relation})`，供 GraphPage 渲染概念间关系边（§3.5 / §5.6）。

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
| 手写 History API 路由 | 不用 react-router-dom（已作为僵尸依赖移除）；`main.tsx` 自管 path→page 映射，应用单页 | `main.tsx`, `package.json` |
| Partial JSON streaming | `partialJson.ts` field-by-field balanced bracket scan instead of try/catch storm | `lib/partialJson.ts` |
| SVG template for Step1 diagrams | LLM returns structured nodes/edges, `svgRenderer.ts` renders locally (no external image API) | `lib/svgRenderer.ts` |

---

## 5. Detailed Functional Spec

### 5.0 先猜后揭（Predict → Reveal → Gap，四步通用交互）

> 费曼核心是「输出倒逼输入」。每一步（Step 1–4）不再进入即自动生成，而是先调用学习者已有认知，再用差异校准——降低「划过即懂」的错觉。

**状态机（每步 StepCard 内）**：
1. **predict（预测）**：进入该步、未生成时停在此态（`inPredict = active && !answer && !streaming && !error && prediction === undefined`）。展示猜想输入框 + 两个出口：
   - 「提交猜想，揭晓」（猜想非空才可点）→ `submitPrediction(idx, text)`
   - 「不确定，直接看」→ `submitPrediction(idx, "")`（空猜想，跳过认知差）
2. **reveal（揭晓）**：`runOne(idx, prediction)` 流式生成该步答案（`callStep`）。揭晓后「你的猜想」原文保留展示。
3. **gap（认知差）**：若 `prediction` 非空，揭晓后追加 `callGap`，对比猜想 vs 标准答案，渲染 `GapPanel`：
   - **命中**（`hit`，绿/success）· **遗漏**（`miss`，琥珀/warning）· **偏差**（`wrong`，红/destructive）
   - 某类为空则不渲染该行；`callGap` 失败静默（不阻断已揭晓的答案）。

**数据**：`StepEntry.prediction?: string`（`undefined`=未提交、`""`=直接看、非空=猜想原文）、`StepEntry.gap?: StepGap`，`StepGap = { hit: string[]; miss: string[]; wrong: string[] }`。

**实现要点**（`StepPipeline.tsx`）：
- 取消自动生成（旧 `autoStart` useEffect 已移除），改由 `submitPrediction → runOne` 驱动。
- `prediction` 随 `runOne` 的**首个** `update` 与 `streaming:true` 同 tick 写入——避免分两次 `update` 时被 `valueRef` 过期值覆盖（曾导致猜想被清空的 bug，已修）。
- `proceedToNext` 仅 `setActiveIdx(idx+1)`，让下一步重新落到 predict 态。

---

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

### 5.7 素材导出栏（已移除）

> 原 `ExportBar`（素材导出 / 沉淀：保存到笔记库 · 下载 .md · 复制 Markdown · 讲稿片段 · PPT 要点）已整体移除，`components/ExportBar.tsx` 与 `lib/mdExport.ts` 一并删除。

**移除理由（向产品主线收敛）**：
- **违背「输出你的理解，而非 AI 的理解」**：五个按钮导出的都是 AI 的四步结构化输出（讲稿/PPT 只是再包装一遍），与一封信的核心信条冲突。真正值得沉淀的是用户**自己的成稿文章**，已有专属路径（见下）。
- **笔记库已无入口**：`LibraryDialog` 早已删除，`aicc-feynman-notes` 仅作「相同提问直接加载」的内部缓存；「保存到笔记库」指向一个不存在的视图。
- **重复 + 过早逃生口**：内化完成时 `FeynmanApp` 已自动 `addNote`（无需手动保存）；且该栏在「任意一步确认」后即出现，会把用户从「内化 → 去成稿」正路上拉走。

**唯一沉淀出口**：内化三问 →「去成稿」→ 成稿编辑器 → 发布 → 更新认知图谱 + 标记 `published`（§5.6 / §3.5）。若日后需要「带走原始素材」，应放在**已发布文章**（用户的产物）侧，而非 AI 解释这一侧。

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

Each step has its own complete system prompt (defined in `src/feynman/lib/prompts.ts`). Below is SYSTEM_STEP1 as representative example (others follow similar structure with role-specific persona):

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
| apiKey 必填 | 无 apiKey 时各调用入口直接报错并弹设置（产品必须连接 LLM，已无离线兜底） | 保持各入口 `!cfg.apiKey` 前置校验一致 |

---

## 10. Development Standards

### 10.1 Code Standards

- **TypeScript**: strict mode, ES2020 target, ESNext module
- **Path alias**: `@/*` -> `./src/*` (tsconfig.app.json + vite.config.ts)
- **Component style**: Function components + Hooks, prefer shadcn/ui
- **Styles**: Tailwind CSS atomic classes, CSS Variables for theme
- **Compilation scope**: `src/main.tsx`, `src/pages/**`, `src/feynman/**`, `src/components/**`, `src/lib/**`, `src/data/**`
- **状态机优先**: 任何涉及概念生命周期的逻辑都应经 `useCognition()`，不要绕过直接写 `localStorage`
- **图标声明**: 项目用自定义 `src/lucide-react.d.ts` 显式声明图标；新增图标需在此补声明，否则 tsc 报错

### 10.2 Data Standards

- **LLM output**: Must be valid JSON, no Markdown fences
- **Streaming**: SSE protocol (`data:` prefix lines), AbortController cancel, fault-tolerant parsing (regex JSON extraction)
- **Error handling**: Network errors, JSON parse failures, API rate limits all need fallback toast
- **Type safety**: Every LLM return value mapped to strong types via destructuring

### 10.3 Testing

- **E2E / 流程**: `scripts/test-main-flow.mjs`、`scripts/test-step1.mjs`、`scripts/test-radar*.mjs`（Playwright/Node 脚本）
- **平台导航/状态机走查**: `test-screenshots/*.mjs`（run-e2e / test-nav-routing / verify-* 等，含截图产物）
- **真实 LLM E2E**: 本产品必须连接 LLM（已移除离线 Mock）；费曼链路需配置 DashScope key 走真实调用
- **手动验证**: 本次集成已用浏览器预览全链路实测 discovered→in-plan→learning→published（含刷新保活、误删护栏）

---

## 11. Running

```bash
# Development（默认 Vite 5173；本仓 .claude/launch.json 固定 5188）
npm run dev
npm run dev -- --port 5188 --strictPort   # 固定端口

# Production build
npm run build               # tsc -b && vite build -> dist/

# Preview build
npm run preview
```

---

## 12. Iteration Roadmap

> 平台级方向（待产品确认，详见与本次梳理同步给出的「产品逻辑建议」）：

### P0 — 状态机闭环（已完成 v3.0.0）
- [x] 认知状态机 discovered→in-plan→learning→published 全链路打通
- [x] 计划页 / 编辑器 / 图谱接入，`activeConceptId` 跨刷新保活
- [x] 雷达删除护栏、编辑器 slug 冲突护栏
- [x] **雷达数据动态化**：`ai-cognitive-radar` skill 输出 `public/content/radar/*.json`，工程动态加载；id 规范 `{weekId}-{NN}-{slug}`（详见 §3.6）
- [x] **两级雷达 IA**：归档全集合（`/radar`）→ 周切片（`/radar/:weekId`），对齐产品链路②③
- [x] **认知图谱全局累积**：GraphPage 跨周聚合全部认知点（按概念去重、按来源周聚类、按状态着色）
- [x] **下线认知工作台**：占位数字/假图谱删除；「第二大脑成长总览」以真实数据并入认知图谱页；导航 6→5
- [x] **费曼学习页外壳归一（第 1 层）**：套 AICC SiteHeader + 来源上下文条，删「笔记库/图谱 soon」假按钮、统一品牌页脚，学习页不再是飞地

### P1 — 费曼学习页交互升级 + 数据归一（已完成 v3.1.0）
- [x] **「先猜后揭」交互（第 2 层）**：每步先写猜想 → 提交后揭晓 + 认知差（命中/遗漏/偏差）→ 带走修正；`StepPipeline` + `callStep` + 新增 `callGap`，详见 §5.0（已真·LLM 迭代验证）
- [x] **概念模式锁定 + 示例归一**：从计划带入的概念已确定——概念模式锁定展示该概念、直接「开始讲解」，不再显示可编辑搜索框 / 无关示例；仅自由模式显示输入，示例改取雷达概念（弃用 `algorithm-concepts.ts` 旧 30 库）
- [x] **Takeaway 改用户手写 + 内化前置门槛**：每步「带走」弹窗由 AI 直接给改为用户手写（AI 仅作参考点击填入）；「去成稿」前必须完成费曼内化三问（强化「你来输出」）
- [x] **费曼数据并入平台**：`gdn_* → aicc-*` 一次性迁移（保留用户数据）；内化成果经 `onInternalized` 直接喂平台认知图谱
- [x] **认知图谱关系边**：GraphPage 接 `CognitionItem.relation`（费曼内化产出的父节点/关系）渲染真实关系边 + 父节点 hub（不再仅节点）

### P1 — 让主线「真正闭环」（剩余高价值缺口）
- [ ] **已发布文章的独立文章库视图**：发布已写 localStorage（`aicc-article-md` + `aicc-published-articles`），目前经「深度计划」已成稿筛选 / 图谱访问；可考虑独立文章库视图（或并入图谱页）
- [ ] **每周回顾（链路⑤）**：在图谱上做「认知水平回顾 + 避免遗忘」的复习机制（间隔重复）
- [ ] **防腐机制系统化**：把「24h 未成稿提醒 / 周度 LLM 审计 / 评价优于问答」从一封信的承诺变成实际功能（如防腐看板）

### P2 — 学习深度与质量
- [ ] step 1/2 loop LLM 评分（LoopBlock 从占位升级为交互解锁）
- [ ] 学习进度跟踪 + 间隔复习（spaced repetition，呼应「认知复利」）
- [ ] step3 历史上下文用摘要替代全 JSON；按概念类型动态决定是否联网搜索
- [ ] i18n（界面文案中英双语）

> 已完成并从本路线图移除：概念 id 命名规范 `{week}-{idx}-{slug}`（见 P0 / §3.6）、清理僵尸依赖 `react-router-dom` + 移除遗留 `App.tsx`（6 问代码按 §4.7 有意保留作笔记兼容）。

---

## Appendix

### A. Complete Type Definitions

See `src/feynman/types.ts`, containing two parallel systems:
- **New 4-step**: `StepKey`, `StepEntry`, `Step1Answer`, `Step2Answer`, `Step3Answer`, `Step4Answer` (active)
  - `StepEntry` 含 `prediction?: string`（先猜后揭：`undefined`=未提交 / `""`=直接看 / 非空=猜想原文）与 `gap?: StepGap`
  - `StepGap = { hit: string[]; miss: string[]; wrong: string[] }`（认知差：命中/遗漏/偏差）
- **Legacy 6-question**: `QaKey`, `QaEntry`, `BackgroundAnswer`, `PrincipleAnswer`, etc. (retained for `Note.qa` compat)

### B. （已移除）离线 Fixture 数据

> 本产品必须连接 LLM。原 `feynman/mocks/`（fixtures + 6 个样本 JSON）与 `offlineMock` 模式已整体移除——所有费曼调用走真实 DashScope LLM。

### C. Animation Components

| Component | File | animationKey | Implementation |
|---|---|---|---|
| MechanismAnim | `components/MechanismAnim.tsx` | `gdn-gate` | React useState + setTimeout sequence |
| AttentionOnTwoAnim | `views/animations/AttentionOnTwoAnim.tsx` | `attention-on2` | CSS @keyframes + React state |
| MambaSsmAnim | `views/animations/MambaSsmAnim.tsx` | `mamba-ssm` | CSS @keyframes + React state |
| MoeRouteAnim | `views/animations/MoeRouteAnim.tsx` | `moe-route` | CSS @keyframes + React state |
| GenericFlowAnim | `views/animations/GenericFlowAnim.tsx` | `generic-flow` | CSS @keyframes + React state |

### D. SVG Template Renderer

`src/feynman/lib/svgRenderer.ts` supports 5 layout types for Step 1 concept diagrams:
- `flowchart`: Linear process flow
- `comparison`: Old vs new side-by-side
- `hierarchy`: Tree/pyramid structure
- `cycle`: Iterative loop
- `architecture`: Layered system

Uses shadcn-compatible color palette, renders nodes (150x72px, rounded 12px) with edges and labels.

---

> **Document Maintenance**: This SPEC is verified against engineering source code file-by-file and must be kept in sync with every code change.
> **Change Log**: Every feature change must update the corresponding section of this document.
