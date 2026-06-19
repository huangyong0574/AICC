# AICC 后端（server/）— 设计 SPEC

> 把 AICC 的用户数据从浏览器 localStorage 迁到服务端数据库。**后端权威源 + 前端缓存**：DB 为准，
> localStorage 降级为离线缓存（仍秒读，写时同步后端）。单用户、Flask + SQLite，复用 cloud-delivery 范式。
> 任何改动须同步本文件（与根 `SPEC.md` 同级的工程纪律）。

## 架构总览

```
浏览器 (React SPA, /aicc/)
  │  启动时 GET /aicc-api/state 一次性 hydrate → 写入 localStorage 缓存
  │  本地读：直接读 localStorage（秒开、离线可用）
  │  本地写：先写 localStorage（即时反馈）→ 异步 PUT/DELETE 同步后端（失败入队重试）
  ▼
nginx (101.37.128.102) ──/aicc-api/──► gunicorn ──► Flask
                                                      ├─ SQLAlchemy → SQLite (instance/aicc.db)
                                                      └─ /aicc-api/llm/* → 代理 DashScope（key 在后端 env）
```

- **权威源**：SQLite。localStorage 是缓存，可随时从 `/state` 重建。
- **认证**：单用户 Bearer token（`AICC_API_TOKEN` 环境变量）。所有 `/aicc-api/*` 需 `Authorization: Bearer <token>`，`/health` 除外。多用户扩展点见末尾。
- **API key 安全**：百炼 key 移到后端 env（`DASHSCOPE_API_KEY`），前端不再持有；LLM 调用走后端代理。根除明文风险。

## 数据模型（localStorage → 表）

| localStorage 键 | 表 | 主键 | 关键字段 |
|---|---|---|---|
| `aicc-cognition-state` | `cognition_items` | `id`（concept id） | state, title, title_en, slug, source_week, source_file, progress, relation(JSON), added_at, updated_at |
| `aicc-feynman-notes` | `feynman_notes` | `id`（noteId） | concept_id(idx), topic, raw_question, steps(JSON), warmup_questions(JSON), feynman(JSON), tags(JSON), created_at, updated_at |
| `aicc-published-articles` + `aicc-article-md:<slug>` | `articles` | `slug` | title, subtitle, category, markdown, status, tags(JSON), date, updated_at |
| `aicc-feynman-graph` | `graph_deltas` | `concept` | data(JSON), updated_at |
| `aicc-theme` 等非敏感设置 | `settings` | `key` | value(JSON) |

`aicc-deep-plan` 是派生（state≠discovered），不入库，由前端/后端从 cognition 重算。
**llm cfg 的 api key 不入库**（移后端 env）；model/baseUrl 等非敏感可入 `settings`。

## API 契约

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/aicc-api/health` | 健康检查（无需 token） |
| GET | `/aicc-api/state` | 一次性返回全部数据（前端启动 hydrate）：`{cognition, notes, articles, graph, settings}` |
| PUT | `/aicc-api/cognition/<id>` | upsert 一个认知点 |
| DELETE | `/aicc-api/cognition/<id>` | 删除认知点 |
| PUT | `/aicc-api/notes/<id>` | upsert 费曼笔记（含中途草稿） |
| DELETE | `/aicc-api/notes/<id>` | 删除笔记 |
| PUT | `/aicc-api/articles/<slug>` | upsert 文章（含 markdown） |
| PUT | `/aicc-api/graph/<concept>` | upsert 图谱关系 |
| PUT | `/aicc-api/settings/<key>` | upsert 设置 |
| POST | `/aicc-api/import` | 批量导入（迁移现有 localStorage 全量，幂等 upsert） |
| POST | `/aicc-api/llm/chat` | （阶段4）代理 DashScope，SSE 流式，key 在后端 |

约定：JSON 字段在 SQLite 存 TEXT（`json.dumps`）；时间戳 `updated_at` 服务端写。所有写操作幂等（upsert）。

## 部署（复用 cloud-delivery 范式）

- `instance/aicc.db`（SQLite，单文件，易备份）；`.env` 存 `AICC_API_TOKEN` / `DASHSCOPE_API_KEY`（不入 git）。
- gunicorn 跑 Flask；nginx 反代 `location /aicc-api/ { proxy_pass http://127.0.0.1:<port>/; }`。
- 部署目录建议 `/opt/aicc-api/`；备份 = 定期拷 `instance/aicc.db`。

## 分阶段里程碑（每阶段独立可上线，工程纪律：SPEC→实现→验证→commit→部署）

1. **后端骨架**（本阶段）：Flask + SQLAlchemy + SQLite + token 中间件 + models + GET `/state` + 各资源 PUT/DELETE + POST `/import` + `/health`。本地 venv 跑通 + curl 验证。
2. **后端上线**：gunicorn + nginx `/aicc-api/` 反代，部署 ECS，线上 health/state 验证。
3. **前端数据层**：新增 `src/lib/apiClient.ts` + 改 `storage.ts`/`cognition.tsx` 为「读缓存 → 启动 hydrate → 写时双写后端（失败入队重试）」。
4. **LLM 代理 + 迁移**：key 移后端、前端 LLM 调用改走 `/aicc-api/llm/chat`；前端「导出 localStorage → POST /import」一次性迁移老数据。

## 多用户扩展点（未来，当前不做）

加 `users` 表 + 各表 `user_id` 外键 + 登录换 token；`/state` 与写操作按 `user_id` 过滤。当前单用户用一个固定 token，数据不分租户。
