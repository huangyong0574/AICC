# AICC — AI Concept Cognition

**献给 AI 认知进化追求者的一封信 · 用费曼学习法穿透理解 AI 算法概念**

[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com)

---

## What is AICC?

**AICC**（AI Concept Cognition）是一个**个人 AI 认知操作系统**，围绕「输出你的理解，而非 AI 的理解」这一核心信念构建。它把零散的「刷到一个概念 → 看不懂 → 遗忘」循环，重构成一条可追踪、可沉淀的**认知流水线**。

### 🧭 核心：认知状态机（产品主线）

每一个 AI 概念都在一条状态机上流转，全程持久化于浏览器本地（`localStorage`），构成你的「第二大脑」：

```
discovered ──► in-plan ──► learning ──► published
（雷达发现）   （加入计划）  （费曼学习中）  （已成稿）
   Radar         Plan        Feynman      Editor → Article
```

| 状态 | 标签 | 含义 | 驱动页面 | 流转动作 |
|------|------|------|----------|----------|
| `discovered` | 已发现 | 在认知雷达里被扫描到 | RadarPage | 「加入深入计划」 |
| `in-plan` | 待启动 | 已加入跨周深度计划 | PlanPage | 「开始费曼学习」 |
| `learning` | 学习中 | 正在费曼工作台穿透 | FeynmanApp | 「去成稿」 |
| `published` | 已成稿 | 已输出为自己的文章 | EditorPage | 发布 → 文章页 |

### 页面模块

| 模块 | 路由 | 定位 | 在状态机中的角色 |
|------|------|------|------|
| **产品文化** (LetterHome) | `/` | 一封写给 AI 认知长期进化者的信：症状 / 信念 / 自省 / 防腐 | 价值观层 |
| **认知雷达·归档** (RadarArchive) | `/radar` | 全集合：按周列出每期雷达（时间轴卡片），选一期进入 | 入口 |
| **认知雷达·周切片** (Radar) | `/radar/:weekId` | 某周的认知点卡片，标「研究前沿 / 成熟可用」 | `discovered → in-plan` |
| **深度计划** (Plan) | `/plan` | 跨周累积的深度学习计划，按状态筛选/计数 | `in-plan / learning / published` 看板 |
| **费曼工作台** (Feynman) | `/feynman` | 单概念费曼四步穿透学习引擎 | `in-plan → learning` |
| **文章编辑器** (Editor) | `/editor` | Markdown 实时预览 + 发布，把理解写成文章 | `learning → published` |
| **认知图谱** (Graph) | `/graph` | 全局累积的概念网络（跨周去重、按来源周聚类、按状态着色）+ 第二大脑成长总览 | 累积 + 成长仪表盘 |
| **文章详情** (Article) | `/article/:slug` | 文章阅读页（先读本地草稿，回退 `public/content`） | `published` 产物 |

核心学习引擎采用 **费曼四步穿透模型**：

```
Feynman Warm-up（3 角色提问）→ Step 1 直觉 → Step 2 场景 → Step 3 机制 → Step 4 本质
```

内置 **30 个热门 AI/LLM 算法概念**知识库 + 一批深度 AI 概念文章。设计稿源码归档于 [`design/aicc-html-bundle/`](design/aicc-html-bundle/)，与 `src/` 实现同仓，仓库即唯一事实来源。

---

## Multi-Page Architecture

```
main.tsx (App Router · 手写 History 路由 + CognitionProvider)
├── /              → LetterHome         # 产品文化 · 一封信
├── /radar         → RadarArchivePage   # 认知雷达归档/全集合（按周列出每期）
├── /radar/:weekId → RadarPage          # 某周雷达切片（discovered → in-plan）
├── /plan          → PlanPage           # 深度计划看板（in-plan / learning / published）
├── /feynman       → FeynmanApp         # 费曼四步穿透学习引擎（in-plan → learning）
├── /editor        → EditorPage         # 文章编辑器（learning → published）
├── /graph         → GraphPage          # 认知图谱（全局累积 + 成长总览）
└── /article/:slug → ArticlePage        # 文章详情页（本地草稿优先，回退 public/content）
（/dashboard 旧链接 → 重定向到 /radar 归档；认知工作台已下线）
```

整个 `<App>` 包裹在 `CognitionProvider`（`src/lib/cognition.tsx`）内，所有页面通过 `useCognition()` 共享同一份状态机数据。「当前认知点」`activeConceptId` 持久化到 `sessionStorage`，确保 `learning → published` 的回写不因刷新 / 直达 URL / 切换 tab 而断链。

### 导航系统

`SiteHeader` 全局导航条包含五个 Tab：**产品文化** / **认知雷达** / **深度计划** / **认知图谱** / **编辑器**，支持深色模式切换。顶部「编辑器」为通用入口（写任意文章，不绑定认知点）；「去成稿」按钮才携带认知点 id 完成 `published` 回写。（认知工作台已下线，其「第二大脑成长」总览并入认知图谱页。）

---

## Core Features

### 1. 产品文化 — 一封信（LetterHome）

以「献给和我一样的 AI 认知长期进化者」为主题的产品宣言，包含四个章节：

- **01 症状** — AI 认知断裂 / 单点 / 丢失三大痛点
- **02 信念** — 认知基石 / 第二大脑 / 警惕 AI 外包理解
- **03 自省** — 人性弱点的诚实面对
- **04 防腐** — 三条防腐行为约定（24h 后产出 MD / 评价题优于问答题 / 周度 LLM 审计）

### 2. 认知图谱（Graph）— 累积 + 第二大脑成长

- 全局累积：跨周聚合全部认知点（按概念去重、按来源周聚类、按状态着色），一眼看出「学到了什么、缺什么」
- 第二大脑成长总览：累积概念 / 已成稿 / 学习中 / 积累天数 —— 全部取自真实状态机数据
- （认知工作台已下线：原占位数字与假图谱删除，价值并入此页与深度计划）

### 3. AI 概念文章库

| 文章 | 分类 |
|------|------|
| Flash Attention 2 与 3 的工程实现差异 | LLM 算法原理 |
| CSA（Compressed Sparse Attention） | LLM 算法原理 |
| MLA（Multi-head Latent Attention） | LLM 算法原理 |
| RoPE 旋转位置编码 | LLM 算法原理 |
| Swarm：OpenAI 极简多 Agent 编排框架 | 全球热门 Agent 产品 |
| LangGraph：用状态机思维编排 Agent 工作流 | 全球热门 Agent 产品 |

文章存储在 `public/content/`，支持 HTML 和 Markdown 双格式。

### 4. 认知流水线（Radar → Plan → Feynman → Editor）

围绕认知状态机的四段流转，由四个页面接力驱动：

**4.1 认知雷达（Radar）— `discovered → in-plan`**
- 技术成熟度评估：每项标记「研究前沿」(amber) 或「成熟可用」(green)
- 过滤与排序：按成熟度筛选；「加入深入计划」把概念置为 `in-plan`
- 安全护栏：对已 `learning` / `published` 的卡片再点需二次确认，避免误删进度 / 文章关联
- 响应式：桌面 / 平板 / 移动端自适应

**4.2 深度计划（Plan）— 跨周累积看板**
- 汇总所有非 `discovered` 概念，按 `待启动 / 学习中 / 已成稿` 计数与筛选
- 每项按状态给出操作：待启动→「开始费曼学习」、学习中→「继续学习」、已成稿→「查看文章」
- 按加入时间排序（新→旧），数据跨周累积，全部存于本地

**4.3 文章编辑器（Editor）— `learning → published`**
- 左侧 Markdown 输入（支持拖入 `.md`）、右侧实时渲染 AICC 文章页样式
- 解析 YAML frontmatter（title/subtitle/date/category/tags/status），自动字数与阅读时长
- 发布 = 写入 `localStorage`（文章页可回读）+ 下载 `.md` 兜底；若携带认知点 id，则回写该概念为 `published` 并记录 slug
- slug 必填，同名覆盖前二次确认

### 5. 费曼四步穿透学习引擎

#### 3 Warm-up Questions（费曼预热）
- LLM 从三个角色（业务总监 / CTO / 开发者）动态生成 3 道预热问题
- 渐进式卡片揭示，减少等待感
- 用户触发：等待明确确认后才开始（不自动推进）

#### 4 Learning Steps（递进式深化）
| 步骤 | 焦点 | 输出 |
|------|------|------|
| **Step 1: 直觉** | "是什么？" | 类比 + 定义 + 术语表 + Takeaway |
| **Step 2: 场景** | "用在哪？" | 适用/不适用场景 + 选择标准 |
| **Step 3: 机制** | "怎么工作？" | 分步帧 + **动态 SVG** + Token 级数学 (LaTeX) |
| **Step 4: 本质** | "一句话？" | 一句话 + 锚点隐喻 + 前后对比 + 3 个要点 |

#### = 1 概念掌握
- 每步确认后才进阶
- 自动挂载到本地知识图谱

### 6. 动态 SVG 机制图

- Step 3 中 **LLM 生成 SVG**：每个算法获得反映其核心机制的独特图表
- SVG 规范：`viewBox="0 0 600 320"`，标记节点、方向箭头、高亮关键组件
- 示例：LoRA 展示冻结 W + 低秩旁路；Ring Attention 展示 GPU 环拓扑；MoE 展示路由 → 专家选择

### 7. 渐进式渲染与骨架屏

- 每步都有**分段骨架占位**，配有角色专属加载叙事文案
- 流式传输过程中无黑盒 JSON 等待 — 用户在每个阶段看到有意义的进展
- 共享 `StreamingSection` 组件确保一致 UX

### 8. 本地优先架构

- **无需后端**：所有 LLM 调用直接走 DashScope（阿里云百炼）
- **离线 Mock 模式**：预录制 fixture 用于快速 UI 调试
- **笔记持久化**：localStorage + Markdown 导出
- **知识图谱**：已学习概念的可视化

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18 + TypeScript 5 + Vite 6 |
| **UI** | Tailwind CSS + shadcn/ui + Radix Primitives |
| **Icons** | lucide-react |
| **Math Rendering** | KaTeX |
| **Routing** | History API（手写轻量路由，`main.tsx`） |
| **State** | React Hooks + `CognitionProvider`（认知状态机，无外部状态库） |
| **Storage** | localStorage（状态机、计划、文章、笔记、图谱、配置）+ sessionStorage（当前认知点） |
| **LLM** | DashScope compatible-mode API（deepseek-v4-flash） |
| **Streaming** | SSE (Server-Sent Events) with AbortController |
| **Testing** | Playwright (E2E) |

### 本地存储键（Storage Keys · 数据契约）

> 这是状态机与持久化的事实来源，新增/改名前务必同步本表。

| Key | 作用域 | 写入方 | 内容 |
|-----|--------|--------|------|
| `aicc-cognition-state` | localStorage | `cognition.tsx` | 状态机核心：`{ [id]: CognitionItem }`（state/title/titleEn/slug/addedAt/sourceWeek） |
| `aicc-deep-plan` | localStorage | `cognition.tsx` | 派生：所有非 `discovered` 的 id 列表 |
| `aicc-active-concept` | **sessionStorage** | `main.tsx` | 当前正在学习/成稿的认知点 id（跨刷新保活，防 `published` 回写断链） |
| `aicc-published-articles` | localStorage | `EditorPage.tsx` | 已发布文章索引（slug/title/category/date/…） |
| `aicc-article-md:<slug>` | localStorage | `EditorPage.tsx` → `ArticlePage.tsx` | 已发布文章的 Markdown 原文（文章页优先回读） |
| `aicc-theme` | localStorage | `SiteHeader.tsx` | `dark` / `light` |
| `gdn_llm_cfg_v3` | localStorage | `feynman/lib/storage.ts` | LLM 配置（apiKey/baseUrl/model/offlineMock） |
| `gdn_notes_v3` | localStorage | `feynman/lib/storage.ts` | 费曼笔记（离线缓存，相同问题复用） |
| `gdn_graph_v3` | localStorage | `feynman/lib/storage.ts` | 已内化概念（费曼图谱挂载） |

---

## Project Structure

```
src/
├── main.tsx                        # App 路由 + CognitionProvider 挂载 + 状态机流转编排
├── lib/
│   ├── cognition.tsx               # 认知状态机（Provider / useCognition / 存储模型）★ 主线
│   ├── markdown.ts                 # frontmatter 解析 + 文章正文渲染（编辑器/文章页共用）
│   └── utils.ts                    # cn() 等工具
├── pages/                          # 多页面路由组件
│   ├── LetterHome.tsx              # 产品文化 · 一封信
│   ├── RadarArchivePage.tsx        # 认知雷达归档/全集合（周时间轴）
│   ├── RadarPage.tsx               # 某周雷达切片（discovered → in-plan）
│   ├── PlanPage.tsx                # 深度计划看板（跨周累积）
│   ├── EditorPage.tsx              # 文章编辑器（learning → published）
│   ├── GraphPage.tsx               # 认知图谱（全局累积 + 第二大脑成长总览）
│   ├── ArticlePage.tsx             # 文章详情页
│   └── SiteHeader.tsx              # 全局导航条（5 Tab）
├── components/
│   ├── radar/                      # 认知雷达组件
│   │   ├── RadarCard.tsx
│   │   ├── RadarHero.tsx
│   │   ├── RadarToolbar.tsx
│   │   ├── MaturityPill.tsx
│   │   └── PlanToggle.tsx
│   └── ui/                         # shadcn/ui 基础组件
├── data/
│   └── radarData.ts                # 雷达技术数据
├── feynman/                        # 费曼四步学习引擎
│   ├── components/
│   │   ├── views/
│   │   │   ├── Step1View.tsx       # L1 直觉
│   │   │   ├── Step2View.tsx       # L2 场景
│   │   │   ├── Step3View.tsx       # L3 机制
│   │   │   ├── Step4View.tsx       # L4 本质
│   │   │   ├── PrincipleView.tsx   # 动态 SVG + fallback 动画
│   │   │   ├── MathView.tsx        # LaTeX 数学计算
│   │   │   └── animations/         # Fallback React 动画
│   │   ├── StepPipeline.tsx        # 四步编排器
│   │   ├── FeynmanPrime.tsx        # 预热卡片
│   │   ├── FeynmanDigestPanel.tsx  # 内化面板
│   │   ├── StreamingSection.tsx    # 共享骨架屏
│   │   └── ...
│   ├── data/
│   │   ├── algorithm-concepts.ts   # 30 个概念 + arXiv 链接
│   │   └── algorithm-concepts.md   # 知识库 Markdown
│   ├── lib/
│   │   ├── prompts.ts              # 全部 LLM 提示词 + JSON Schema
│   │   ├── llm.ts                  # DashScope API 客户端 + SSE 解析
│   │   ├── partialJson.ts          # 流式部分 JSON 提取器
│   │   ├── storage.ts              # localStorage 持久化
│   │   ├── svgRenderer.ts          # SVG 模板渲染
│   │   └── mdExport.ts             # Markdown 导出
│   ├── mocks/
│   │   ├── fixtures.ts             # 离线 Mock 数据加载器
│   │   └── data/                   # 预录制样本
│   ├── FeynmanApp.tsx              # 主应用 + 状态管理
│   └── types.ts                    # 完整数据契约
public/
└── content/                        # AI 概念文章库
    ├── articles.json               # 文章索引
    ├── radar/                      # ★ 认知雷达数据（由 ai-cognitive-radar skill 产出，工程动态加载）
    │   ├── index.json              #   周索引（新→旧）
    │   └── 2026-W24.json           #   每周认知点（RadarWeek）
    ├── flash-attention.md
    ├── csa-compressed-sparse-attention.md
    ├── mla-multi-head-latent-attention.md
    ├── rope-position-encoding.md
    ├── swarm-agent-framework.md
    ├── swarm-agent-framework.html
    └── aicc-article-swarm.html

design/
└── aicc-html-bundle/               # 设计稿源（HTML，归口为唯一来源，与 src/ 实现对照）
```

---

## Getting Started

### Prerequisites
- Node.js >= 18
- Alibaba Cloud DashScope API Key ([Get Key](https://help.aliyun.com/zh/dashscope/developer-reference/api-key-management))

### Installation

```bash
# Clone
git clone https://github.com/huangyong0574/AICC.git
cd AICC

# Install
npm install

# Run dev server（默认 Vite 端口 5173；本仓 .claude/launch.json 固定 5188）
npm run dev
# 或固定端口：npm run dev -- --port 5188 --strictPort

# Build for production
npm run build
npm run preview
```

### Configuration

1. Open `http://localhost:5188` in browser（或你的 dev server 实际端口）
2. Click **Settings** (gear icon) → enter your DashScope API Key
3. Toggle **Offline Mock** for offline development (uses pre-recorded fixtures)
4. Default model: `deepseek-v4-flash` (configurable)

---

## LLM Integration

### API Calls Matrix

| Endpoint | Function | Model | Streaming | Web Search | Thinking |
|----------|----------|-------|-----------|-----------|----------|
| Feynman Warm-up | `callFeynmanWarmup()` | deepseek-v4-flash | No | Yes | No |
| Step 1 | `callStep("step1")` | deepseek-v4-flash | Yes | Yes | Yes |
| Step 2 | `callStep("step2")` | deepseek-v4-flash | Yes | Yes | Yes |
| Step 3 | `callStep("step3")` | deepseek-v4-flash | Yes | No | Yes |
| Step 4 | `callStep("step4")` | deepseek-v4-flash | Yes | No | Yes |

### Prompt Engineering

All prompts are centralized in [`src/feynman/lib/prompts.ts`](src/feynman/lib/prompts.ts):
- **`SYSTEM_STEP1..4`**: 每步独立的系统提示词
- **`BUILD_STEP_PROMPT`**: 步骤专属 Schema + 引导
- **SVG generation spec**: 嵌入 Step 3 提示词，驱动动态机制图
- **JSON Schema enforcement**: 每步输出均通过严格 JSON Schema 校验

---

## Design Philosophy

### 多页面分层架构

AICC 采用「认知递进」的分层设计，对齐产品链路：

1. **产品文化**（Letter）— 价值观传递，看全局
2. **认知雷达**（Radar）— 归档全集合 → 选周切面 → 选 1 个认知点（discovered → in-plan）
3. **费曼引擎**（Feynman）— 单概念的深度穿透学习（in-plan → learning）
4. **成稿发布**（Editor）— 把理解写成文章（learning → published）
5. **认知图谱**（Graph）— 全局累积 + 成长总览，未来支持每周回顾

每个模块独立但相互关联，通过全局导航无缝切换。

### 费曼方法集成

- **预热**：3 道问题迫使用户在学习前预测答案（减少能力错觉）
- **Takeaway 卡片**：每步结束后用户通过模态交互「收集」关键洞察
- **渐进深度**：L1（任何人）→ L2（PM）→ L3（工程师）→ L4（专家）

---

## Roadmap

| Feature | Status | Priority |
|---------|--------|----------|
| 多页面架构 + 全局导航（5 Tab） | Done | P0 |
| **认知状态机**（discovered→in-plan→learning→published） | Done | P0 |
| 认知雷达两级 IA（归档全集合 → 周切片） | Done | P0 |
| 认知图谱全局累积 + 第二大脑成长总览（真实数据） | Done | P0 |
| 下线认知工作台（占位数字/假图谱，价值并入图谱） | Done | P0 |
| 认知雷达（成熟度 + 加入计划） | Done | P0 |
| 深度计划看板（跨周累积 + 状态筛选） | Done | P0 |
| 文章编辑器（Markdown 预览 + 发布回写状态） | Done | P0 |
| 认知图谱（按状态机着色） | Done | P0 |
| 费曼四步穿透学习引擎 | Done | P0 |
| 动态 SVG 机制图 + 30 算法概念知识库 | Done | P0 |
| 设计稿归档 design/（唯一来源） | Done | P0 |
| **雷达数据动态化**（skill 输出 JSON → 工程 `useLatestRadarWeek()` 加载） | Done | P0 |
| ECS 生产部署 | Done | P0 |
| 已发布文章并入文章库 + 图谱（统一来源） | Planned | P1 |
| 防腐机制系统化（24h 未成稿提醒 / 周度审计看板） | Planned | P1 |
| 多概念并发学习 · Error boundary · i18n | Planned | P2 |

---

## License

MIT (c) [LeoHuang](https://github.com/huangyong0574)

---

## Acknowledgments

- **Feynman Learning Technique**: Richard Feynman's philosophy that "if you can't explain it simply, you don't understand it well enough"
- **DashScope (Alibaba Cloud Bailian)**: LLM API provider
- **shadcn/ui**: Beautiful, accessible UI primitives
- **lucide-react**: Clean, consistent icon library

---

> "认知的终点不在于你记住了多少原理，而在于你获得了更好的选择，掌控了自己的生活。"
