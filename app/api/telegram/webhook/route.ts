import { type NextRequest, NextResponse } from "next/server"
import { getWebhookSecret, sendTelegramMessage } from "@/lib/telegram"
import { getOrCreateTelegramUser, linkTelegramAccount } from "@/lib/data/referral"
import { listBotInstances } from "@/lib/data/bot-instances"

interface TelegramUpdate {
  message?: {
    chat: { id: number }
    from?: { id: number; username?: string; first_name?: string }
    text?: string
  }
}

function getAppUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin
}

/**
 * The webhook is shared by the primary bot and any mirror bots. Each bot's
 * secret token is deterministically derived from its own token, so we match
 * the incoming secret against the primary bot first and then any active
 * mirrors to find which token should be used for the reply.
 */
async function resolveBotToken(secret: string | null) {
  if (!secret) return null
  if (secret === getWebhookSecret()) return undefined // undefined = use default TELEGRAM_BOT_TOKEN
  const mirrors = await listBotInstances()
  const match = mirrors.find((m) => m.isActive && getWebhookSecret(m.botToken) === secret)
  return match ? match.botToken : null
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token")
  const tokenResult = await resolveBotToken(secret)
  if (tokenResult === null) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  const botToken = tokenResult

  const update = (await request.json()) as TelegramUpdate
  const message = update.message
  if (!message?.text || !message.from) {
    return NextResponse.json({ ok: true })
  }

  const chatId = message.chat.id
  const telegramId = String(message.from.id)
  const username = message.from.username ?? null
  const appUrl = getAppUrl(request)

  if (message.text.startsWith("/start")) {
    const payload = message.text.split(" ")[1]?.trim()

    if (payload?.startsWith("link_")) {
      // Deep link from the profile page: attach this Telegram account to an
      // existing browser visitor so order notifications can be delivered here.
      const visitorId = payload.slice("link_".length)
      await linkTelegramAccount(visitorId, telegramId, username)
      await sendTelegramMessage(
        chatId,
        `You're linked, ${message.from.first_name ?? "there"}! You'll get a message here whenever your NEXORA order is paid.`,
        { token: botToken },
      )
      return NextResponse.json({ ok: true })
    }

    // A referral code shared via t.me/<bot>?start=<code> — hand back a link
    // to the shop with the code pre-applied.
    const referralCode = payload && payload.length <= 12 ? payload : undefined
    const shopUrl = referralCode ? `${appUrl}/?ref=${referralCode}` : appUrl

    await getOrCreateTelegramUser(telegramId)
    await sendTelegramMessage(
      chatId,
      referralCode
        ? "Welcome to NEXORA! Your friend's discount link is ready — tap below to open the shop."
        : "Welcome to NEXORA! Tap below to open the shop.",
      { buttonText: "Open NEXORA", buttonUrl: shopUrl, token: botToken },
    )
    return NextResponse.json({ ok: true })
  }

  await sendTelegramMessage(chatId, "Send /start to open the NEXORA shop.", { token: botToken })
  return NextResponse.json({ ok: true })
}
