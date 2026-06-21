# creation

## Purpose

创作能力——把用户已闭环的认知转化为成稿：选题约稿 → 写作台 → 发布并闭环回写认知状态机。本能力随相关变更逐步补全；当前含「选题约稿（面向 AI Native 转型客户的融合选题）」，写作台素材/陪练/发布见 `creation-writing-desk`。

## Requirements

### Requirement: 选题面向 AI Native 转型客户、融合多知识点与趋势
选题约稿 SHALL 由 LLM 基于用户**已闭环知识点集合 + 行业趋势**生成**融合 / 对比型**选题，且**每条对准「AI Native 组织转型客户」的决策关切**，而非单知识点套话模板。

#### Scenario: 跨周融合生成
- **WHEN** 用户已闭环知识点 ≥ 2 且已配置 LLM
- **THEN** 系统以**用户全部历史已闭环知识点（不限最近一周）**为素材池
- **AND** 生成的每个选题至少融合 / 对比 2 个已闭环知识点（可跨不同周学到的概念），或 1 个知识点 × 1 条行业趋势
- **AND** 选题的 `conceptIds` 全部落在用户已闭环集合内（不含编造的知识点）

#### Scenario: 对准转型客户
- **WHEN** 生成选题
- **THEN** 每条选题的角度与立意对准「AI Native 组织转型客户」的决策关切（战略 / 组织 / 能力 / 落地 / 治理），而非纯学术科普

#### Scenario: 角度与客户共鸣度
- **WHEN** 展示一个选题
- **THEN** 该选题带角度标签（战略抉择 / 组织变革 / 能力跃迁 / 落地治理 / 趋势预判之一）与客户共鸣度（1–5）

#### Scenario: 行业钩子与可调用笔记
- **WHEN** 展示一个选题
- **THEN** 该选题带「为什么现在」的行业钩子，并列出可调用的已闭环知识点 chips

### Requirement: 换一批选题
选题约稿 SHALL 提供「换一批」重新生成一组选题。

#### Scenario: 重新生成
- **WHEN** 用户点击「换一批」
- **THEN** 系统重新调用 LLM 生成一组新选题并刷新列表

### Requirement: 选题门槛（宁缺毋滥）
选题约稿 SHALL 在底料不足时锁定，避免无依据约稿。

#### Scenario: 闭环不足锁定
- **WHEN** 用户已闭环知识点少于门槛（当前 2）
- **THEN** 相关选题锁定并提示「再闭环 N 个相邻知识点解锁」

#### Scenario: 未配置 API key
- **WHEN** 用户进入选题约稿但未配置 `aicc-llm-cfg.apiKey`
- **THEN** 系统弹设置对话框提示配置，不静默失败

### Requirement: 写作台富文本编辑
写作台 SHALL 提供 Markdown 富文本编辑（格式工具栏 + 实时预览），正文以 Markdown 存储（与文章页 / 发布同格式）。

#### Scenario: 工具栏格式化
- **WHEN** 用户点工具栏「加粗 / H2 / 引用 / 列表 / 链接」
- **THEN** 在正文光标处插入对应 Markdown 语法（有选中则包裹，无选中则插入占位）

#### Scenario: 实时预览
- **WHEN** 用户编辑正文
- **THEN** 预览区用 `lib/markdown.ts` 实时渲染为文章页样式

### Requirement: 写作台素材引用
写作台 SHALL 从当前选题融合的已闭环 `Note` 派生「原理 / 类比 / 本质」素材，供一键引用进正文，不替用户成句。

#### Scenario: 展示与引用
- **WHEN** 用户进入写作台
- **THEN** 「我的素材」面板列出该选题各 `conceptId` 对应笔记派生的素材；缺字段则跳过
- **AND** 点「引用」在光标处插入 Markdown 引用块（`> …` + 「引自 · 来源」），不改写其它正文

### Requirement: 写作台 AI 陪练
写作台 SHALL 提供针对当前草稿的 AI 陪练（找反方 / 缺论据 / 事实核查 / 读者之问），只评点不代笔。

#### Scenario: 触发陪练
- **WHEN** 用户点陪练按钮且草稿非空
- **THEN** 以当前草稿调 `callSparring` 返回点评，内联展示、不写进正文

#### Scenario: 不代笔约束
- **WHEN** 任一陪练触发
- **THEN** 提交给 LLM 的指令明确禁止代写成段正文，仅提问 / 指瑕 / 给方向

#### Scenario: 未配置 API key
- **WHEN** 草稿陪练但未配置 `aicc-llm-cfg.apiKey`
- **THEN** 提示去设置，不静默失败

### Requirement: 写作台草稿持久化
写作台 SHALL 按选题 id 实时持久化草稿并支持恢复。

#### Scenario: 自动存与恢复
- **WHEN** 用户编辑标题/正文
- **THEN** 防抖写入 `aicc-creation-draft:<topicId>`；重进有草稿时提示「继续 / 重新开始」，继续则恢复

### Requirement: 发布 · 闭环到知识图谱
写作台「发布并闭环」SHALL 将草稿落库为文章、把该文融合的每个认知点回写为 `published`、并在认知图谱上连接这些概念，与编辑器走同一发布路径（`lib/publishArticle.ts`）。

#### Scenario: 发布回写状态机
- **WHEN** 用户点「发布并闭环」且标题/正文非空
- **THEN** 文章（Markdown）写入 `aicc-article-md:<slug>` 与 `aicc-published-articles`（含 `conceptIds`）
- **AND** 该文每个 `conceptId` 经 `cognition.upsert` 标 `published`；草稿被清除

#### Scenario: 闭环连边到图谱
- **WHEN** 一篇融合 ≥2 概念的文章发布
- **THEN** 写入 `aicc-creation-edges`，`GraphPage` 在这些概念间渲染「成文连接」（标文章名）

#### Scenario: slug 冲突
- **WHEN** 生成 slug 与既有已发布文章重复
- **THEN** 沿用二次确认护栏，避免静默覆盖

### Requirement: 发布后再修改（覆盖式）
已发布文章 SHALL 可重进写作台编辑并覆盖重发（同 slug，不留版本历史）。

#### Scenario: 再编辑已发布文章
- **WHEN** 用户对一个 `published` 的选题再次进入写作台
- **THEN** 预填其已发布正文；编辑后「发布并闭环」覆盖更新同一 slug 文章，状态保持 `published`
