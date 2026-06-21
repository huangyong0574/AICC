## Why

应用是多页平台，但浏览器标签页 / 书签 / 历史记录全部显示同一个静态标题 `AICC · AI Cognition Connector`（来自 `index.html`），无法区分当前在哪一页。多标签页并存或收藏某页时尤其困扰。

## What Changes

- 每个路由切换时设置**描述性 `document.title`**（形如「深度计划 · AICC」「认知图谱 · AICC」），首页保留品牌全称。
- 深链直达（直接打开 `/graph` 等）与前进/后退也正确反映标题。

## Capabilities

### New Capabilities
- `app-shell`: 应用外壳契约——手写 History 路由、`CognitionProvider`、以及页面级浏览器表现（如 `document.title`）。本变更落「描述性页面标题」。

### Modified Capabilities
<!-- 无既有 openspec 能力被改（openspec/specs/ 尚空）。 -->

## Impact

- 代码：`src/main.tsx`（新增页面→标题映射 + 一个 `useEffect`）。
- 基线：各页 `design/live/*.html` 的 `<head><title>` 会随之更新（`node scripts/export-pages.mjs static` 刷新，静态页无需 LLM key）。
- 无新依赖、无存储契约变化、无 LLM 调用。
