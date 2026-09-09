import "server-only"

import crypto from "node:crypto"

export type TelegramMiniAppUser = {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

type TelegramInitData = {
  authDate: number
  user: TelegramMiniAppUser
}

const SESSION_COOKIE = "nexora_telegram_session"
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

function getBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured")
  return token
}

function getSessionSecret() {
  const secret = process.env.TELEGRAM_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new Error("TELEGRAM_SESSION_SECRET is not configured")
  return secret
}

function hmac(value: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("hex")
}

/** Verify Telegram's signed WebApp initData on the server. Never trust initDataUnsafe. */
export function verifyTelegramInitData(initData: string): TelegramInitData | null {
  const params = new URLSearchParams(initData)
  const receivedHash = params.get("hash")
  const authDate = Number(params.get("auth_date"))
  const userRaw = params.get("user")
  if (!receivedHash || !authDate || !userRaw) return null

  const maxAge = Number(process.env.TELEGRAM_INIT_DATA_MAX_AGE_SECONDS ?? 86_400)
  if (!Number.isFinite(maxAge) || Date.now() / 1000 - authDate > maxAge) return null

  params.delete("hash")
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(getBotToken()).digest()
  const expectedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex")

  const received = Buffer.from(receivedHash, "hex")
  const expected = Buffer.from(expectedHash, "hex")
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return null

  try {
    const user = JSON.parse(userRaw) as TelegramMiniAppUser
    if (!Number.isSafeInteger(user.id) || !user.first_name) return null
    return { authDate, user }
  } catch {
    return null
  }
}

export function createTelegramSession(telegramId: number) {
  const payload = Buffer.from(
    JSON.stringify({ telegramId, exp: Date.now() + SESSION_TTL_SECONDS * 1000 }),
  ).toString("base64url")
  return `${payload}.${hmac(payload)}`
}

export function getTelegramIdFromSession(token: string | undefined) {
  if (!token) return null
  const [payload, signature] = token.split(".")
  if (!payload || !signature) return null
  const expected = hmac(payload)
  const actual = Buffer.from(signature, "hex")
  const expectedBuffer = Buffer.from(expected, "hex")
  if (actual.length !== expectedBuffer.length || !crypto.timingSafeEqual(actual, expectedBuffer)) return null
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { telegramId?: unknown; exp?: unknown }
    if (!Number.isSafeInteger(parsed.telegramId) || typeof parsed.exp !== "number" || parsed.exp < Date.now()) return null
    return parsed.telegramId
  } catch {
    return null
  }
}

export const telegramSessionCookie = {
  name: SESSION_COOKIE,
  maxAge: SESSION_TTL_SECONDS,
}
