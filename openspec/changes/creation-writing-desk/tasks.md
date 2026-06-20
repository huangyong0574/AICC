# Tasks · creation-writing-desk

## 1. 素材引用
- [ ] 写 `extractMaterials(note): { kind: '原理'|'类比'|'本质'; text: string; source: string }[]`（含旧 `Note.qa?` 兜底）
- [ ] `DeskView` 加「我的素材」面板，渲染派生素材行 + 「引用」按钮
- [ ] 「引用」插入正文引用块（blockquote + 「引自 · 来源」），缺字段行不渲染

## 2. AI 陪练
- [ ] `feynman/lib/llm.ts` 加 `callSparring(mode, draft, cfg)`（非流式）；system prompt 强约束「只评点、禁止代写成段正文」
- [ ] `DeskView` 加 4 个陪练按钮（找反方 / 缺论据 / 事实核查 / 读者之问）
- [ ] 评点内联展示在编辑器下方；`!cfg.apiKey` 时复用前置校验弹设置

## 3. 草稿持久化
- [ ] 标题/正文 400ms 防抖写 `aicc-creation-draft:<topicId>`
- [ ] 进入写作台若有草稿 → 提示「继续 / 重新开始」并恢复

## 4. 发布并闭环
- [ ] 抽 `src/lib/publishArticle.ts`（从 `EditorPage.confirmPublish` 提取共享逻辑）
- [ ] `EditorPage` 改用该共享函数（不改变其现有行为）
- [ ] 写作台「发布并闭环」调用之 → 落库 + `cognition.upsert(...published)` + 清草稿；slug 冲突走二次确认
- [ ] 验证雷达卡 / 计划页发布后显示「已成文」

## 5. 文档同步
- [ ] `SPEC.md` §4.4 LLM 调用矩阵补「创作陪练」一行；§3.1/§5 创作描述更新到「写作台已含素材/陪练/发布闭环」

## ✅ 纪律 Gate（合并前逐条勾，见 openspec/project.md §3）
- [ ] `npx tsc -b` / `npm run build` 通过
- [ ] 浏览器验收写作台全链路（素材引用 / 陪练 / 草稿恢复 / 发布回写）+ 截图
- [ ] **AI 陪练真 key 真机冒烟**（确认产出有用且不代笔）
- [ ] UI 改动 → `export DASHSCOPE_API_KEY=<key> && node scripts/export-pages.mjs` 刷新 `design/live` 基线
- [ ] `SPEC.md` 已同步
- [ ] `/opsx:sync` 把 delta specs 并入 `openspec/specs/creation/`，`/opsx:archive` 归档
- [ ] commit/push（local == GitHub）
