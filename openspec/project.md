# AICC · OpenSpec 项目约定（编码主流程）

> 新会话 / 新变更前，读本文 + 仓库根 `HANDOFF.md`。本文是 AICC 采用 OpenSpec 的最佳实践约定。

## 1. 事实来源分层（不重叠，防漂移）

| 层 | 文件 | 角色 |
|---|---|---|
| 产品总纲 / 叙事真相 | `SPEC.md` | 定位、认知状态机概览、设计系统、LLM prompt 全集、路线图。人读、给方向。 |
| 可测行为契约 | `openspec/specs/<capability>/spec.md` | Requirement + `WHEN/THEN` 场景，可逐条验收。机读、随变更增长。 |

**边界规则**：行为/契约怎么变 → 写进变更的 specs delta（`archive` 时 sync 进 `openspec/specs/`）；产品定位/架构叙事变 → 同步 `SPEC.md`（沿用工程纪律#1）。
**不一次性迁移 `SPEC.md`**——让 `openspec/specs/` 随你碰到的变更逐能力长出来。

## 2. 何时用 OpenSpec，何时走轻量纪律

- **走完整 OpenSpec（propose → apply → archive）**：新能力、改**认知状态机 / LLM 契约 / 存储 schema / 路由**、多文件特性、后端。
- **走轻量纪律（不开 change，直接做）**：纯视觉微调、文案、依赖升级、小范围 bugfix。
- 判据：会改变「系统该做什么」或有契约/数据风险 → OpenSpec；只改「长什么样」→ 轻量。

## 3. 生命周期 + 不可跳过的纪律 gate

```
explore  想清楚（不写码；模糊问题先聊）
  → propose  proposal.md(what/why+验收标准) · design.md(how) · specs delta · tasks.md
             ⮕ 先 commit "spec(x): propose …"（spec-first 落到 git）
  → apply    按 tasks 实现、勾 [x]
  → sync     delta specs → openspec/specs/<capability>
  → archive  移到 changes/archive/YYYY-MM-DD-<name>
  → (发布)   build -- --base=/aicc/ + bash scripts/deploy-dist.sh
```

**每个 change 的 `tasks.md` 末尾固定这组 gate（把工程纪律焊进任务，不靠人记）**：
- [ ] `tsc` / `build` 通过
- [ ] 浏览器验收 + 截图
- [ ] 动 LLM 契约 → 真 key 真机冒烟（历史反复踩的点）
- [ ] 动 UI → 刷新 `design/live` 基线（需 `DASHSCOPE_API_KEY`）
- [ ] 影响总纲 → 同步 `SPEC.md`
- [ ] commit/push（local == GitHub）
- [ ] push 后检查 `README.md` 是否需同步（产品 / 功能 / 页面 / 架构 / 契约有变 → 更新 README 再补提交）

## 4. 能力地图（按需长出，别一次建全）

`cognition-state-machine` · `feynman-engine` · `radar-ingestion` · `creation` · `editor-publish` · `graph` · `backend-persistence`

## 5. 变更命名

kebab-case、动词/名词短语起手：`creation-writing-desk`、`feynman-step2-premium`、`backend-sqlite-persistence`。
