import { NextResponse } from "next/server"
import { createTelegramSession, telegramSessionCookie, verifyTelegramInitData } from "@/lib/telegram-mini-app"

export async function POST(request: Request) {
  let initData = ""
  try {
    const body = (await request.json()) as { initData?: unknown }
    initData = typeof body.initData === "string" ? body.initData : ""
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 })
  }

  const verified = verifyTelegramInitData(initData)
  if (!verified) return NextResponse.json({ ok: false, error: "Invalid Telegram session" }, { status: 401 })

  const response = NextResponse.json({
    ok: true,
    user: {
      id: verified.user.id,
      firstName: verified.user.first_name,
      username: verified.user.username ?? null,
    },
  })
  response.cookies.set(telegramSessionCookie.name, createTelegramSession(verified.user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: telegramSessionCookie.maxAge,
  })
  return response
}
