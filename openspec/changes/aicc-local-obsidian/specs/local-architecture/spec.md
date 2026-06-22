## ADDED Requirements

### Requirement: 本地 Gateway 运行时
AICC SHALL 以本地 Gateway 进程运行：绑定 `127.0.0.1`、带单用户 bearer token，serve 前端 UI 并提供 API；不对公网暴露。

#### Scenario: 仅本机可达
- **WHEN** Gateway 启动
- **THEN** 仅监听 `127.0.0.1`（不监听 `0.0.0.0`），非本机请求不可达
- **AND** API 需单用户 token 才能访问

#### Scenario: 浏览器开 localhost
- **WHEN** 用户启动 AICC
- **THEN** 可在浏览器经 `http://localhost:<port>` 使用现有 UI

### Requirement: LLM key 在本地、不进浏览器
API key SHALL 仅存于本地（server `.env` / 系统钥匙串），由 Gateway 代理调用 DashScope（OpenAI 兼容）；浏览器侧永不持有或发送 key 到任何远程。

#### Scenario: 代理调用
- **WHEN** 前端发起 LLM 请求
- **THEN** 请求先到本地 Gateway，由 Gateway 用本地 key 调 DashScope，结果回传
- **AND** key 不出现在浏览器存储 / 网络请求中

### Requirement: Obsidian vault 作认知存储单一来源
已介入的概念（in-plan 及以后）与成稿 SHALL 持久化为用户 Obsidian vault 内的 atomic Markdown（frontmatter `status` + 三域 tag + `[[wikilink]]`）；localStorage 仅作运行时缓存，vault 为权威。

#### Scenario: 写入 vault
- **WHEN** 概念进入计划 / 费曼内化完成 / 成稿发布
- **THEN** Gateway 在 vault 写/更新对应 `.md`（frontmatter 含 status/source-week；body 含蒸馏；`[[]]` 含 relation / 融合链接）

#### Scenario: vault 为权威
- **WHEN** 用户在 Obsidian 直接编辑笔记（如加一条 `[[链接]]`）
- **THEN** AICC 重扫 vault 后以 vault 内容为准（localStorage 缓存可由 vault 重建）

#### Scenario: discovered 不建笔记
- **WHEN** 雷达 discovered 层概念尚未介入
- **THEN** 不为其建 vault 笔记（保留为 JSON 数据），避免淹没 vault

### Requirement: 认知图谱即 vault 链接
累积认知图谱 SHALL 由 vault 的笔记 + `[[wikilink]]` 派生，不维护独立图谱存储；Obsidian 原生图谱（color group 按 status 着色）即该图谱。

#### Scenario: 图谱来自链接
- **WHEN** 用户查看认知图谱（Obsidian 原生图，或 AICC 读 vault 的轻量视图）
- **THEN** 节点 = 概念/文章笔记、边 = wikilink；不存在第二份独立图谱数据

### Requirement: 雷达消费契约（采集解耦）
AICC SHALL 通过「vault `AICC-Input/` 下出现合法 `{weekId}.json`」这一契约消费雷达；采集器与 AICC 解耦、可替换。

#### Scenario: 启动检测新周
- **WHEN** 用户启动 AICC 且 vault `AICC-Input/` 有未消费的新周 `{weekId}.json`
- **THEN** AICC 将该周认知点拉进 discovered 层 / 流水线
- **AND** AICC 自身不负责触发采集（dogfood 阶段采集由本地 Cowork 定时任务产出）
