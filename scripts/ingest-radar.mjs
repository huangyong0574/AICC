#!/usr/bin/env node
/**
 * ingest-radar.mjs —— 把 ai-cognitive-radar skill 产出的「周 JSON」纳入工程事实来源。
 * 见 SPEC §3.6（摄取链路：Obsidian 中转 + AICC 侧集成；git 为唯一事实来源）。
 *
 * 用法：
 *   node scripts/ingest-radar.mjs <week.json> [more.json ...]   # 摄取指定周文件
 *   node scripts/ingest-radar.mjs                                # 无参：扫描默认 AICC-Input 目录
 *   AICC_RADAR_SRC=/path node scripts/ingest-radar.mjs           # 覆盖默认源目录
 *
 * 行为：校验 RadarWeek 契约 + id 规范 `{weekId}-{NN}-{slug}`
 *       → 复制到 public/content/radar/{weekId}.json
 *       → 扫描目录重建 index.json（按 weekId 降序，新→旧）。
 * 幂等：对已存在的同一周数据重复运行，结果不变。
 *
 * 之后需手动：git add public/content/radar && commit + push → npm run build → 部署 dist 到 ECS。
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname, basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const RADAR_DIR = join(ROOT, 'public', 'content', 'radar')
const DEFAULT_SRC =
  process.env.AICC_RADAR_SRC ||
  '/Users/huangyong/Documents/Obsidian Vault/AICC项目/AICC-Input'

const MATURITY = new Set(['frontier', 'mature', 'experimental'])
const WEEKID_RE = /^\d{4}-W\d{2}$/
const INSIGHT_FIELDS = [
  'id', 'index', 'eyebrow', 'title', 'tagline', 'maturity',
  'corePrinciple', 'whyMatters', 'org', 'dateRange', 'sourceUrl',
]

/** 校验一周 RadarWeek 数据，返回错误列表（空 = 合规）。 */
function validateWeek(data) {
  const errs = []
  if (!data || typeof data !== 'object') return ['不是合法的 JSON 对象']
  if (!WEEKID_RE.test(data.weekId || '')) errs.push(`weekId 非法（需形如 2026-W24）：${data.weekId}`)
  if (!data.dateRange) errs.push('缺 dateRange')
  if (!data.generatedAt) errs.push('缺 generatedAt（= 本周五日期，如 2026-06-12）')
  if (!Array.isArray(data.insights) || data.insights.length === 0) {
    errs.push('insights 必须是非空数组')
    return errs
  }
  const idRe = new RegExp(`^${data.weekId}-\\d{2}-[a-z0-9-]+$`)
  data.insights.forEach((it, i) => {
    INSIGHT_FIELDS.forEach((k) => {
      if (it[k] === undefined || it[k] === '') errs.push(`insights[${i}] 缺字段 ${k}`)
    })
    if (it.id && !idRe.test(it.id)) errs.push(`insights[${i}].id 不符合 {weekId}-{NN}-{slug}：${it.id}`)
    if (it.maturity && !MATURITY.has(it.maturity)) errs.push(`insights[${i}].maturity 非法：${it.maturity}`)
  })
  return errs
}

/** 收集待摄取的输入文件路径。 */
function collectInputs() {
  const args = process.argv.slice(2)
  if (args.length) return args.map((a) => resolve(a))
  if (!existsSync(DEFAULT_SRC)) {
    console.warn(`（提示）默认源目录不存在：${DEFAULT_SRC}`)
    console.warn('仅重建 index.json；如需摄取请显式传入 week.json 路径，或设 AICC_RADAR_SRC。\n')
    return []
  }
  return readdirSync(DEFAULT_SRC)
    .filter((f) => WEEKID_RE.test(basename(f, '.json')))
    .map((f) => join(DEFAULT_SRC, f))
}

/** 扫描 radar 目录重建 index.json（新→旧）。 */
function rebuildIndex() {
  const weeks = readdirSync(RADAR_DIR)
    .filter((f) => f.endsWith('.json') && f !== 'index.json' && WEEKID_RE.test(basename(f, '.json')))
    .map((f) => {
      const d = JSON.parse(readFileSync(join(RADAR_DIR, f), 'utf8'))
      return { weekId: d.weekId, dateRange: d.dateRange, file: f, generatedAt: d.generatedAt }
    })
    .sort((a, b) => (a.weekId < b.weekId ? 1 : a.weekId > b.weekId ? -1 : 0))
  writeFileSync(join(RADAR_DIR, 'index.json'), JSON.stringify({ weeks }, null, 2) + '\n', 'utf8')
  return weeks
}

function main() {
  const inputs = collectInputs()
  let ingested = 0
  for (const src of inputs) {
    const label = basename(src)
    let data
    try {
      data = JSON.parse(readFileSync(src, 'utf8'))
    } catch (e) {
      console.error(`✗ ${label}: 读取/解析失败 — ${e.message}`)
      continue
    }
    const errs = validateWeek(data)
    if (errs.length) {
      console.error(`✗ ${label} 校验未通过（已跳过）：`)
      errs.forEach((e) => console.error(`    - ${e}`))
      continue
    }
    const dest = join(RADAR_DIR, `${data.weekId}.json`)
    const existed = existsSync(dest)
    writeFileSync(dest, JSON.stringify(data, null, 2) + '\n', 'utf8')
    console.log(`✓ ${label} → public/content/radar/${data.weekId}.json（${data.insights.length} 个认知点，${existed ? '更新' : '新增'}）`)
    ingested++
  }
  const weeks = rebuildIndex()
  console.log(`\nindex.json 已重建：${weeks.length} 周（最新 ${weeks[0]?.weekId ?? '—'}）。`)
  if (inputs.length) console.log(`本次摄取 ${ingested}/${inputs.length} 周。`)
  console.log('下一步：git add public/content/radar && commit + push → npm run build → 部署 dist 到 ECS。')
}

main()
