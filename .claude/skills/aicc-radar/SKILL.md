---
name: aicc-radar
description: >-
  执行 AICC「AI 认知雷达」周报例程并与工程集成：采集本周 AI 动态 → 提炼 5-8 个深度认知点 →
  生成 Markdown 周报 + RadarWeek JSON → 经 ingest-radar 纳入工程 → commit/push → build + 部署 ECS。
  只要用户提到「跑/更新认知雷达」「本周 AI 周报」「雷达周报」「更新 AICC 雷达数据」「radar weekly」，
  或想把本周 AI 进展汇总成认知点并喂进 AICC 应用，就用这个 skill——即使没逐字说「skill」。
  本例程把外部感知（外循环）落成应用 discovered 层数据，让认知雷达/图谱/计划自动增长。
---

# AICC 认知雷达周报（aicc-radar）

把「本周 AI 世界发生了什么」沉淀成 AICC 应用里**可加入计划、可费曼穿透**的认知点。它是产品外循环的感知层——产出经工程消费，最终长进认知雷达 / 深度计划 / 认知图谱。

数据契约、命名映射、采集源清单都在 **[references/radar-week-schema.md](references/radar-week-schema.md)** —— 在「生成 JSON」前务必读它，那是这条链路与工程对齐的关键。源头定义见仓库 `SPEC.md` §3.6。

## 运行前提

- **在 AICC 仓库根目录运行**（需 `scripts/ingest-radar.mjs`、`public/content/radar/`、git remote、`scripts/deploy-dist.sh`）。
- **采集靠 Claude-in-Chrome MCP**（真浏览器，需 Chrome 扩展已连接）。扩展不可用时**降级**到 WebFetch/WebSearch，并明确告知用户「本次降级、YouTube 覆盖有限」——宁可降级产出，也不要整条挂掉。
- **部署凭据走环境变量** `AICC_ECS_PASS`（绝不把密码写进任何入库文件）。
- Obsidian 中转目录：`/Users/huangyong/Documents/Obsidian Vault/AICC项目/AICC-Input/`。
- **本 skill 闭环到「部署 ECS」，不含微信推送**（按用户选择）。

**贯穿原则**：git 是唯一事实来源。JSON 先落 Obsidian（与 MD 并列）→ `ingest-radar` 纳入仓库 → commit/push → build → 部署。skill 不直接往 ECS 或 git 的 `content/radar` 塞数据，全部经脚本，便于校验与回溯。

## 步骤

### 0 · 定位本周 + 防重
算出本周五日期与 weekId（见 references 的 `date` 换算命令）。读 `public/content/radar/index.json`：若该 `weekId` 已存在，**先问用户**是「覆盖更新」还是「换一周 / 退出」——避免无意覆盖已入库的一周。

### 1 · 采集（Chrome 浏览器自动化为主）
用 Claude-in-Chrome MCP（`navigate` / `get_page_text` / `find` / `read_page`；若为 deferred，先 `ToolSearch "mcp__Claude_in_Chrome"` 批量加载）。按 references 的源清单：
- 逐个 YouTube 频道翻本周新视频（频道 Videos 页或 RSS）；
- 逐个 AI 公司官网动态页；
- 用 WebSearch 补本周热门新闻 / arxiv 论文。

采集要**广**——这是后面提炼认知点的原料，覆盖不足提炼就空。**降级路径**：Chrome 扩展没连上时，改用 WebFetch 抓官网/RSS + WebSearch，并在最终报告里标注本次为降级采集。

### 2 · 提炼 5-8 个深度认知点
挑真正的**技术/产品认知点**（新架构、新能力、新范式），不是泛泛新闻。每个判定 `maturity`（frontier/mature/experimental），写透 `corePrinciple`（它是什么、怎么 work）与 `whyMatters`（行业意义）。受众是「长期 AI 认知进化者」，**质量 > 数量**——宁可 5 个讲透，不要 8 个注水。

### 3 · 生成 Markdown 周报
写给人读的周报（速览层 + 每个认知点详述），存：
`{Obsidian}/AICC项目/AICC-Input/AI认知雷达-{本周五日期}.md`

### 4 · 生成 RadarWeek JSON
**严格按 [references/radar-week-schema.md](references/radar-week-schema.md)** 填（id 规范 `{weekId}-{NN}-{slug}`、maturity 枚举、11 个字段齐全、`generatedAt` = 本周五日期），与 MD 同源。存：
`{Obsidian}/AICC项目/AICC-Input/{weekId}.json`

### 5 · ingest 进工程
```bash
node scripts/ingest-radar.mjs "/Users/huangyong/Documents/Obsidian Vault/AICC项目/AICC-Input/{weekId}.json"
```
看输出：是否校验通过、index 重建到几周。**校验失败就按报错修 JSON 重跑**（常见：id 不规范、缺字段、maturity 非法）——别跳过，脏数据进不了工程才是对的。

### 6 · git commit + push
```bash
git add public/content/radar && \
git commit -m "feat(radar): {weekId} 认知雷达入库（{N} 个认知点）" && \
git push origin main
```
推送后确认 `git log origin/main..HEAD` 为空（已同步）。网络抖动就重试。

### 7 · build + 部署 ECS
```bash
npm run build
AICC_ECS_PASS='…' bash scripts/deploy-dist.sh   # 或先 export AICC_ECS_PASS
```
`deploy-dist.sh` 做增量部署（assets/content 先、index.html 后；保留 `weekly/` + `demo/`；绝不 `rsync --delete`）。部署是对外动作，跑前向用户确认一次。

### 8 · 验收 + 报告
脚本会自检；再补一刀人工确认：
```bash
curl -s http://101.37.128.102/content/radar/index.json | grep {weekId}        # 线上 index 含新周
curl -s -o /dev/null -w '%{http_code}' http://101.37.128.102/content/radar/{weekId}.json   # 期望 200
```
向用户报告：新增哪周、几个认知点、线上是否生效，并附应用链接 `http://101.37.128.102/radar/{weekId}`。

## 不做 / 红线
- **不**做微信推送（用户选择不含）。
- **绝不** `rsync --delete` 或整目录覆盖 `dist`——会毁掉 `weekly/`（周报 HTML）和 `demo/`（独立子应用）。
- **绝不**把 `AICC_ECS_PASS` 或任何密码写进 skill、脚本、commit。
- 校验不过的 JSON **不**入库。

## 失败速查
| 症状 | 处理 |
|---|---|
| Chrome 扩展未连接 | 降级 WebFetch/WebSearch，报告里标注本次降级 |
| ingest 校验失败 | 按报错修 id/字段/maturity，重跑第 5 步 |
| git push「Connection reset」 | 重试（这台机器网络偶发抖动） |
| 部署 SSH「Permission denied」 | 多半是连太快被限流，稍等重试；确认 `AICC_ECS_PASS` 已设 |
| 线上 index 不含新周 | 检查 build 是否成功、scp 是否真传了 content/radar |
