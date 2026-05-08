import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Library, Upload, Download, Trash2, Clock, Tag, FileText, CheckCircle2, Brain } from "lucide-react"
import { loadNotes, deleteNote, clearNotes } from "../lib/storage"
import { downloadMarkdown } from "../lib/mdExport"
import { toast } from "sonner"
import type { Note } from "../types"

export function LibraryDialog({
  open,
  onOpenChange,
  onLoad,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onLoad: (n: Note) => void
}) {
  const [notes, setNotes] = useState<Note[]>([])

  useEffect(() => {
    if (open) setNotes(loadNotes())
  }, [open])

  function refresh() {
    setNotes(loadNotes())
  }

  function onDelete(id: string) {
    deleteNote(id)
    refresh()
    toast.success("已删除")
  }

  function onClearAll() {
    if (!confirm("确定清空全部笔记？此操作不可撤销")) return
    clearNotes()
    refresh()
    toast.success("已清空")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library className="h-4 w-4 text-primary" />
            笔记库
            <Badge variant="outline" className="ml-2 font-mono text-[10px]">{notes.length}</Badge>
          </DialogTitle>
          <DialogDescription>本地浏览器 localStorage · 每篇笔记包含三大步骤讲解 + 费曼内化</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={onClearAll} disabled={notes.length === 0}>
            <Trash2 className="mr-1.5 h-4 w-4" />
            清空
          </Button>
        </div>

        <ScrollArea className="flex-1 max-h-[60vh] pr-3">
          {notes.length === 0 && (
            <div className="flex flex-col items-center justify-center text-muted-foreground text-sm py-16 gap-2">
              <FileText className="h-8 w-8 opacity-40" />
              <div>笔记库空空如也，完成三大步骤讲解后点「保存到笔记库」</div>
            </div>
          )}
          <div className="space-y-3">
            {notes.map(n => {
              const steps = n.steps || []
              const confirmedCnt = steps.filter(s => s.confirmed).length
              const total = 3
              const legacyQaCnt = (n.qa || []).filter(q => q.confirmed).length
              const displayCnt = steps.length > 0 ? confirmedCnt : legacyQaCnt
              const displayTotal = steps.length > 0 ? total : (n.qa ? 6 : 3)
              const hasFeynman = !!n.feynman
              return (
                <div key={n.id} className="rounded-lg border border-border/60 bg-card/40 p-3 hover:border-primary/40 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{n.topic}</div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">{n.rawQuestion}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => { onLoad(n); onOpenChange(false) }}>
                        <Upload className="mr-1 h-3.5 w-3.5" />
                        载入
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => downloadMarkdown(n)}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onDelete(n.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(n.createdAt).toLocaleString()}</span>
                    <Badge variant="outline" className={`font-mono text-[10px] px-1.5 py-0 ${displayCnt === displayTotal && displayTotal > 0 ? "border-success/50 text-success bg-success/5" : "border-warning/40 text-warning bg-warning/5"}`}>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {steps.length > 0 ? "步骤" : "六问"} {displayCnt}/{displayTotal}
                    </Badge>
                    {hasFeynman ? (
                      <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 border-foreground/30 text-foreground bg-muted">
                        <Brain className="h-3 w-3 mr-1" />已内化
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 border-border/60 text-muted-foreground">
                        <Brain className="h-3 w-3 mr-1" />未内化
                      </Badge>
                    )}
                    {n.tags.length > 0 && (
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <Tag className="h-3 w-3" />
                        {n.tags.map((t, i) => (
                          <Badge key={i} variant="outline" className="font-mono text-[10px] px-1.5 py-0">{t}</Badge>
                        ))}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
