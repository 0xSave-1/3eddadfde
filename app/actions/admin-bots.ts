"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { requirePermission } from "@/lib/admin-auth"
import { logAdminAction } from "@/lib/audit"
import {
  broadcastToChatIds,
  getBotCommands,
  getBotProfile,
  getTelegramBotInfo,
  getTelegramWebhookInfo,
  setBotCommands,
  setBotProfile,
  setTelegramWebhook,
} from "@/lib/telegram"
import { addBotInstance, getAllTelegramChatIds, listBotInstances, removeBotInstance, setBotInstanceActive } from "@/lib/data/bot-instances"

export async function getBotOverview(token?: string) {
  await requirePermission("bots.manage")
  try {
    const [me, webhook, profile, commands] = await Promise.all([
      getTelegramBotInfo(token),
      getTelegramWebhookInfo(token),
      getBotProfile(token).catch(() => ({ name: "", description: "" })),
      getBotCommands(token).catch(() => []),
    ])
    return {
      botUsername: me.username,
      webhookUrl: webhook.url || null,
      pendingUpdates: webhook.pending_update_count,
      name: profile.name,
      description: profile.description,
      commands,
    }
  } catch {
    return { botUsername: null, webhookUrl: null, pendingUpdates: 0, name: "", description: "", commands: [] }
  }
}

export async function registerBotWebhook(token?: string) {
  const session = await requirePermission("bots.manage")
  const headerList = await headers()
  const host = headerList.get("host")
  const proto = headerList.get("x-forwarded-proto") ?? "https"
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? `${proto}://${host}`

  await setTelegramWebhook(`${origin}/api/telegram/webhook`, token)
  await logAdminAction(session, "bot.register_webhook", { metadata: { origin, mirrored: Boolean(token) } })
  return getBotOverview(token)
}

export async function updateBotProfile(name: string, description: string, token?: string) {
  const session = await requirePermission("bots.manage")
  await setBotProfile(name, description, token)
  await logAdminAction(session, "bot.update_profile", { metadata: { name, mirrored: Boolean(token) } })
  return getBotOverview(token)
}

export async function updateBotCommands(commands: { command: string; description: string }[], token?: string) {
  const session = await requirePermission("bots.manage")
  await setBotCommands(commands, token)
  await logAdminAction(session, "bot.update_commands", { metadata: { count: commands.length, mirrored: Boolean(token) } })
  return getBotOverview(token)
}

export async function sendBotBroadcast(message: string, token?: string) {
  const session = await requirePermission("bots.manage")
  if (!message.trim()) throw new Error("Message can't be empty")
  const chatIds = await getAllTelegramChatIds()
  const result = await broadcastToChatIds(chatIds, message, token)
  await logAdminAction(session, "bot.broadcast", { metadata: { ...result, totalRecipients: chatIds.length } })
  return result
}

export async function listMirrorBots() {
  await requirePermission("bots.manage")
  return listBotInstances()
}

export async function createMirrorBot(label: string, botToken: string) {
  const session = await requirePermission("bots.manage")
  if (!label.trim() || !botToken.trim()) throw new Error("Label and token are required")
  const created = await addBotInstance(label.trim(), botToken.trim())
  await logAdminAction(session, "bot.mirror.create", { targetId: created.id, metadata: { label } })
  revalidatePath("/admin/bots")
  return created
}

export async function deleteMirrorBot(id: number) {
  const session = await requirePermission("bots.manage")
  await removeBotInstance(id)
  await logAdminAction(session, "bot.mirror.delete", { targetId: id })
  revalidatePath("/admin/bots")
}

export async function toggleMirrorBot(id: number, isActive: boolean) {
  const session = await requirePermission("bots.manage")
  await setBotInstanceActive(id, isActive)
  await logAdminAction(session, isActive ? "bot.mirror.enable" : "bot.mirror.disable", { targetId: id })
  revalidatePath("/admin/bots")
}
