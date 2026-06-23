// AICC 本地 Gateway —— 绑 127.0.0.1，静态托管构建产物 + 代理 DashScope（key 只在服务端）。
// 启动：node server/gateway.mjs（先 npm run build 产出 dist/）。配置见 server/.env(.example)。
// 安全：仅监听本机；若设了 AICC_TOKEN 则 /api/* 需 Bearer 校验（dist 模式会注入到页面）。
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeConcept, writeArticle, listConcepts, listArticles, vaultStatus } from './vault.mjs'
import { radarIndex, radarWeek } from './radar.mjs'

// 读取 server/.env（极简解析，无依赖）
try {
  const envPath = fileURLToPath(new URL('./.env', import.meta.url))
  const txt = await readFile(envPath, 'utf8')
  for (const line of txt.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch { /* 无 .env 用进程环境变量 */ }

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIST = join(ROOT, 'dist')
const HOST = '127.0.0.1' // 只绑本机，绝不 0.0.0.0
const PORT = Number(process.env.PORT || 8787)
const KEY = process.env.DASHSCOPE_API_KEY || ''
const TOKEN = process.env.AICC_TOKEN || ''
const BASE = (process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1').replace(/\/$/, '')
// 认知存储 vault 根（默认 <project>/vault，可在 .env 配 VAULT_DIR 指向你的 Obsidian 库）；笔记落 <VAULT>/AICC/{concepts,articles}
const VAULT = process.env.VAULT_DIR || join(ROOT, 'vault')

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.map': 'application/json',
}

const authed = (req) => !TOKEN || (req.headers.authorization || '') === `Bearer ${TOKEN}`

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })
}

function sendJson(res, status, obj) {
  res.writeHead(status, { 'content-type': 'application/json' })
  res.end(JSON.stringify(obj))
}

async function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname).replace(/^\/+/, '')
  if (!rel || rel.endsWith('/')) rel += 'index.html'
  let file = join(DIST, rel)
  if (!file.startsWith(DIST)) { res.writeHead(403); return res.end('forbidden') } // 防目录穿越
  let body
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html')
    body = await readFile(file)
  } catch {
    // SPA 兜底：未命中文件 → index.html（手写 History 路由）
    file = join(DIST, 'index.html')
    try { body = await readFile(file) } catch { res.writeHead(404); return res.end('build 不存在，请先 npm run build') }
  }
  let out = body
  const ext = extname(file)
  if (ext === '.html') {
    // 注入：①单用户 token（前端调 /api/llm 时携带）②key 是否在服务端就绪（前端据此判定 gateway 模式、免浏览器持 key）
    const inject = `<script>window.__AICC_TOKEN__=${JSON.stringify(TOKEN)};window.__AICC_KEY_READY__=${JSON.stringify(!!KEY)}</script>`
    out = Buffer.from(body.toString('utf8').replace('</head>', `${inject}</head>`), 'utf8')
  }
  res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream' })
  res.end(out)
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`)

  if (url.pathname === '/api/health') {
    res.writeHead(200, { 'content-type': 'application/json' })
    return res.end(JSON.stringify({ ok: true, keyConfigured: !!KEY }))
  }

  if (url.pathname === '/api/llm' && req.method === 'POST') {
    if (!authed(req)) { res.writeHead(401); return res.end('unauthorized') }
    if (!KEY) {
      res.writeHead(503, { 'content-type': 'application/json' })
      return res.end(JSON.stringify({ error: 'Gateway 未配置 DASHSCOPE_API_KEY（见 server/.env）' }))
    }
    const body = await readBody(req)
    let upstream
    try {
      upstream = await fetch(`${BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${KEY}` },
        body,
      })
    } catch (e) {
      res.writeHead(502, { 'content-type': 'application/json' })
      return res.end(JSON.stringify({ error: 'DashScope 连接失败: ' + String(e?.message || e) }))
    }
    res.writeHead(upstream.status, { 'content-type': upstream.headers.get('content-type') || 'application/json' })
    if (upstream.body) {
      const reader = upstream.body.getReader()
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        res.write(Buffer.from(value)) // SSE / JSON 原样透传
      }
    }
    return res.end()
  }

  // 认知存储：vault 读写（写 in-plan+ 概念与成稿成 .md；读供前端 hydrate）。带 token 鉴权。
  if (url.pathname.startsWith('/api/vault/')) {
    if (!authed(req)) { res.writeHead(401); return res.end('unauthorized') }
    const sub = url.pathname.slice('/api/vault/'.length)
    const method = req.method
    try {
      if (method === 'GET' && sub === 'status') return sendJson(res, 200, await vaultStatus(VAULT))
      if (method === 'GET' && sub === 'concepts') return sendJson(res, 200, await listConcepts(VAULT))
      if (method === 'GET' && sub === 'articles') return sendJson(res, 200, await listArticles(VAULT))
      if ((method === 'PUT' || method === 'POST') && (sub === 'concept' || sub === 'article')) {
        let payload
        try { payload = JSON.parse((await readBody(req)) || '{}') } catch { return sendJson(res, 400, { error: 'invalid json' }) }
        const file = sub === 'concept' ? await writeConcept(VAULT, payload) : await writeArticle(VAULT, payload)
        return sendJson(res, 200, { ok: true, file })
      }
      return sendJson(res, 404, { error: 'not found' })
    } catch (e) {
      console.error('[vault] error:', e)            // 详情进服务端日志，不回传（避免泄露本机路径）
      return sendJson(res, 500, { error: 'vault operation failed' })
    }
  }

  // 雷达消费 vault：直接从 AICC-Input 读每周 JSON（∪ 打包历史周）。非敏感内容，不强制 token。
  if (url.pathname.startsWith('/api/radar/')) {
    const sub = url.pathname.slice('/api/radar/'.length)
    try {
      if (sub === 'index') return sendJson(res, 200, { weeks: await radarIndex(VAULT, DIST) })
      if (sub === 'week') {
        const wk = await radarWeek(VAULT, DIST, url.searchParams.get('id') || '')
        return wk ? sendJson(res, 200, wk) : sendJson(res, 404, { error: 'week not found' })
      }
      return sendJson(res, 404, { error: 'not found' })
    } catch (e) {
      console.error('[radar] error:', e)
      return sendJson(res, 500, { error: 'radar operation failed' })
    }
  }

  return serveStatic(req, res, url.pathname)
})

server.listen(PORT, HOST, () => {
  console.log(`AICC Gateway → http://${HOST}:${PORT}  (key: ${KEY ? '已配置' : '未配置'}, token: ${TOKEN ? '启用' : '关闭'}, vault: ${VAULT})`)
})
