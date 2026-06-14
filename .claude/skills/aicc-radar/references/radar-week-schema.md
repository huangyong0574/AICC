# RadarWeek 数据契约 + 命名映射（喂 AICC 工程）

> 这是 `ai-cognitive-radar` 周报例程的 ③ 号产物——「结构化 JSON 喂工程」的精确规格。
> 与 MD/HTML 同源同内容，只是结构化。源头定义见仓库 `SPEC.md` §3.6，本文件是运行时填充用的速查。

## 1. 命名映射（务必算对，三者一一对应）

| 标识 | 含义 | 例 |
|---|---|---|
| `{本周五日期}` | 本周周五的日期，用作 MD / weekly HTML 文件名、以及 `generatedAt` | `2026-06-12` |
| `{weekId}` | ISO 周号，用作 JSON 文件名 + insight id 前缀 | `2026-W24` |

**换算命令**（macOS，避免手算错 ISO 周）：
```bash
date -j -f "%Y-%m-%d" "2026-06-12" "+%G-W%V"   # → 2026-W24
```
- `dateRange`：本周一到周五（或采集覆盖的日期范围），如 `2026-06-08 ~ 2026-06-12`。
- `generatedAt` **必须**等于本周五日期（= weekly HTML 文件名），这样 `weekly/2026-06-12.html` 与 `2026-W24.json` 能对上。

## 2. 落地路径（Obsidian 中转，skill 不碰 git/ECS 的 content/radar）

```
{Obsidian}/AICC项目/AICC-Input/AI认知雷达-{本周五日期}.md   # ① Markdown 周报
{Obsidian}/AICC项目/AICC-Input/{weekId}.json               # ③ 结构化 JSON（本契约）
```
其中 `{Obsidian}` = `/Users/huangyong/Documents/Obsidian Vault`。
随后由 `scripts/ingest-radar.mjs` 把 `{weekId}.json` 纳入仓库 `public/content/radar/`。

## 3. RadarWeek JSON 结构

```jsonc
{
  "weekId": "2026-W24",                      // ISO 周号 YYYY-Www
  "dateRange": "2026-06-08 ~ 2026-06-12",
  "generatedAt": "2026-06-12",               // = 本周五日期 = weekly HTML 文件名
  "insights": [                              // 5-8 个深度认知点
    {
      "id": "2026-W24-01-mot-world-model",   // {weekId}-{NN}-{slug}，见下
      "index": 1,                            // 数字，从 1 起，与 NN 对应
      "eyebrow": "Mixture-of-Transformers World Model",  // 英文小标题
      "title": "MoT 世界基础模型",            // 中文标题
      "tagline": "一句话概括（带场景/价值钩子，约 40-80 字）",
      "maturity": "frontier",                // 只能是 frontier | mature | experimental
      "corePrinciple": "核心原理正文：讲清它是什么、怎么work（150-300 字）",
      "whyMatters": "为什么重要正文：行业意义/影响（80-160 字）",
      "org": "NVIDIA",                       // 来源机构
      "dateRange": "2026-06-02",             // 该条来源的日期或范围
      "sourceUrl": "https://..."             // 原文链接（arxiv 或公司官网，权威优先）
    }
    // … 其余认知点
  ]
}
```

### id 规范：`{weekId}-{NN}-{slug}`
- `{weekId}`：如 `2026-W24`
- `{NN}`：两位序号，`01` `02` …（与 `index` 一致）
- `{slug}`：英文小写 + 连字符，从 eyebrow/title 提炼（如 `mot-world-model`、`extended-test-time-compute`）
- 正则：`^{weekId}-\d{2}-[a-z0-9-]+$`，例 `2026-W24-02-extended-test-time-compute`
- 这是状态机 / 跨周分组 / 图谱去重的主键，**务必规范**，否则 `ingest-radar` 会拒绝。

### maturity 取值（三选一）
- `frontier` 🟡 前沿（刚发布、还在演进）
- `mature` 🟢 成熟（已工程化、可落地）
- `experimental` 🔴 实验（概念验证、不确定性高）

## 4. 采集源清单（默认，按需增删）

**AI 公司官方动态**（Chrome 浏览器自动化逐个访问；或 WebFetch 兜底）：
- Anthropic — https://www.anthropic.com/news
- OpenAI — https://openai.com/news/ ＋ https://developers.openai.com/codex/changelog
- Google DeepMind — https://deepmind.google/discover/blog/ ＋ https://blog.google/technology/ai/
- Qwen（阿里）— https://qwenlm.github.io/blog/
- DeepSeek — https://api-docs.deepseek.com/news/

**YouTube 频道**（本周新视频；Chrome 访问频道「Videos」页取本周上传，或频道 RSS `https://www.youtube.com/feeds/videos.xml?channel_id=…`）：
> ⚠️ 以下为常见 AI 频道占位，请替换为你实际订阅的 9 个：
- Two Minute Papers / Yannic Kilcher / AI Explained / bycloud / Matthew Berman / Lex Fridman / Sentdex / 李沐 / 量子位 …

**热门新闻 / 论文**（WebSearch）：
- `本周 AI 重大进展 {年}-{月}`、`arxiv trending LLM agent {年}-{月}`、`AI model release this week` 等。

## 5. ingest-radar 校验要点（产出后会被校验，提前自检）
运行 `node scripts/ingest-radar.mjs "<…/AICC-Input/{weekId}.json>"`，以下任一不满足会被拒绝并跳过：
- `weekId` 形如 `YYYY-Www`；有 `dateRange`、`generatedAt`
- `insights` 非空数组；每条都齐 11 个字段（id/index/eyebrow/title/tagline/maturity/corePrinciple/whyMatters/org/dateRange/sourceUrl）
- 每条 `id` 匹配 `^{weekId}-\d{2}-[a-z0-9-]+$`
- 每条 `maturity` ∈ {frontier, mature, experimental}
