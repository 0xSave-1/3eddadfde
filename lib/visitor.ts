import "server-only"

import { cookies } from "next/headers"
import { randomUUID } from "node:crypto"
import { getTelegramIdFromSession, telegramSessionCookie } from "@/lib/telegram-mini-app"

const COOKIE_NAME = "nexora_visitor"

export async function getOrCreateVisitorId() {
  const cookieStore = await cookies()
  const telegramId = getTelegramIdFromSession(cookieStore.get(telegramSessionCookie.name)?.value)
  if (telegramId) return `tg_${telegramId}`
  const existing = cookieStore.get(COOKIE_NAME)?.value
  if (existing) return existing

  const visitorId = randomUUID()
  cookieStore.set(COOKIE_NAME, visitorId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  })
  return visitorId
}

export async function peekVisitorId() {
  const cookieStore = await cookies()
  const telegramId = getTelegramIdFromSession(cookieStore.get(telegramSessionCookie.name)?.value)
  if (telegramId) return `tg_${telegramId}`
  return cookieStore.get(COOKIE_NAME)?.value ?? null
}

/**
 * Read-only visitor id lookup for Server Components, which cannot call
 * cookies().set(). Middleware guarantees the cookie is already present by
 * the time any page renders, so this only falls back to a fresh id (not
 * persisted) in the unlikely case the cookie is still missing.
 */
export async function getVisitorId() {
  const existing = await peekVisitorId()
  return existing ?? randomUUID()
}
