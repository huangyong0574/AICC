# Tasks · route-document-title

## 1. 实现
- [x] `src/main.tsx` 加 `PAGE_TITLES: Record<AppPage, string>` 映射
- [x] 加 `useEffect`：按 `page`（+ `articleSlug` / `radarWeek`）设 `document.title`，依赖数组含三者
- [x] `letter` 用品牌全称；`radar` 周切片附 week；`article` 让 ArticlePage 接管（effect 早退）

## ✅ 纪律 Gate（见 openspec/project.md §3）
- [x] `npx tsc -b` 通过
- [x] 浏览器验收：逐路由断言 `document.title` 正确（用 `document.title`，确定性，无需截图）
- [x] UI 改动 → 刷新 `design/live` 基线：`node scripts/export-pages.mjs static`（静态页无需 LLM key）
- [x] SPEC.md：无需同步（不影响总纲契约）
- [x] `/opsx:sync` 将 delta 并入 `openspec/specs/app-shell/`
- [x] `/opsx:archive` 归档
- [x] commit/push（local == GitHub）
- [x] push 后检查 README 是否需同步（本变更属小 UX，无需）
