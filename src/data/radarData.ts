/**
 * AI 认知雷达 - 数据层
 *
 * 数据来源（唯一事实来源）：`public/content/radar/`
 *   - index.json        —— 周列表（新→旧），由 ai-cognitive-radar skill 维护
 *   - <weekId>.json     —— 每周的 RadarWeek 数据
 * 运行时由 useLatestRadarWeek() 动态加载最新一周；下方 radarWeekData 仅作离线/加载失败兜底。
 *
 * 概念 id 规范：`<weekId>-<NN>-<slug>`（如 2026-W24-01-mot-world-model），
 * 使周/序号成为内生元数据，供计划页编号、跨周分组、状态机复用。
 */
import { useEffect, useState } from 'react'

export type Maturity = 'frontier' | 'mature' | 'experimental'

export interface RadarInsight {
  /** 全局唯一 ID，用于深入计划 localStorage 存储 */
  id: string
  /** 卡片编号（显示在 Rail 上） */
  index: number
  /** 英文 eyebrow（卡片顶部小字） */
  eyebrow: string
  /** 中文标题（卡片主标题） */
  title: string
  /** 一句话概括（带左边框引用样式） */
  tagline: string
  /** 成熟度 */
  maturity: Maturity
  /** 核心原理正文 */
  corePrinciple: string
  /** 为什么重要正文 */
  whyMatters: string
  /** 来源机构（如 Anthropic / OpenAI 等） */
  org: string
  /** 日期或日期范围 */
  dateRange: string
  /** 原文链接 */
  sourceUrl: string
}

/** 视频精选（速览层） */
export interface RadarVideo {
  rank?: number
  title: string
  channel: string
  note?: string
  views?: string
  url: string
}

/** 公司技术动态（速览层，表格行） */
export interface RadarCompany {
  org: string
  title: string
  type?: string
  concept?: string
  summary: string
  url: string
}

/** 热门新闻（速览层） */
export interface RadarNews {
  source: string
  title: string
  summary?: string
  url: string
}

export interface RadarWeek {
  /** 周编号（用于 Hero kicker），ISO 周号如 2026-W24 */
  weekId: string
  /** 日期范围（副标题） */
  dateRange: string
  /** 生成日期（= 本周五日期 = weekly HTML 文件名），由 skill 写入 */
  generatedAt?: string
  /** Hero 描述文案（可选） */
  heroCopy?: string
  /** 5-8 条认知点（深度层） */
  insights: RadarInsight[]
  /** 速览层（均可选；外部 HTML/skill 提供，旧数据无则不渲染对应区块） */
  videos?: RadarVideo[]
  companies?: RadarCompany[]
  news?: RadarNews[]
}

export const radarWeekData: RadarWeek = {
  weekId: '2026-W22',
  dateRange: '2026-05-26 → 2026-06-01',
  insights: [
    {
      id: 'dynamic-workflows',
      index: 1,
      eyebrow: 'Dynamic Workflows',
      title: '动态工作流',
      tagline:
        'Claude Opus 4.8 引入的机制，允许 AI 模型在处理多步骤复杂任务时自主调整执行策略，而非遵循预设的固定流程。',
      maturity: 'frontier',
      corePrinciple:
        '传统 AI 工作流是「接到指令 → 按固定路径执行 → 输出结果」。Dynamic Workflows 让模型在执行过程中根据中间结果和上下文状态，自主决定是否拆分任务、回溯修正、切换工具或改变推理深度。这本质上是将「元认知」能力注入到 Agent 执行层——模型不仅在执行任务，还在持续评估「我当前的执行策略是否最优」并动态调整。配合 Effort Control（三档努力控制：low/medium/high），用户可以粗粒度地控制模型在每次决策上投入的计算资源。',
      whyMatters:
        '这标志着 AI Agent 从「脚本化执行」走向「自适应执行」。对于复杂编程、研究分析等需要多步决策的场景，意味着 Agent 的可靠性和自主性大幅提升。这是 Agentic AI 架构演进的关键一步。',
      org: 'Anthropic',
      dateRange: '2026-05-28',
      sourceUrl: 'https://www.anthropic.com/news/claude-opus-4-8',
    },
    {
      id: 'desktop-computer-use',
      index: 2,
      eyebrow: 'Desktop Computer Use',
      title: '桌面计算机使用',
      tagline:
        'AI 模型直接观察屏幕内容并控制鼠标、键盘来操作桌面应用程序的能力，是 AI 从「文本对话」走向「物理世界交互」的关键技术。',
      maturity: 'frontier',
      corePrinciple:
        'Computer Use 的核心是将屏幕截图转化为视觉理解（通过多模态模型），再根据任务目标生成鼠标点击坐标、键盘输入序列等低级操作指令。OpenAI Codex 的实现采用了「观察-推理-行动」循环：模型截屏当前窗口 → 理解 UI 元素和当前状态 → 规划下一步操作 → 执行 → 再观察。此前仅支持 macOS，本周正式扩展到 Windows 平台。Anthropic 的 Claude 也在同一方向推进，形成了 Computer Use 领域的双寡头竞争格局。',
      whyMatters:
        '这是 AI Agent 从「只能调 API」进化到「能像人一样操作任何软件」的关键跨越。一旦成熟，意味着所有没有 API 的遗留软件都可以被 AI 操控，极大扩展了自动化的边界。从 macOS 扩展到 Windows 则覆盖了全球绝大多数企业桌面环境。',
      org: 'OpenAI',
      dateRange: '2026-05-29',
      sourceUrl: 'https://developers.openai.com/codex/changelog',
    },
    {
      id: 'persistent-ai-agent',
      index: 3,
      eyebrow: 'Persistent AI Agent',
      title: '持久化 AI 代理',
      tagline:
        'Google Gemini Spark 所代表的 7×24 小时持续运行的个人 AI 代理，能主动管理任务、监控信息并代替用户执行操作。',
      maturity: 'frontier',
      corePrinciple:
        '与传统「用户提问 → AI 回答」的被动交互模式不同，Persistent Agent 具有三个核心能力层：（1）持续感知层——不断监控邮件、日历、新闻等数据源的变化；（2）自主决策层——根据预设偏好和上下文判断何时需要主动干预；（3）持久记忆层——维护跨会话的用户状态和任务上下文。Gemini Spark 以 Google Ultra 订阅用户为入口，深度整合 Gmail、Calendar、Search 等生态，实现从「工具」到「代理」的范式转变。',
      whyMatters:
        '这代表了消费级 AI 产品的下一个形态——AI 不再是「你问我答」的聊天机器人，而是一个始终在线、理解你、替你行动的数字助手。如果成功落地，将深刻改变个人生产力工具的市场格局。',
      org: 'Google',
      dateRange: '2026-05-29',
      sourceUrl: 'https://mashable.com/article/google-io-2026-gemini-spark-announced',
    },
    {
      id: 'ternary-llm',
      index: 4,
      eyebrow: '1.58-bit Ternary LLM',
      title: '三值大语言模型',
      tagline:
        '将模型权重压缩到仅用 {-1, 0, 1} 三个值表示的极端量化技术，面壁智能首次证明可在非 NVIDIA 硬件（华为昇腾）上端到端训练。',
      maturity: 'mature',
      corePrinciple:
        '传统 LLM 使用 FP16/BF16（16 位浮点数）表示权重。1.58-bit 量化将每个权重限制为三值（ternary），使得矩阵乘法可以简化为加法和比较操作（无需乘法器），大幅降低计算和内存需求。技术挑战在于训练稳定性——极端量化导致梯度信息损失严重。面壁智能通过直通估计器（Straight-Through Estimator）和渐进式量化训练策略解决了这一问题。更具战略意义的是，整个训练流程在华为昇腾（Ascend）芯片上完成，首次在工业规模上验证了非 NVIDIA 训练管线的可行性。',
      whyMatters:
        '双重突破——技术上证明了极端量化在大规模模型上的可行性；地缘政治上证明了中国 AI 产业可以在 NVIDIA 芯片受限的情况下，通过算法创新在国产硬件上训练顶级模型。这对全球 AI 算力格局有深远影响。',
      org: '面壁智能 / ModelBest',
      dateRange: '2026-05-25 ~ 29',
      sourceUrl: 'https://www.qbitai.com/2026/05/426542.html',
    },
    {
      id: 'frontier-governance',
      index: 5,
      eyebrow: 'Frontier AI Governance Framework',
      title: '前沿 AI 治理框架',
      tagline:
        'OpenAI 发布的首个公开框架，将内部安全准备流程（Preparedness Framework）映射到 EU AI Act 和加州 AI 法案的具体法律义务。',
      maturity: 'mature',
      corePrinciple:
        '该框架定义了四个风险域（模型能力风险、部署风险、系统风险、社会风险），并为每个风险域设定了与现行法律对齐的治理流程。核心机制是「风险阈值触发」——当模型在某项能力评估中超过预设阈值时，自动触发更高级别的安全审查和治理流程。框架将 OpenAI 内部的 Preparedness 等级（Low/Medium/High/Critical）映射到 EU AI Act 的风险分类和加州《前沿 AI 透明法案》的报告义务，形成了一套可操作的合规路径。',
      whyMatters:
        '这是 AI 公司首次主动发布结构化的治理框架，而非被动等待法规执行。它为行业设定了一个「自律 + 合规」的模板，可能成为其他公司效仿的标准。在加州 30+ 项 AI 法案即将通过的时间节点上，这个框架的发布时机也颇有战略意义。',
      org: 'OpenAI',
      dateRange: '2026-05-29',
      sourceUrl: 'https://openai.com/index/openai-frontier-governance-framework/',
    },
    {
      id: 'claude-mythos',
      index: 6,
      eyebrow: 'Claude Mythos',
      title: '超高能力前沿模型',
      tagline:
        'Anthropic 当前最强的 AI 模型，此前仅限部分用户访问，现宣布将在未来数周内向所有客户开放。',
      maturity: 'frontier',
      corePrinciple:
        'Mythos 被定位为超越 Opus 系列的「前沿级」模型（frontier model），其具体技术架构未公开披露，但从 Anthropic 的发布策略可以看出几个关键设计选择：（1）采用分阶段发布策略（先限定用户 → 收集安全数据 → 全面开放），这是 Anthropic 一贯的「负责任发布」方法论；（2）配合更强的安全护栏（safeguards），暗示模型能力已强大到需要额外安全约束的程度；（3）与 650 亿美元融资同步宣布，传递「我们有资源持续训练更强模型」的信号。',
      whyMatters:
        'Mythos 的全面开放将使 Anthropic 在模型能力上直接挑战 GPT-5.5 系列的地位。分阶段发布策略本身也是一个值得学习的产品方法论——如何在「尽快推出」和「安全推出」之间找到平衡。',
      org: 'Anthropic',
      dateRange: '2026-05-28',
      sourceUrl: 'https://www.reuters.com/business/anthropic-roll-out-claude-mythos-coming-weeks-launches-opus-48-2026-05-28/',
    },
    {
      id: 'distributed-rl',
      index: 7,
      eyebrow: 'Distributed RL Training',
      title: '分布式强化学习训练',
      tagline:
        'Cursor 在 Sequoia 访谈中披露的 Composer 功能训练方法——利用 Fireworks 的分布式基础设施进行大规模强化学习训练。',
      maturity: 'mature',
      corePrinciple:
        'AI 编程工具的「智能」来自于在大量代码生成任务上进行强化学习（RL）优化。传统 RL 训练需要集中式 GPU 集群，成本高且调度复杂。Cursor 与 Fireworks 合作构建了一套分布式 RL 训练管线：（1）将 RL 环境（代码编辑、编译、测试反馈循环）容器化并分布到多个计算节点；（2）Fireworks 提供弹性算力调度，根据训练负载动态扩缩；（3）采用异步策略梯度方法，允许各节点独立采样和计算，定期同步更新策略参数。这种架构使 Cursor 能以较低成本完成大规模 RL 训练，直接提升 Composer 在实际编程任务中的表现。',
      whyMatters:
        '这揭示了 AI 编程工具背后的「军备竞赛」已进入基础设施层面。不再是比谁的模型更大，而是比谁能更高效地利用分布式算力进行 RL 训练。对于 AI 应用公司来说，这提供了一个参考架构——不必自建 GPU 集群，通过云原生 RL 训练平台也能训练出高性能的专用 Agent。',
      org: 'Cursor / Fireworks / Sequoia',
      dateRange: '2026-05-28',
      sourceUrl: 'https://www.youtube.com/watch?v=UDTr9yUnLUI',
    },
  ],
}

/* ──────────────────────────────────────────────────────────────
 * 动态加载层：从 public/content/radar/ 读取 skill 产出的真实周报数据
 * ────────────────────────────────────────────────────────────── */

// base 感知：dev/根部署 = '/content/radar'；以 `vite build --base=/aicc/` 构建时 = '/aicc/content/radar'。
// 让数据 fetch 路径跟随应用部署的子路径，避免 /aicc/ 下数据 404。
const RADAR_BASE = `${import.meta.env.BASE_URL}content/radar`

export interface RadarIndexEntry {
  weekId: string
  dateRange: string
  /** 相对 RADAR_BASE 的文件名，如 2026-W24.json */
  file: string
  generatedAt?: string
}

// 本地 Gateway 雷达源是否可用（Phase 4：消费 vault AICC-Input ∪ 打包历史周）。
// null=未探测；由 loadRadarIndex 设定，loadRadarWeek 据此选择源。无 Gateway（ECS/纯静态）回退 RADAR_BASE。
let _radarGateway: boolean | null = null

/** 读取周索引（新→旧）；优先本地 Gateway（vault），失败回退静态；再失败返回空数组 */
export async function loadRadarIndex(): Promise<RadarIndexEntry[]> {
  try {
    const r = await fetch("/api/radar/index")
    if (r.ok) {
      const data = await r.json()
      if (Array.isArray(data?.weeks)) { _radarGateway = true; return data.weeks as RadarIndexEntry[] }
    }
  } catch { /* 无 Gateway，回退静态 */ }
  _radarGateway = false
  try {
    const r = await fetch(`${RADAR_BASE}/index.json`)
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const data = await r.json()
    return Array.isArray(data?.weeks) ? (data.weeks as RadarIndexEntry[]) : []
  } catch {
    return []
  }
}

/** 读取某一周数据；与索引同源（Gateway/静态）；失败返回 null */
export async function loadRadarWeek(file: string): Promise<RadarWeek | null> {
  if (_radarGateway) {
    try {
      const id = file.replace(/\.json$/, "")
      const r = await fetch(`/api/radar/week?id=${encodeURIComponent(id)}`)
      if (r.ok) {
        const data = (await r.json()) as RadarWeek
        return data?.insights?.length ? data : null
      }
    } catch { /* 回退静态 */ }
  }
  try {
    const r = await fetch(`${RADAR_BASE}/${file}`)
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const data = (await r.json()) as RadarWeek
    return data?.insights?.length ? data : null
  } catch {
    return null
  }
}

/** 读取最新一周（index[0]）；任何环节失败回退到内置 seed radarWeekData */
export async function loadLatestRadarWeek(): Promise<RadarWeek> {
  const idx = await loadRadarIndex()
  if (idx.length) {
    const week = await loadRadarWeek(idx[0].file)
    if (week) return week
  }
  return radarWeekData
}

/**
 * React Hook：先以 seed 渲染（无加载闪烁），异步换成最新真实周。
 * RadarPage 切片用（GraphPage 用 useRadarArchive 累积）。
 */
export function useLatestRadarWeek(): { week: RadarWeek; loading: boolean } {
  const [week, setWeek] = useState<RadarWeek>(radarWeekData)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    loadLatestRadarWeek().then(w => {
      if (alive) {
        setWeek(w)
        setLoading(false)
      }
    })
    return () => {
      alive = false
    }
  }, [])
  return { week, loading }
}

/** 归档页用：一周数据 + 其索引元信息 */
export interface RadarArchiveWeek extends RadarWeek {
  file: string
  generatedAt?: string
}

/**
 * React Hook：加载全部周（index + 各周 JSON），供归档页（RadarArchivePage）按时间轴列出。
 * 顺序沿用 index.json（新→旧）。
 */
export function useRadarArchive(): { weeks: RadarArchiveWeek[]; loading: boolean } {
  const [weeks, setWeeks] = useState<RadarArchiveWeek[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    ;(async () => {
      const idx = await loadRadarIndex()
      const full = await Promise.all(
        idx.map(async (e) => {
          const w = await loadRadarWeek(e.file)
          return w ? ({ ...w, file: e.file, generatedAt: e.generatedAt } as RadarArchiveWeek) : null
        }),
      )
      const list = full.filter(Boolean) as RadarArchiveWeek[]
      // 索引为空（如 fetch 失败）时回退到内置 seed，至少展示一期
      if (alive) {
        setWeeks(list.length ? list : [{ ...radarWeekData, file: '', generatedAt: undefined }])
        setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])
  return { weeks, loading }
}

/**
 * React Hook：按 weekId 加载某一周切片（RadarPage 用）。
 * 缺省 weekId（或查不到）时回退到最新周；最终回退到内置 seed。
 */
export function useRadarWeekById(weekId?: string): { week: RadarWeek; loading: boolean } {
  const [week, setWeek] = useState<RadarWeek>(radarWeekData)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!weekId) {
        const w = await loadLatestRadarWeek()
        if (alive) { setWeek(w); setLoading(false) }
        return
      }
      const idx = await loadRadarIndex()
      const entry = idx.find((e) => e.weekId === weekId)
      const w = entry ? await loadRadarWeek(entry.file) : null
      if (alive) { setWeek(w || (await loadLatestRadarWeek())); setLoading(false) }
    })()
    return () => {
      alive = false
    }
  }, [weekId])
  return { week, loading }
}
