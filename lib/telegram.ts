import "server-only"

import { createHash } from "node:crypto"

const API_BASE = "https://api.telegram.org"

function getToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured")
  return token
}

async function callTelegramApi<T = unknown>(method: string, body?: Record<string, unknown>, tokenOverride?: string) {
  const token = tokenOverride ?? getToken()
  const res = await fetch(`${API_BASE}/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
    cache: "no-store",
  })
  const data = await res.json()
  if (!data.ok) throw new Error(data.description ?? `Telegram API error calling ${method}`)
  return data.result as T
}

/**
 * Deterministic secret derived from a bot token so the webhook route can
 * verify inbound requests without needing a separate stored secret per bot.
 */
export function getWebhookSecret(token?: string) {
  return createHash("sha256").update(token ?? getToken()).digest("hex").slice(0, 32)
}

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options?: { buttonText?: string; buttonUrl?: string; token?: string },
) {
  const reply_markup = options?.buttonUrl
    ? { inline_keyboard: [[{ text: options.buttonText ?? "Open", url: options.buttonUrl }]] }
    : undefined

  return callTelegramApi(
    "sendMessage",
    {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup,
    },
    options?.token,
  )
}

export async function setTelegramWebhook(url: string, token?: string) {
  return callTelegramApi<boolean>(
    "setWebhook",
    {
      url,
      secret_token: getWebhookSecret(token),
      drop_pending_updates: false,
    },
    token,
  )
}

interface TelegramMe {
  id: number
  username: string
  first_name: string
}

const meCache = new Map<string, TelegramMe>()
export async function getTelegramBotInfo(token?: string) {
  const key = token ?? "default"
  if (meCache.has(key)) return meCache.get(key)!
  const me = await callTelegramApi<TelegramMe>("getMe", undefined, token)
  meCache.set(key, me)
  return me
}

interface WebhookInfo {
  url: string
  has_custom_certificate: boolean
  pending_update_count: number
}
export async function getTelegramWebhookInfo(token?: string) {
  return callTelegramApi<WebhookInfo>("getWebhookInfo", undefined, token)
}

export async function setBotProfile(name: string, description: string, token?: string) {
  await callTelegramApi("setMyName", { name }, token)
  await callTelegramApi("setMyDescription", { description }, token)
}

export async function getBotProfile(token?: string) {
  const [name, description] = await Promise.all([
    callTelegramApi<{ name: string }>("getMyName", undefined, token),
    callTelegramApi<{ description: string }>("getMyDescription", undefined, token),
  ])
  return { name: name.name, description: description.description }
}

export async function setBotCommands(commands: { command: string; description: string }[], token?: string) {
  return callTelegramApi<boolean>("setMyCommands", { commands }, token)
}

export async function getBotCommands(token?: string) {
  return callTelegramApi<{ command: string; description: string }[]>("getMyCommands", undefined, token)
}

/**
 * Sends a broadcast message to a batch of chat IDs, throttled to stay well
 * under Telegram's ~30 messages/second limit. Returns counts so the caller
 * can report success/failure back to the admin.
 */
export async function broadcastToChatIds(chatIds: string[], text: string, token?: string) {
  let sent = 0
  let failed = 0
  for (let i = 0; i < chatIds.length; i++) {
    try {
      await callTelegramApi("sendMessage", { chat_id: chatIds[i], text, parse_mode: "HTML" }, token)
      sent++
    } catch {
      failed++
    }
    if (i % 20 === 19) await new Promise((r) => setTimeout(r, 1000))
  }
  return { sent, failed }
}
