# AICC — AI Concept Cognition

**献给 AI 认知进化追求者的一封信 · 用费曼学习法穿透理解 AI 算法概念**

[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com)

---

## What is AICC?

**AICC**（AI Concept Cognition）是一个**多页面 AI 认知进化平台**，围绕「输出你的理解，而非 AI 的理解」这一核心信念构建，包含四大模块：

| 模块 | 路由 | 定位 |
|------|------|------|
| **产品文化** (Letter) | `/` | 一封写给 AI 认知长期进化者的信，阐述症状、信念、自省与防腐行为设计 |
| **认知工作台** (Dashboard) | `/dashboard` | AI 概念文章管理与深度阅读入口 |
| **认知图谱** (Graph) | `/graph` | 学习过的 AI 概念关系可视化 |
| **认知雷达** (Radar) | `/radar` | AI 技术成熟度雷达，标记「研究前沿 / 成熟可用」，支持深度计划 |

核心学习引擎采用 **费曼四步穿透模型**：

```
Feynman Warm-up（3 角色提问）→ Step 1 直觉 → Step 2 场景 → Step 3 机制 → Step 4 本质
```

内置 **30 个热门 AI/LLM 算法概念**知识库 + **6 篇深度 AI 概念文章**。

---

## Multi-Page Architecture

```
main.tsx (App Router)
├── /              → LetterHome        # 产品文化 · 一封信
├── /dashboard     → Dashboard         # 认知工作台（文章列表 + 知识图谱）
├── /graph         → Dashboard#graph   # 认知图谱（Dashboard 锚点跳转）
├── /article/:slug → ArticlePage       # 文章详情页（HTML 渲染）
├── /radar         → RadarPage         # 认知雷达
└── /feynman       → FeynmanApp        # 费曼四步穿透学习引擎
```

### 导航系统

`SiteHeader` 全局导航条包含四个 Tab：**产品文化** / **认知工作台** / **认知图谱** / **认知雷达**，支持深色模式切换。

---

## Core Features

### 1. 产品文化 — 一封信（LetterHome）

以「献给和我一样的 AI 认知长期进化者」为主题的产品宣言，包含四个章节：

- **01 症状** — AI 认知断裂 / 单点 / 丢失三大痛点
- **02 信念** — 认知基石 / 第二大脑 / 警惕 AI 外包理解
- **03 自省** — 人性弱点的诚实面对
- **04 防腐** — 三条防腐行为约定（24h 后产出 MD / 评价题优于问答题 / 周度 LLM 审计）

### 2. 认知工作台（Dashboard）

- 文章列表：展示 6 篇 AI 概念深度文章，支持按分类筛选
- 知识图谱：已学习概念的可视化关联
- 学习统计：概念覆盖率与学习进度

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

### 4. 认知雷达（Radar）

- **技术成熟度评估**：每项技术标记为「研究前沿」(amber) 或「成熟可用」(green)
- **过滤与排序**：支持按成熟度、分类筛选
- **深度计划**：标记想深入研究的技术，跨 Tab 持久化存储（localStorage）
- **响应式设计**：桌面 / 平板 / 移动端自适应

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
| **Routing** | History API（手写轻量路由） |
| **State** | React Hooks（无外部状态管理） |
| **Storage** | localStorage（笔记、图谱、配置、雷达计划） |
| **LLM** | DashScope compatible-mode API（deepseek-v4-flash） |
| **Streaming** | SSE (Server-Sent Events) with AbortController |
| **Testing** | Playwright (E2E) |

---

## Project Structure

```
src/
├── pages/                          # 多页面路由组件
│   ├── LetterHome.tsx              # 产品文化 · 一封信
│   ├── Dashboard.tsx               # 认知工作台 + 知识图谱
│   ├── ArticlePage.tsx             # 文章详情页
│   ├── RadarPage.tsx               # 认知雷达
│   └── SiteHeader.tsx              # 全局导航条
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
    ├── flash-attention.md
    ├── csa-compressed-sparse-attention.md
    ├── mla-multi-head-latent-attention.md
    ├── rope-position-encoding.md
    ├── swarm-agent-framework.md
    ├── swarm-agent-framework.html
    └── aicc-article-swarm.html
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

# Run dev server (fixed port 5180)
npm run dev

# Build for production
npm run build
npm run preview
```

### Configuration

1. Open `http://localhost:5180` in browser
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

AICC 采用「认知递进」的分层设计：

1. **产品文化**（Letter）— 价值观传递，建立认知共识
2. **认知工作台**（Dashboard）— 文章阅读 + 知识图谱管理
3. **认知雷达**（Radar）— AI 技术全景扫描与深度计划
4. **费曼引擎**（Feynman）— 单概念的深度穿透学习

每个模块独立但相互关联，通过全局导航无缝切换。

### 费曼方法集成

- **预热**：3 道问题迫使用户在学习前预测答案（减少能力错觉）
- **Takeaway 卡片**：每步结束后用户通过模态交互「收集」关键洞察
- **渐进深度**：L1（任何人）→ L2（PM）→ L3（工程师）→ L4（专家）

---

## Roadmap

| Feature | Status | Priority |
|---------|--------|----------|
| 多页面架构 + 全局导航 | Done | P0 |
| 产品文化页（一封信） | Done | P0 |
| 认知工作台 + 文章管理 | Done | P0 |
| 认知雷达（成熟度 + 深度计划） | Done | P0 |
| 6 篇 AI 概念深度文章 | Done | P0 |
| 动态 SVG 机制图 | Done | P0 |
| 30 算法概念知识库 | Done | P0 |
| 费曼四步穿透学习引擎 | Done | P0 |
| ECS 生产部署 | Done | P0 |
| 多概念并发学习 | Planned | P1 |
| Error boundary + retry | Planned | P1 |
| HTTPS + custom domain | Planned | P1 |
| Multi-language (i18n) | Planned | P2 |

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
