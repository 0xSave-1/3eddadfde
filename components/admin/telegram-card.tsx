"use client"

import { useState, useTransition } from "react"
import { Send, CheckCircle2, XCircle } from "lucide-react"
import { registerTelegramWebhook } from "@/app/actions/admin-telegram"

interface TelegramCardProps {
  initialBotUsername: string | null
  initialWebhookUrl: string | null
}

export function TelegramCard({ initialBotUsername, initialWebhookUrl }: TelegramCardProps) {
  const [botUsername, setBotUsername] = useState(initialBotUsername)
  const [webhookUrl, setWebhookUrl] = useState(initialWebhookUrl)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const connected = Boolean(botUsername && webhookUrl)

  const handleRegister = () => {
    setError(null)
    startTransition(async () => {
      try {
        const status = await registerTelegramWebhook()
        setBotUsername(status.botUsername)
        setWebhookUrl(status.webhookUrl)
      } catch {
        setError("Could not reach Telegram. Check TELEGRAM_BOT_TOKEN.")
      }
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {connected ? (
            <CheckCircle2 className="size-4 text-emerald-500" />
          ) : (
            <XCircle className="size-4 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-semibold text-foreground">
              {botUsername ? `@${botUsername}` : "Telegram bot"}
            </p>
            <p className="text-xs text-muted-foreground">
              {connected ? "Webhook registered — bot is live" : "Webhook not registered yet"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRegister}
          disabled={isPending}
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
        >
          <Send className="size-3.5" />
          {isPending ? "Registering…" : connected ? "Re-register" : "Register webhook"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  )
}
