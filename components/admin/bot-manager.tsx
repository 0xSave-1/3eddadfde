"use client"

import { useState, useTransition } from "react"
import { Bot, ChevronDown, Loader2, Plus, Radio, Send, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  createMirrorBot,
  deleteMirrorBot,
  getBotOverview,
  registerBotWebhook,
  sendBotBroadcast,
  toggleMirrorBot,
  updateBotCommands,
  updateBotProfile,
} from "@/app/actions/admin-bots"

interface BotOverview {
  botUsername: string | null
  webhookUrl: string | null
  pendingUpdates: number
  name: string
  description: string
  commands: { command: string; description: string }[]
}

interface MirrorBot {
  id: number
  label: string
  botToken: string
  isActive: boolean
  isPrimary: boolean
}

export function BotManager({ primaryOverview, mirrors }: { primaryOverview: BotOverview; mirrors: MirrorBot[] }) {
  return (
    <div className="mt-5 flex flex-col gap-6">
      <section>
        <h2 className="mb-2 flex items-center gap-1.5 font-sans text-sm font-semibold text-foreground">
          <Bot className="size-4 text-primary" aria-hidden="true" />
          Primary bot
        </h2>
        <BotControlPanel overview={primaryOverview} />
      </section>

      <section>
        <h2 className="mb-2 font-sans text-sm font-semibold text-foreground">Mirror bots</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Separate @BotFather tokens that all serve the same shop and catalog.
        </p>
        <MirrorBotList mirrors={mirrors} />
      </section>
    </div>
  )
}

function BotControlPanel({ overview, token }: { overview: BotOverview; token?: string }) {
  const [data, setData] = useState(overview)
  const [name, setName] = useState(overview.name)
  const [description, setDescription] = useState(overview.description)
  const [commandsText, setCommandsText] = useState(
    overview.commands.map((c) => `${c.command} - ${c.description}`).join("\n"),
  )
  const [broadcastMessage, setBroadcastMessage] = useState("")
  const [broadcastResult, setBroadcastResult] = useState<{ sent: number; failed: number } | null>(null)
  const [pending, startTransition] = useTransition()
  const [savedField, setSavedField] = useState<string | null>(null)

  function refresh() {
    startTransition(async () => {
      const fresh = await getBotOverview(token)
      setData(fresh)
    })
  }

  function handleRegisterWebhook() {
    startTransition(async () => {
      const fresh = await registerBotWebhook(token)
      setData(fresh)
      setSavedField("webhook")
    })
  }

  function handleSaveProfile() {
    startTransition(async () => {
      await updateBotProfile(name, description, token)
      setSavedField("profile")
    })
  }

  function handleSaveCommands() {
    const commands = commandsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [command, ...rest] = line.split("-").map((s) => s.trim())
        return { command: command.replace(/^\//, ""), description: rest.join("-") || command }
      })
    startTransition(async () => {
      await updateBotCommands(commands, token)
      setSavedField("commands")
    })
  }

  function handleBroadcast() {
    startTransition(async () => {
      const result = await sendBotBroadcast(broadcastMessage, token)
      setBroadcastResult(result)
      setBroadcastMessage("")
    })
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">{data.botUsername ? `@${data.botUsername}` : "Not connected"}</p>
          <p className="text-[11px] text-muted-foreground">
            {data.webhookUrl ? "Webhook registered — bot is live" : "Webhook not registered"}
          </p>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={handleRegisterWebhook} disabled={pending}>
          {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <Radio className="mr-1.5 size-3.5" aria-hidden="true" />}
          {data.webhookUrl ? "Re-register" : "Register webhook"}
        </Button>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <Label className="text-xs">Broadcast to all users</Label>
        <Textarea
          value={broadcastMessage}
          onChange={(e) => setBroadcastMessage(e.target.value)}
          placeholder="Announce a sale, new products, or news…"
          rows={3}
        />
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" onClick={handleBroadcast} disabled={pending || !broadcastMessage.trim()}>
            <Send className="mr-1.5 size-3.5" aria-hidden="true" />
            Send broadcast
          </Button>
          {broadcastResult && (
            <span className="text-xs text-muted-foreground">
              Sent to {broadcastResult.sent}, failed {broadcastResult.failed}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <Label className="text-xs">Bot name & description</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bot display name" />
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Shown on the bot's profile" rows={2} />
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={handleSaveProfile} disabled={pending}>
            Save profile
          </Button>
          {savedField === "profile" && <span className="text-xs text-success">Saved</span>}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <Label className="text-xs">Command menu (one per line: /command - description)</Label>
        <Textarea
          value={commandsText}
          onChange={(e) => setCommandsText(e.target.value)}
          placeholder={"start - Open the shop\nreferral - Get your referral link"}
          rows={4}
          className="font-mono text-xs"
        />
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={handleSaveCommands} disabled={pending}>
            Save commands
          </Button>
          {savedField === "commands" && <span className="text-xs text-success">Saved</span>}
          <Button type="button" size="sm" variant="ghost" onClick={refresh} disabled={pending}>
            Refresh
          </Button>
        </div>
      </div>
    </div>
  )
}

function MirrorBotList({ mirrors }: { mirrors: MirrorBot[] }) {
  const [items, setItems] = useState(mirrors)
  const [label, setLabel] = useState("")
  const [token, setToken] = useState("")
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [overviews, setOverviews] = useState<Record<number, BotOverview>>({})
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleAdd() {
    if (!label.trim() || !token.trim()) {
      setError("Label and token are required")
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        const created = await createMirrorBot(label, token)
        setItems((prev) => [...prev, created])
        setLabel("")
        setToken("")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add bot")
      }
    })
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      await deleteMirrorBot(id)
      setItems((prev) => prev.filter((m) => m.id !== id))
    })
  }

  function handleToggle(id: number, isActive: boolean) {
    startTransition(async () => {
      await toggleMirrorBot(id, isActive)
      setItems((prev) => prev.map((m) => (m.id === id ? { ...m, isActive } : m)))
    })
  }

  async function handleExpand(mirror: MirrorBot) {
    if (expandedId === mirror.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(mirror.id)
    if (!overviews[mirror.id]) {
      const overview = await getBotOverview(mirror.botToken)
      setOverviews((prev) => ({ ...prev, [mirror.id]: overview }))
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {items.map((mirror) => (
          <li key={mirror.id} className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between gap-2 p-3">
              <button
                type="button"
                onClick={() => handleExpand(mirror)}
                className="flex flex-1 items-center gap-2 text-left"
              >
                <ChevronDown
                  className={`size-4 shrink-0 text-muted-foreground transition-transform ${expandedId === mirror.id ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-foreground">{mirror.label}</span>
                {!mirror.isActive && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Disabled</span>}
              </button>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button type="button" size="sm" variant="ghost" onClick={() => handleToggle(mirror.id, !mirror.isActive)} disabled={pending}>
                  {mirror.isActive ? "Disable" : "Enable"}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => handleDelete(mirror.id)} disabled={pending} aria-label={`Remove ${mirror.label}`}>
                  <Trash2 className="size-3.5 text-destructive" aria-hidden="true" />
                </Button>
              </div>
            </div>
            {expandedId === mirror.id && (
              <div className="border-t border-border p-3">
                {overviews[mirror.id] ? (
                  <BotControlPanel overview={overviews[mirror.id]} token={mirror.botToken} />
                ) : (
                  <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Loading…
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
        {items.length === 0 && <li className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No mirror bots yet.</li>}
      </ul>

      <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-3">
        <Label className="text-xs">Add a mirror bot</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label, e.g. Backup bot" />
        <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Bot token from @BotFather" className="font-mono text-xs" />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button type="button" size="sm" onClick={handleAdd} disabled={pending}>
          <Plus className="mr-1.5 size-3.5" aria-hidden="true" />
          Add mirror bot
        </Button>
      </div>
    </div>
  )
}
