## ADDED Requirements

### Requirement: 描述性页面标题
应用 SHALL 在每个路由设置描述性的 `document.title`，使浏览器标签 / 书签 / 历史可区分当前页面。

#### Scenario: 路由切换更新标题
- **WHEN** 用户从任意页导航到 `/plan`
- **THEN** `document.title` 为 `深度计划 · AICC`

#### Scenario: 首页保留品牌全称
- **WHEN** 用户位于 `/`（或 `/philosophy`）
- **THEN** `document.title` 为 `AICC · AI Cognition Connector`

#### Scenario: 深链直达也正确
- **WHEN** 用户直接打开 `/graph`
- **THEN** `document.title` 为 `认知图谱 · AICC`

#### Scenario: 带参数路由附带参数
- **WHEN** 用户打开某周雷达 `/radar/2026-W25`
- **THEN** `document.title` 含该周标识（如 `认知雷达 · 2026-W25 · AICC`）

#### Scenario: 文章页用真实标题
- **WHEN** 用户打开某篇文章
- **THEN** `document.title` 为该文章真实标题 + ` — AICC`（由 `ArticlePage` 提供；应用外壳对 article 不覆盖）
