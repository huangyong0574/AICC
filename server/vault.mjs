// AICC vault 存储 —— 把"已介入概念"与"成稿"写成 Obsidian 友好的原子 Markdown。
// 结构（VAULT 为配置的 vault 根，默认 <project>/vault）：
//   <VAULT>/AICC/concepts/<标题>.md   frontmatter(aicc-id/status/...) + 费曼蒸馏 body + ## 关联 [[parent]]
//   <VAULT>/AICC/articles/<slug>.md   frontmatter(slug/status/concept-ids/...) + 正文 + ## 融合 [[concept]]
// 单一数据源：localStorage 为缓存、vault 为权威。结构字段进 frontmatter（干净往返），body 供人读 + Obsidian 链接。
import { readFile, writeFile, readdir, mkdir, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import yaml from 'js-yaml'

// concepts/ 与 articles/ 直接放在 VAULT_DIR 下（VAULT_DIR 即 AICC 命名空间文件夹，
// 如指向 Obsidian 的「AICC项目」则与 AICC-Input 并列；默认 <project>/vault）
export const conceptsDir = (vault) => join(vault, 'concepts')
export const articlesDir = (vault) => join(vault, 'articles')
// 费曼笔记（完整工作记录，JSON 无损）与创作草稿（in-progress 正文）——数据唯一来源落盘，不只存浏览器
export const notesDir = (vault) => join(vault, 'notes')
export const draftsDir = (vault) => join(vault, 'drafts')

export async function ensureDirs(vault) {
  await mkdir(conceptsDir(vault), { recursive: true })
  await mkdir(articlesDir(vault), { recursive: true })
}

// 文件名安全：去掉文件系统/Obsidian 链接非法字符，保留中文/字母/数字/空格/连字符
function safeFileName(name, fallback) {
  const s = String(name || '').replace(/[\\/:*?"<>|#^[\]]/g, '').replace(/\s+/g, ' ').trim()
  return s || fallback || 'untitled'
}

// frontmatter + body → markdown
function compose(frontmatter, body) {
  const fm = {}
  for (const [k, v] of Object.entries(frontmatter)) {
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) continue
    fm[k] = v
  }
  const y = yaml.dump(fm, { lineWidth: -1, noRefs: true, sortKeys: false }).trimEnd()
  return `---\n${y}\n---\n\n${(body || '').trim()}\n`
}

// markdown → { frontmatter, body }
function parse(md) {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(md)
  if (!m) return { frontmatter: {}, body: md }
  let frontmatter = {}
  try { frontmatter = yaml.load(m[1]) || {} } catch { frontmatter = {} }
  return { frontmatter, body: m[2] || '' }
}

function shortId(id) {
  return String(id || '').replace(/[^a-zA-Z0-9]/g, '').slice(-6) || 'x'
}

// 按稳定 id 解析目标文件名（防覆盖/清孤儿）：
//  ① 目录里已有同 id 文件 → 改名即"移动"：删旧文件，杜绝孤儿；
//  ② 目标名被"别的 id"占用 → 追加 -短id：杜绝不同概念撞名互相静默覆盖、丢笔记。
async function resolveFileName(dir, base, id, idKey) {
  let names = []
  try { names = (await readdir(dir)).filter((n) => n.endsWith('.md')) } catch { names = [] }
  let sameIdFile = null
  let baseTakenByOther = false
  for (const n of names) {
    let fm = {}
    try { fm = parse(await readFile(join(dir, n), 'utf8')).frontmatter } catch { continue }
    if (id && fm[idKey] === id) { sameIdFile = n; continue }
    if (n === `${base}.md`) baseTakenByOther = true
  }
  const target = baseTakenByOther ? `${base}-${shortId(id)}.md` : `${base}.md`
  if (sameIdFile && sameIdFile !== target) {
    try { await unlink(join(dir, sameIdFile)) } catch { /* ignore */ }
  }
  return target
}

// ── 概念笔记 ────────────────────────────────────────────────
// payload: { id, title, titleEn?, status, sourceWeek?, maturity?, slug?, tags?[], parent?, relationText?, oneLine?, takeaway?[], frameworkNote? }
export async function writeConcept(vault, p) {
  await ensureDirs(vault)
  const file = await resolveFileName(conceptsDir(vault), safeFileName(p.title, p.id), p.id, 'aicc-id')
  const frontmatter = {
    'aicc-id': p.id,
    title: p.title,
    'title-en': p.titleEn,
    status: p.status,
    'source-week': p.sourceWeek,
    maturity: typeof p.maturity === 'number' ? p.maturity : undefined,
    slug: p.slug,
    tags: Array.isArray(p.tags) ? p.tags : undefined,
    parent: p.parent,
    'relation-text': p.relationText,
    'one-line': p.oneLine,
  }
  const lines = []
  if (p.oneLine) lines.push(`> ${p.oneLine}`, '')
  if (p.frameworkNote) lines.push(p.frameworkNote, '')
  if (Array.isArray(p.takeaway) && p.takeaway.length) {
    lines.push('## 要点', ...p.takeaway.map((t) => `- ${t}`), '')
  }
  if (p.parent) lines.push('## 关联', `- [[${safeFileName(p.parent, p.parent)}]]${p.relationText ? ` — ${p.relationText}` : ''}`, '')
  await writeFile(join(conceptsDir(vault), file), compose(frontmatter, lines.join('\n')), 'utf8')
  return file
}

// ── 成稿 ────────────────────────────────────────────────────
// payload: { slug, title, subtitle?, category?, date?, status?, tags?[], conceptIds?[], conceptLinks?[], markdown }
export async function writeArticle(vault, p) {
  await ensureDirs(vault)
  const file = await resolveFileName(articlesDir(vault), safeFileName(p.slug, p.slug), p.slug, 'slug')
  const parsed = parse(p.markdown || '')   // 去掉作者自带 frontmatter，统一用 vault frontmatter
  const frontmatter = {
    slug: p.slug,
    title: p.title || parsed.frontmatter.title,
    subtitle: p.subtitle,
    category: p.category,
    date: p.date,
    status: p.status,
    tags: Array.isArray(p.tags) ? p.tags : undefined,
    'concept-ids': Array.isArray(p.conceptIds) && p.conceptIds.length ? p.conceptIds : undefined,
  }
  // 幂等：剥掉文末旧「## 融合」段再重写（app 生成段，避免 write→read→write 叠加）
  let body = parsed.body.replace(/\n*##\s*融合\s*\n[\s\S]*$/, '').trimEnd()
  const links = (p.conceptLinks || []).filter(Boolean)
  if (links.length) body += `\n\n## 融合\n${links.map((t) => `- [[${safeFileName(t, t)}]]`).join('\n')}\n`
  await writeFile(join(articlesDir(vault), file), compose(frontmatter, body), 'utf8')
  return file
}

// ── 读取（hydrate 用）──────────────────────────────────────
async function readDirMd(dir) {
  let names = []
  try { names = (await readdir(dir)).filter((n) => n.endsWith('.md')) } catch { return [] }
  const out = []
  for (const n of names) {
    try { out.push({ file: n, ...parse(await readFile(join(dir, n), 'utf8')) }) } catch { /* skip 坏文件 */ }
  }
  return out
}

export async function listConcepts(vault) {
  const items = await readDirMd(conceptsDir(vault))
  const list = items
    .map(({ file, frontmatter: f }) => ({
      file,
      id: f['aicc-id'] || file.replace(/\.md$/, ''),
      title: f.title || file.replace(/\.md$/, ''),
      titleEn: f['title-en'],
      status: f.status,
      sourceWeek: f['source-week'],
      maturity: f.maturity,
      slug: f.slug,
      tags: Array.isArray(f.tags) ? f.tags : (f.tags ? [f.tags] : []),
      parent: f.parent,
      relationText: f['relation-text'],
      oneLine: f['one-line'],
    }))
    .filter((c) => c.id)
  // 防御性按 id 去重（正常已由 resolveFileName 清孤儿；万一残留也不让 hydrate 读到重复）
  const seen = new Set()
  return list.filter((c) => !seen.has(c.id) && seen.add(c.id))
}

export async function listArticles(vault) {
  const items = await readDirMd(articlesDir(vault))
  return items.map(({ file, frontmatter: f, body }) => ({
    file,
    slug: f.slug || file.replace(/\.md$/, ''),
    title: f.title || file.replace(/\.md$/, ''),
    subtitle: f.subtitle,
    category: f.category,
    date: f.date,
    status: f.status,
    tags: Array.isArray(f.tags) ? f.tags : (f.tags ? [f.tags] : []),
    conceptIds: Array.isArray(f['concept-ids']) ? f['concept-ids'] : [],
    body,
  }))
}

// ── 费曼笔记（完整工作记录，JSON 无损存档；可恢复闭环资产/素材）──────
export async function writeNote(vault, note) {
  if (!note || !note.id) throw new Error('note.id required')
  await mkdir(notesDir(vault), { recursive: true })
  const file = `${safeFileName(note.id, note.id)}.json`
  await writeFile(join(notesDir(vault), file), JSON.stringify(note, null, 2), 'utf8')
  return file
}
export async function listNotes(vault) {
  let names = []
  try { names = (await readdir(notesDir(vault))).filter((n) => n.endsWith('.json')) } catch { return [] }
  const out = []
  for (const n of names) {
    try { out.push(JSON.parse(await readFile(join(notesDir(vault), n), 'utf8'))) } catch { /* skip 坏文件 */ }
  }
  return out
}
export async function deleteNote(vault, id) {
  if (!id) return false
  try { await unlink(join(notesDir(vault), `${safeFileName(id, id)}.json`)); return true } catch { return false }
}

// ── 创作草稿（in-progress 正文；topicId 作文件名）────────────────────
export async function writeDraft(vault, topicId, body) {
  if (!topicId) throw new Error('topicId required')
  await mkdir(draftsDir(vault), { recursive: true })
  const file = `${safeFileName(topicId, topicId)}.md`
  await writeFile(join(draftsDir(vault), file), String(body ?? ''), 'utf8')
  return file
}
export async function listDrafts(vault) {
  let names = []
  try { names = (await readdir(draftsDir(vault))).filter((n) => n.endsWith('.md')) } catch { return {} }
  const out = {}
  for (const n of names) {
    try { out[n.replace(/\.md$/, '')] = await readFile(join(draftsDir(vault), n), 'utf8') } catch { /* skip */ }
  }
  return out
}
export async function deleteDraft(vault, topicId) {
  if (!topicId) return false
  try { await unlink(join(draftsDir(vault), `${safeFileName(topicId, topicId)}.md`)); return true } catch { return false }
}

export async function vaultStatus(vault) {
  const [c, a, n, d] = await Promise.all([listConcepts(vault), listArticles(vault), listNotes(vault), listDrafts(vault)])
  return { configured: true, dir: vault, concepts: c.length, articles: a.length, notes: n.length, drafts: Object.keys(d).length }
}
