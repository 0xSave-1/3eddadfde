"use client"

import { Send } from "lucide-react"

interface TelegramLinkCardProps {
  visitorId: string
  botUsername: string | null
  linked: boolean
}

export function TelegramLinkCard({ visitorId, botUsername, linked }: TelegramLinkCardProps) {
  if (!botUsername) return null

  const deepLink = `https://t.me/${botUsername}?start=link_${visitorId}`

  return (
    <div className="mx-4 mt-5 flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Send className="size-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">Telegram notifications</p>
        <p className="text-xs text-muted-foreground">
          {linked ? "Connected — you'll get order updates in Telegram." : "Get notified in Telegram when your order is paid."}
        </p>
      </div>
      {!linked && (
        <a
          href={deepLink}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          Connect
        </a>
      )}
    </div>
  )
}
