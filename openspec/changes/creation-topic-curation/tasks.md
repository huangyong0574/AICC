# Tasks · creation-topic-curation

## 1. 选题数据与生成
- [ ] 扩展 `Topic` 类型：`angle` / `potential` / `hook{text,sourceUrl?}` / `conceptIds[]`
- [ ] `feynman/lib/llm.ts` 加 `callTopics(concepts, trends, cfg)`（非流式，固定输出 schema）
- [ ] system/user prompt：强约束「融合 ≥1（优先 2）个给定知识点 + 1 趋势钩子、**命中 AI Native 转型客户关切**、给有张力角度、不得编造知识点」+ **按 rubric 自评 `potential`（防全 5★）**；每批 3–5 条
- [ ] 输入装配：从已闭环 `Note` 取精髓（topic + Step4 一句话 + Step1 类比）+ 雷达 `news`/`insights` 趋势
- [ ] 输出校验：`conceptIds` 过滤到已闭环集合内（防幻觉）；`angle` 落在固定 5 类（转型角度）

## 2. 缓存与门槛
- [ ] `aicc-creation-topics` 缓存（generatedAt + topics）；进页面读缓存，知识点集合变化则失效
- [ ] 「换一批」重新 `callTopics`
- [ ] 闭环 < `UNLOCK_MIN` 锁定提示；无 key 弹设置

## 3. 选题卡 UI（对齐设计稿 VIEW 1）
- [ ] `TopicCard` 重做：角度标签（5 类转型角度配色）+ 客户共鸣度 dots + 「为什么现在·行业钩子」+ 「可调用你的闭环笔记」chips + 「就这个，我来写 →」
- [ ] 「不感兴趣」换下一个（可选）

## ✅ 纪律 Gate（见 openspec/project.md §3）
- [ ] `npx tsc -b` / `npm run build` 通过
- [ ] 浏览器验收选题生成 / 换一批 / 锁定 / 卡片渲染 + 截图
- [ ] **真 key 真机冒烟**：选题确有张力、融合不牵强、conceptIds 不幻觉
- [ ] UI 改动 → 刷新 `design/live` 基线（`export-pages.mjs static`）
- [ ] `SPEC.md` §4.4 LLM 矩阵补「选题生成」一行 + §3.2/§5 创作描述更新
- [ ] `/opsx:sync` 并入 `openspec/specs/creation/` → `/opsx:archive`
- [ ] commit/push（local == GitHub）→ push 后查 README 是否需同步
