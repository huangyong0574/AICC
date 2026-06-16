import type { RadarWeek } from '../../data/radarData'

/**
 * 速览层：本周视频精选 / AI 公司技术动态 / 热门新闻。
 * 数据由外部 HTML 经 parse-radar-html 解析而来，均为可选——无数据则不渲染对应区块。
 * 与「深度认知点」（可加入计划→费曼）互补：速览层是只读情报，认知点是可学习入口。
 */
export function RadarBriefing({ week }: { week: RadarWeek }) {
  const videos = week.videos ?? []
  const companies = week.companies ?? []
  const news = week.news ?? []
  if (!videos.length && !companies.length && !news.length) return null

  return (
    <div className="mt-12 space-y-12">
      {videos.length > 0 && (
        <section id="videos">
          <div className="flex items-end justify-between gap-4 mb-3.5">
            <h2 className="text-xl font-semibold tracking-tight">本周视频精选</h2>
            <span className="font-mono text-[12px] text-muted-foreground">按可抓取播放量排序</span>
          </div>
          <div className="grid gap-2">
            {videos.map((v, i) => (
              <a
                key={i}
                href={v.url}
                target="_blank"
                rel="noreferrer"
                className="grid sm:grid-cols-[56px_1fr_auto] gap-1.5 sm:gap-3 sm:items-center border border-border rounded-lg bg-card p-3 hover:bg-secondary/50 transition-colors"
              >
                <span className="font-mono text-[11px] text-muted-foreground border border-border rounded-full px-2 py-0.5 w-fit">
                  #{v.rank ?? i + 1}
                </span>
                <div className="min-w-0">
                  <div className="font-semibold text-[14px] leading-snug">{v.title}</div>
                  <div className="text-[12px] text-muted-foreground mt-0.5">{v.channel}</div>
                  {v.note && <div className="text-[12px] text-muted-foreground mt-1">{v.note}</div>}
                </div>
                {v.views && (
                  <span className="font-mono text-[11px] text-muted-foreground sm:justify-self-end whitespace-nowrap">
                    {v.views}
                  </span>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {companies.length > 0 && (
        <section id="companies">
          <div className="flex items-end justify-between gap-4 mb-3.5">
            <h2 className="text-xl font-semibold tracking-tight">AI 公司技术动态</h2>
            <span className="font-mono text-[12px] text-muted-foreground">官方来源优先</span>
          </div>
          <div className="overflow-auto border border-border rounded-lg bg-card">
            <table className="w-full border-collapse min-w-[760px]">
              <thead>
                <tr>
                  {['#', '公司', '标题', '类型', '新概念', '摘要', '来源'].map((h) => (
                    <th
                      key={h}
                      className="text-left font-mono text-[11px] text-muted-foreground bg-secondary/40 px-3 py-2.5 border-b border-border font-normal"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {companies.map((c, i) => (
                  <tr key={i} className="align-top">
                    <td className="px-3 py-2.5 border-b border-border text-[13px] font-mono text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2.5 border-b border-border text-[13px] font-medium whitespace-nowrap">{c.org}</td>
                    <td className="px-3 py-2.5 border-b border-border text-[13px]">{c.title}</td>
                    <td className="px-3 py-2.5 border-b border-border text-[13px] whitespace-nowrap">{c.type}</td>
                    <td className="px-3 py-2.5 border-b border-border text-[13px]">{c.concept}</td>
                    <td className="px-3 py-2.5 border-b border-border text-[13px] text-muted-foreground">{c.summary}</td>
                    <td className="px-3 py-2.5 border-b border-border text-[13px] whitespace-nowrap">
                      {c.url && (
                        <a href={c.url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">
                          原文
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {news.length > 0 && (
        <section id="news">
          <div className="flex items-end justify-between gap-4 mb-3.5">
            <h2 className="text-xl font-semibold tracking-tight">热门 AI 新闻推荐</h2>
            <span className="font-mono text-[12px] text-muted-foreground">中英文混合</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {news.map((n, i) => (
              <a
                key={i}
                href={n.url}
                target="_blank"
                rel="noreferrer"
                className="border border-border rounded-lg bg-card p-3.5 hover:bg-secondary/50 transition-colors"
              >
                <span className="font-mono text-[11px] text-muted-foreground border border-border rounded-full px-2 py-0.5">
                  {n.source}
                </span>
                <h3 className="text-[15px] leading-snug font-semibold my-1.5">{n.title}</h3>
                {n.summary && <p className="text-[13px] text-muted-foreground">{n.summary}</p>}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
