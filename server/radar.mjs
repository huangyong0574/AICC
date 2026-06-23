// 雷达消费 vault —— Gateway 直接从 vault 的 AICC-Input/ 读每周 {weekId}.json，
// 与打包的历史周（dist/content/radar/）合并；新周文件一落地 AICC 即多一期，免 ingest→git→build→ECS。
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const WEEKID_FILE = /^(\d{4}-W\d{2})\.json$/
const WEEKID = /^\d{4}-W\d{2}$/

// 扫描 AICC-Input（根 + 一层日期子文件夹）里的 {weekId}.json，校验 RadarWeek 契约（weekId 正则 + insights 非空）
async function scanVaultRadar(vault) {
  const base = join(vault, 'AICC-Input')
  const out = new Map() // weekId -> { path, data }
  let entries = []
  try { entries = await readdir(base, { withFileTypes: true }) } catch { return out }
  const files = []
  for (const e of entries) {
    if (e.isFile() && WEEKID_FILE.test(e.name)) files.push(join(base, e.name))
    else if (e.isDirectory()) {
      try {
        for (const n of await readdir(join(base, e.name))) if (WEEKID_FILE.test(n)) files.push(join(base, e.name, n))
      } catch { /* 跳过不可读子目录 */ }
    }
  }
  for (const f of files) {
    try {
      const data = JSON.parse(await readFile(f, 'utf8'))
      if (WEEKID.test(data.weekId || '') && Array.isArray(data.insights) && data.insights.length) {
        out.set(data.weekId, { path: f, data })   // 同 weekId 后扫到的覆盖（子文件夹优先于根，取决于遍历序，足够 MVP）
      }
    } catch { /* 跳过坏 JSON */ }
  }
  return out
}

// 周索引：打包历史周 ∪ vault 周（vault 覆盖/新增），按 weekId 降序（新→旧）
export async function radarIndex(vault, dist) {
  const byId = new Map()
  try {
    const idx = JSON.parse(await readFile(join(dist, 'content', 'radar', 'index.json'), 'utf8'))
    for (const w of idx.weeks || []) byId.set(w.weekId, { weekId: w.weekId, dateRange: w.dateRange, file: `${w.weekId}.json`, generatedAt: w.generatedAt })
  } catch { /* 无打包索引 */ }
  for (const [weekId, { data }] of await scanVaultRadar(vault)) {
    byId.set(weekId, { weekId, dateRange: data.dateRange, file: `${weekId}.json`, generatedAt: data.generatedAt })
  }
  return [...byId.values()].sort((a, b) => (a.weekId < b.weekId ? 1 : a.weekId > b.weekId ? -1 : 0))
}

// 某周内容：vault 优先（最新），否则打包副本
export async function radarWeek(vault, dist, weekId) {
  if (!WEEKID.test(weekId)) return null
  const v = await scanVaultRadar(vault)
  if (v.has(weekId)) return v.get(weekId).data
  try { return JSON.parse(await readFile(join(dist, 'content', 'radar', `${weekId}.json`), 'utf8')) } catch { return null }
}
