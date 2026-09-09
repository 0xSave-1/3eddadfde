"use server"

import { headers } from "next/headers"
import { requirePermission } from "@/lib/admin-auth"
import { logAdminAction } from "@/lib/audit"
import { getTelegramBotInfo, getTelegramWebhookInfo, setTelegramWebhook } from "@/lib/telegram"

export async function getTelegramStatus() {
  await requirePermission("telegram.manage")
  try {
    const [me, webhook] = await Promise.all([getTelegramBotInfo(), getTelegramWebhookInfo()])
    return { botUsername: me.username, webhookUrl: webhook.url || null, pendingUpdates: webhook.pending_update_count }
  } catch {
    return { botUsername: null, webhookUrl: null, pendingUpdates: 0 }
  }
}

export async function registerTelegramWebhook() {
  const session = await requirePermission("telegram.manage")
  const headerList = await headers()
  const host = headerList.get("host")
  const proto = headerList.get("x-forwarded-proto") ?? "https"
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? `${proto}://${host}`

  await setTelegramWebhook(`${origin}/api/telegram/webhook`)
  await logAdminAction(session, "telegram.register_webhook", { metadata: { origin } })
  return getTelegramStatus()
}
