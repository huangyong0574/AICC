# Tasks · creation-writing-desk

## 1. 富文本编辑（Markdown + 工具栏 + 预览）
- [x] `DeskView` 正文区加格式工具栏（加粗 `**` / H2 `##` / 引用 `>` / 列表 `-` / 链接）：选中则包裹、未选则插入占位（操作 textarea selectionStart/End）
- [x] 加实时预览（复用 `lib/markdown.ts` 渲染），编辑 ↔ 预览（切换或并排）
- [x] 正文以 Markdown 存（草稿 + 发布同格式）

## 2. 素材引用
- [x] 写 `extractMaterials(note): { kind:'原理'|'类比'|'本质'; text; source }[]`（含旧 `Note.qa?` 兜底）
- [x] 「我的素材」面板渲染派生素材行 + 「引用」按钮；缺字段行不渲染
- [x] 「引用」在光标处插入 Markdown blockquote（`> …` + 「引自 · 来源」）

## 3. AI 陪练
- [x] `feynman/lib/llm.ts` 加 `callSparring(mode, draft, cfg)`（非流式）；system prompt 强约束「只评点、禁止代写成段正文」
- [x] `DeskView` 加 4 个陪练按钮（找反方 / 缺论据 / 事实核查 / 读者之问）；评点内联展示、不写进正文
- [x] `!cfg.apiKey` 时复用前置校验弹设置

## 4. 草稿持久化
- [x] 标题/正文 400ms 防抖写 `aicc-creation-draft:<topicId>`；进入有草稿 → 提示「继续 / 重新开始」并恢复

## 5. 发布 · 再修改 · 闭环图谱
- [x] 抽 `src/lib/publishArticle.ts`（从 `EditorPage.confirmPublish` 提取）；`EditorPage` 改用之（不改其现有行为）
- [x] 写作台「发布并闭环」调用之 → 落库（`aicc-article-md` + `aicc-published-articles` 含 `conceptIds`）+ 该文每个 `conceptId` 标 `published` + 清草稿；slug 冲突二次确认
- [x] **再修改（覆盖式）**：已 `published` 选题重进写作台预填正文，覆盖重发同 slug
- [x] **图谱连边**：发布写 `aicc-creation-edges`（`{slug,title,conceptIds,at}`）；`GraphPage` 渲染概念间「文章连边」（标文章名）
- [x] 验证雷达卡 / 计划页「已成文」+ 图谱连边

## 6. 文档同步
- [x] `SPEC.md` §4.4 补「创作陪练 `callSparring`」一行；§3.2/§5 创作描述更新到「写作台含富文本/素材/陪练/发布/再改/图谱连边」；§4.5 存储补 `aicc-creation-draft` / `aicc-creation-edges`

## ✅ 纪律 Gate（见 openspec/project.md §3）
- [x] `npx tsc -b` / `npm run build` 通过
- [x] 浏览器验收全链路（富文本/素材/陪练/草稿恢复/发布/再改/图谱连边）+ 截图
- [x] **AI 陪练真 key 真机冒烟**（产出有用且不代笔）
- [x] UI 改动 → 刷新 `design/live` 基线（`export-pages.mjs static`）
- [x] `SPEC.md` 已同步
- [x] `/opsx:sync` 并入 `openspec/specs/creation/` → `/opsx:archive`
- [x] commit/push（local == GitHub）→ push 后查 README
