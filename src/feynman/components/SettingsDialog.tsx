import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select"
import { toast } from "sonner"
import type { LlmConfig } from "../types"
import { loadCfg, saveCfg, DEFAULT_CFG } from "../lib/storage"
import { gatewayKeyConfigured, gatewayToken } from "@/lib/gateway"

const MODEL_OPTIONS = [
  { value: "deepseek-v4-flash", label: "deepseek-v4-flash（推荐 · 更快）" },
  { value: "deepseek-v4-pro", label: "deepseek-v4-pro（更强）" },
  { value: "qwen3.6-plus", label: "qwen3.6-plus（thinking 模式）" },
  { value: "qwen-plus", label: "qwen-plus" },
  { value: "qwen-turbo", label: "qwen-turbo（更快）" },
  { value: "qwen-max", label: "qwen-max" },
]

export function SettingsDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (v: boolean) => void; onSaved: (cfg: LlmConfig) => void }) {
  const [cfg, setCfg] = useState<LlmConfig>(DEFAULT_CFG)

  useEffect(() => {
    if (open) setCfg(loadCfg())
  }, [open])

  const gatewayMode = gatewayKeyConfigured()

  function save() {
    // gateway 模式 key 在服务端，浏览器无需填；仅旧模式强制非空
    if (!gatewayMode && !cfg.apiKey.trim()) return toast.error("API Key 不能为空（本产品需连接 LLM）")
    saveCfg(cfg)
    onSaved(cfg)
    toast.success("设置已保存")
    onOpenChange(false)
  }

  async function test() {
    toast.info("测试中…")
    try {
      if (gatewayMode) {
        // 经本地 Gateway 测试（key 在服务端，浏览器不持 key）
        const token = gatewayToken()
        const res = await fetch("/api/llm", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ model: cfg.model, messages: [{ role: "user", content: "ping" }], max_tokens: 8 }),
        })
        if (res.ok) toast.success("Gateway 连通成功 ✓")
        else toast.error(`Gateway HTTP ${res.status}`)
        return
      }
      if (!cfg.apiKey) return toast.error("请先填 API Key")
      const res = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
        body: JSON.stringify({ model: cfg.model, messages: [{ role: "user", content: "ping" }], max_tokens: 8 }),
      })
      if (res.ok) toast.success("连通成功 ✓")
      else toast.error(`HTTP ${res.status}`)
    } catch (e: any) {
      toast.error(e.message || "网络错误")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>LLM 设置</DialogTitle>
          <DialogDescription>
            {gatewayMode
              ? "本地 Gateway 已配置 key（存于服务端 server/.env），浏览器无需填写 API Key。"
              : "接入阿里云百炼 / DashScope 兼容端点。Key 仅存本地 localStorage。"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="key">API Key{gatewayMode && <span className="ml-1 text-xs text-muted-foreground">（gateway 模式可留空）</span>}</Label>
            <Input id="key" type="password" value={cfg.apiKey} onChange={e => setCfg({ ...cfg, apiKey: e.target.value })} placeholder={gatewayMode ? "已由本地 Gateway 提供，无需填写" : "sk-xxxxxxxxxxxxxx"} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="base">Base URL</Label>
            <Input id="base" value={cfg.baseUrl} onChange={e => setCfg({ ...cfg, baseUrl: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>模型</Label>
            <Select value={cfg.model} onValueChange={v => setCfg({ ...cfg, model: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODEL_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={test}>测试连通</Button>
          <Button onClick={save}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
