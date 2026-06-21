# Tasks · route-document-title

## 1. 实现
- [ ] `src/main.tsx` 加 `PAGE_TITLES: Record<AppPage, string>` 映射
- [ ] 加 `useEffect`：按 `page`（+ `articleSlug` / `radarWeek`）设 `document.title`，依赖数组含三者
- [ ] `letter` 用品牌全称；`radar` 周切片附 week；`article` 附 slug

## ✅ 纪律 Gate（见 openspec/project.md §3）
- [ ] `npx tsc -b` 通过
- [ ] 浏览器验收：逐路由断言 `document.title` 正确（用 `document.title`，确定性，无需截图）
- [ ] UI 改动 → 刷新 `design/live` 基线：`node scripts/export-pages.mjs static`（静态页无需 LLM key）
- [ ] SPEC.md：无需同步（不影响总纲契约）
- [ ] `/opsx:sync` 将 delta 并入 `openspec/specs/app-shell/`
- [ ] `/opsx:archive` 归档
- [ ] commit/push（local == GitHub）
- [ ] push 后检查 README 是否需同步（本变更属小 UX，无需）
