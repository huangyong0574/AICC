#!/usr/bin/env node
/**
 * parse-radar-html.mjs —— 把外部程序每周生成的「认知雷达」成品 HTML 解析为 AICC 的 RadarWeek JSON。
 * 见 SPEC §3.6（HTML 摄取路径）。
 *
 * 用法：
 *   node scripts/parse-radar-html.mjs <path/to/AI认知雷达-YYYY-MM-DD.html> [--out <dir>]
 *   默认输出到 Obsidian AICC-Input/，随后用 ingest-radar.mjs 入库。
 *
 * 依赖 HTML 模板结构（外部程序须保持）：
 *   - <span class="logo-version">2026-W25</span>      → weekId
 *   - <title>AI认知雷达 · 2026-06-19</title>           → generatedAt（本周五）
 *   - <div class="kicker">2026-06-15 ~ 2026-06-19 · …  → dateRange
 *   - <article class="insight {maturity}" data-index="NN"> … </article>，块内：
 *       .eyebrow / h3 / .tagline / 两个 .detail（→ corePrinciple, whyMatters）
 *       .meta-row 内两个 .badge（maturity, org）+ 一个 <a href>（sourceUrl）
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, basename } from 'node:path'

const DEFAULT_OUT =
  process.env.AICC_RADAR_SRC ||
  '/Users/huangyong/Documents/Obsidian Vault/AICC项目/AICC-Input'

const args = process.argv.slice(2)
const htmlPath = args.find((a) => !a.startsWith('--'))
const outIdx = args.indexOf('--out')
const outDir = outIdx >= 0 ? args[outIdx + 1] : DEFAULT_OUT
if (!htmlPath) { console.error('用法: node scripts/parse-radar-html.mjs <html> [--out <dir>]'); process.exit(1) }

const html = readFileSync(resolve(htmlPath), 'utf8')

const pick = (re, s = html) => { const m = s.match(re); return m ? m[1].trim() : '' }
const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
   .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').trim()
const stripTags = (s) => decode(s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '))
const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48)

const weekId = pick(/class="logo-version"[^>]*>([^<]+)</)
const generatedAt = pick(/<title>[^<]*?(\d{4}-\d{2}-\d{2})[^<]*<\/title>/)
const dateRange = pick(/class="kicker"[^>]*>\s*([\d]{4}-\d{2}-\d{2}\s*~\s*\d{4}-\d{2}-\d{2})/)

if (!/^\d{4}-W\d{2}$/.test(weekId)) {
  console.error(`✗ 无法从 HTML 解析出合法 weekId（取到 "${weekId}"）；检查 <span class="logo-version">。`)
  process.exit(1)
}

// 逐个认知点 article 块
const articleRe = /<article class="insight (frontier|mature|experimental)"[^>]*data-index="(\d+)">([\s\S]*?)<\/article>/g
const insights = []
let m
while ((m = articleRe.exec(html)) !== null) {
  const [, maturity, idxRaw, block] = m
  const index = parseInt(idxRaw, 10)
  const eyebrow = stripTags(pick(/class="eyebrow"[^>]*>([\s\S]*?)<\/div>/, block))
  const title = stripTags(pick(/<h3>([\s\S]*?)<\/h3>/, block))
  const tagline = stripTags(pick(/class="tagline"[^>]*>([\s\S]*?)<\/p>/, block))
  const details = [...block.matchAll(/class="detail"[^>]*>([\s\S]*?)<\/p>/g)].map((d) => stripTags(d[1]))
  const badges = [...block.matchAll(/class="badge"[^>]*>([\s\S]*?)<\/span>/g)].map((b) => stripTags(b[1]))
  const org = badges.find((b) => !/^(frontier|mature|experimental)$/i.test(b)) || ''
  const sourceUrl = pick(/class="badge"[^>]*href="([^"]+)"/, block)
  const slug = slugify(eyebrow || title)
  insights.push({
    id: `${weekId}-${String(index).padStart(2, '0')}-${slug}`,
    index,
    eyebrow,
    title,
    tagline,
    maturity,
    corePrinciple: details[0] || '',
    whyMatters: details[1] || '',
    org,
    dateRange: generatedAt,
    sourceUrl,
  })
}

if (!insights.length) {
  console.error('✗ 未解析到任何 .insight 认知点；检查 HTML 结构是否仍是 <article class="insight …">。')
  process.exit(1)
}

// 速览层：视频精选 / 公司技术动态 / 热门新闻（均可选）
const heroCopy = stripTags(pick(/class="hero-copy"[^>]*>([\s\S]*?)<\/p>/))
const videos = [...html.matchAll(/<a class="video"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map(([, url, blk]) => {
  const badges = [...blk.matchAll(/class="badge"[^>]*>([\s\S]*?)<\/span>/g)].map((b) => stripTags(b[1]))
  const metas = [...blk.matchAll(/class="video-meta"[^>]*>([\s\S]*?)<\/div>/g)].map((d) => stripTags(d[1]))
  return {
    rank: parseInt((badges[0] || '').replace(/\D/g, ''), 10) || undefined,
    title: stripTags(pick(/class="video-title"[^>]*>([\s\S]*?)<\/div>/, blk)),
    channel: metas[0] || '',
    note: metas[1] || '',
    views: badges.find((b) => /view/i.test(b)) || '',
    url,
  }
})
const companyRows = pick(/<section id="companies"[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/)
const companies = [...companyRows.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(([, row]) => {
  const td = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => c[1])
  return {
    org: stripTags(td[1] || ''),
    title: stripTags(td[2] || ''),
    type: stripTags(td[3] || ''),
    concept: stripTags(td[4] || ''),
    summary: stripTags(td[5] || ''),
    url: pick(/href="([^"]+)"/, td[6] || ''),
  }
}).filter((c) => c.org && c.title)
const news = [...html.matchAll(/<a class="news-card"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map(([, url, blk]) => ({
  source: stripTags(pick(/class="badge"[^>]*>([\s\S]*?)<\/span>/, blk)),
  title: stripTags(pick(/<h3>([\s\S]*?)<\/h3>/, blk)),
  summary: stripTags(pick(/<p>([\s\S]*?)<\/p>/, blk)),
  url,
}))

const week = { weekId, dateRange: dateRange || generatedAt, generatedAt, heroCopy, insights, videos, companies, news }
const outPath = resolve(outDir, `${weekId}.json`)
if (!existsSync(outDir)) { console.error(`✗ 输出目录不存在：${outDir}`); process.exit(1) }
writeFileSync(outPath, JSON.stringify(week, null, 2) + '\n', 'utf8')

console.log(`✓ 从 ${basename(htmlPath)} 解析出 ${insights.length} 个认知点 → ${outPath}`)
console.log(`  weekId=${weekId}  dateRange=${week.dateRange}  generatedAt=${generatedAt}`)
insights.forEach((it) => console.log(`  ${it.id}  [${it.maturity}] ${it.title}  ${it.sourceUrl ? '✓src' : '✗无来源'}`))
console.log(`  速览层: ${videos.length} 视频 / ${companies.length} 公司动态 / ${news.length} 新闻`)
console.log(`\n下一步：node scripts/ingest-radar.mjs "${outPath}"`)
