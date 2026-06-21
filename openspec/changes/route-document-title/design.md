## Context

`src/main.tsx` 是手写 History 路由：`page: AppPage` 状态驱动渲染，`articleSlug` / `radarWeek` 为参数态，`pathToState` 在初始化与 `popstate` 时解析 URL。`index.html` 写死 `<title>`。AppPage = `letter | graph | article | feynman | radar-archive | radar | plan | editor | creation`。

## Goals / Non-Goals

- **Goals**：路由切换 / 深链直达 / 前进后退时，`document.title` 反映当前页。
- **Non-Goals**：不引入 `react-helmet` 等三方库（与手写路由的零依赖风格一致）；article 标题暂用 slug 派生（真实文章标题在 `ArticlePage`，不为此上提状态）。

## Decisions

### 标题来源：页面→标题静态映射 + 单个 useEffect
在 `App` 内定义 `PAGE_TITLES: Record<AppPage, string>`，并加 `useEffect(() => { document.title = ... }, [page, articleSlug, radarWeek])`：
- `letter` → `AICC · AI Cognition Connector`（首页保留品牌全称）
- 其余 → `<页名> · AICC`（如 `深度计划 · AICC`）
- `radar` 周切片 → `认知雷达 · <week> · AICC`（有 week 时）
- `article` → `<slug> · AICC`（slug 派生，可读即可）

放在 `useEffect` 而非渲染期赋值，避免重复副作用；依赖含 `articleSlug`/`radarWeek` 以覆盖参数变化。

## Risks / Open Questions

- 无显著风险（纯前端、无依赖、无契约）。article 真实标题→标题栏可作后续增强。
