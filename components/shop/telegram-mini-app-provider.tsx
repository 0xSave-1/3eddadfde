"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

type TelegramWebApp = {
  initData: string
  ready: () => void
  expand: () => void
  setHeaderColor?: (color: string) => void
  setBackgroundColor?: (color: string) => void
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp }
  }
}

/** Boots Telegram's native viewport and exchanges signed initData for an httpOnly app session. */
export function TelegramMiniAppProvider() {
  const router = useRouter()

  useEffect(() => {
    const webApp = window.Telegram?.WebApp
    if (!webApp) return

    webApp.ready()
    webApp.expand()
    webApp.setHeaderColor?.("#141820")
    webApp.setBackgroundColor?.("#141820")

    if (!webApp.initData) return
    fetch("/api/telegram/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ initData: webApp.initData }),
    })
      .then((response) => (response.ok ? router.refresh() : undefined))
      .catch(() => undefined)
  }, [router])

  return null
}
