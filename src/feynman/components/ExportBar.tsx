import { Button } from "@/components/ui/button"
import { Download, Save, FileText, Presentation, Copy } from "lucide-react"
import { toast } from "sonner"
import type { Note } from "../types"
import { addNote } from "../lib/storage"
import { downloadMarkdown, toMarkdown, toSpeechScript, toPptBullets } from "../lib/mdExport"

export function ExportBar({
  note,
  onSaved,
}: {
  note: Note
  onSaved?: () => void
}) {
  function onSave() {
    addNote(note)
    toast.success(`已保存：${note.topic}`)
    if (onSaved) onSaved()
  }

  function onDownloadMd() {
    downloadMarkdown(note)
    toast.success("已下载 .md")
  }

  async function onCopyMd() {
    try {
      await navigator.clipboard.writeText(toMarkdown(note))
      toast.success("Markdown 已复制到剪贴板")
    } catch {
      toast.error("复制失败，请手动下载")
    }
  }

  async function onCopySpeech() {
    try {
      await navigator.clipboard.writeText(toSpeechScript(note))
      toast.success("讲稿片段已复制")
    } catch {
      toast.error("复制失败")
    }
  }

  async function onCopyPpt() {
    try {
      await navigator.clipboard.writeText(toPptBullets(note))
      toast.success("PPT 要点已复制")
    } catch {
      toast.error("复制失败")
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="glow" size="sm" onClick={onSave}>
        <Save className="mr-1.5 h-4 w-4" />
        保存到笔记库
      </Button>
      <Button variant="outline" size="sm" onClick={onDownloadMd}>
        <Download className="mr-1.5 h-4 w-4" />
        下载 .md
      </Button>
      <Button variant="outline" size="sm" onClick={onCopyMd}>
        <Copy className="mr-1.5 h-4 w-4" />
        复制 Markdown
      </Button>
      <Button variant="outline" size="sm" onClick={onCopySpeech}>
        <FileText className="mr-1.5 h-4 w-4" />
        讲稿片段
      </Button>
      <Button variant="outline" size="sm" onClick={onCopyPpt}>
        <Presentation className="mr-1.5 h-4 w-4" />
        PPT 要点
      </Button>
    </div>
  )
}
