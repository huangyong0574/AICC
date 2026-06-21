## ADDED Requirements

### Requirement: 写作台富文本编辑
写作台 SHALL 提供 Markdown 富文本编辑（格式工具栏 + 实时预览），正文以 Markdown 存储（与文章页 / 发布同格式）。

#### Scenario: 工具栏格式化
- **WHEN** 用户点工具栏「加粗 / H2 / 引用 / 列表 / 链接」
- **THEN** 在正文光标处插入对应 Markdown 语法（有选中则包裹选中文字，无选中则插入占位）

#### Scenario: 实时预览
- **WHEN** 用户编辑正文
- **THEN** 预览区用 `lib/markdown.ts` 实时渲染为文章页样式

### Requirement: 写作台素材引用
写作台 SHALL 从当前选题对应的已闭环 `Note` 派生「原理 / 类比 / 本质」素材片段，供用户一键引用进正文，且不替用户成句。

#### Scenario: 展示可引用素材
- **WHEN** 用户进入某选题的写作台
- **THEN** 「我的素材」面板列出从该 `Note` 派生的素材行（原理 ← Step3 coreIdea、类比 ← Step1 类比/valueLead、本质 ← Step4 oneLiner）
- **AND** 某类字段缺失时跳过该行，不报错

#### Scenario: 引用素材进正文
- **WHEN** 用户点击某素材行的「引用」
- **THEN** 正文末尾插入该片段的引用块（blockquote），并标注「引自 · <来源>」
- **AND** 不自动改写或生成其它正文

### Requirement: 写作台 AI 陪练
写作台 SHALL 提供针对当前草稿的 AI 陪练（找反方观点 / 哪里缺论据 / 事实核查 / 读者之问），只评点不代笔。

#### Scenario: 触发陪练
- **WHEN** 用户点击任一陪练按钮且草稿正文非空
- **THEN** 系统以当前草稿为输入调用 LLM，返回对应角色的评点，内联展示在编辑器下方
- **AND** 评点内容不被自动写入正文

#### Scenario: 未配置 API key
- **WHEN** 用户触发陪练但未配置 `aicc-llm-cfg.apiKey`
- **THEN** 系统弹出设置对话框并提示配置，不静默失败

#### Scenario: 不代笔约束
- **WHEN** 任一陪练被触发
- **THEN** 提交给 LLM 的指令明确禁止代写成段正文，仅允许提问 / 指瑕 / 给论据方向

### Requirement: 写作台草稿持久化
写作台 SHALL 按选题 id 实时持久化草稿并支持恢复。

#### Scenario: 自动存草稿
- **WHEN** 用户编辑标题或正文
- **THEN** 标题/正文在防抖后写入 `localStorage["aicc-creation-draft:<topicId>"]`

#### Scenario: 重进恢复
- **WHEN** 用户重新进入同一选题的写作台且存在草稿
- **THEN** 系统提示「继续 / 重新开始」，选择继续则恢复上次标题/正文

### Requirement: 发布 · 闭环到知识图谱
写作台「发布并闭环」SHALL 将草稿落库为文章、把该文融合的认知点回写为 `published`、并在认知图谱上连接这些概念，与编辑器走同一发布路径。

#### Scenario: 发布成功回写状态机
- **WHEN** 用户点击「发布并闭环」且标题/正文非空
- **THEN** 文章（Markdown）写入 `aicc-article-md:<slug>` 与 `aicc-published-articles`（含 `conceptIds`）索引
- **AND** 该文融合的每个 `conceptId` 经 `cognition.upsert(id, { slug, title, state: "published" })` 标为「已成文」
- **AND** 该选题的 `aicc-creation-draft:<topicId>` 草稿被清除

#### Scenario: 闭环连边到知识图谱
- **WHEN** 一篇融合 ≥2 个概念的文章发布
- **THEN** 写入「文章连边」记录（`aicc-creation-edges`），`GraphPage` 在这些概念间渲染由该文产生的连接（标文章名）

#### Scenario: slug 冲突
- **WHEN** 生成的 slug 与既有已发布文章重复
- **THEN** 沿用编辑器的二次确认护栏，避免静默覆盖

### Requirement: 发布后再修改（覆盖式）
已发布文章 SHALL 可重进写作台编辑并覆盖重发（同 slug，不留版本历史）。

#### Scenario: 再编辑已发布文章
- **WHEN** 用户对一个 `published` 的选题再次进入写作台
- **THEN** 预填其已发布正文；编辑后「发布并闭环」覆盖更新同一 slug 文章，状态保持 `published`
