import Link from "next/link"
import { ChevronRight, Receipt, Wallet, Settings, LifeBuoy } from "lucide-react"
import { ShopShell } from "@/components/shop/shell"
import { getWallet } from "@/lib/data/wallet"
import { getOrdersForVisitor } from "@/lib/data/orders"
import { getOrCreateTelegramUser, getReferralStats, getTelegramChatId } from "@/lib/data/referral"
import { getVisitorId } from "@/lib/visitor"
import { getTelegramBotInfo } from "@/lib/telegram"
import { ReferralCard } from "@/components/profile/referral-card"
import { TelegramLinkCard } from "@/components/profile/telegram-link-card"
import { formatCents } from "@/lib/format"

const MENU = [
  { href: "/orders", label: "My Orders", icon: Receipt },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/profile", label: "Settings", icon: Settings },
  { href: "/profile", label: "Support", icon: LifeBuoy },
]

export default async function ProfilePage() {
  const visitorId = await getVisitorId()
  await getOrCreateTelegramUser(visitorId)
  const [wallet, stats, referral, telegramChatId, botInfo] = await Promise.all([
    getWallet(visitorId),
    getOrdersForVisitor(visitorId),
    getReferralStats(visitorId),
    getTelegramChatId(visitorId),
    getTelegramBotInfo().catch(() => null),
  ])

  return (
    <ShopShell>
      <header className="flex items-center gap-3 px-4 py-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/15 text-lg font-bold text-primary">
          N
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Nexora User</p>
          <p className="text-xs text-muted-foreground">Member since this session</p>
        </div>
      </header>

      <div className="mx-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-3.5">
          <p className="text-[11px] text-muted-foreground">Wallet balance</p>
          <p className="mt-1 text-lg font-bold text-foreground">{formatCents(wallet.balanceCents)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5">
          <p className="text-[11px] text-muted-foreground">Total orders</p>
          <p className="mt-1 text-lg font-bold text-foreground">{stats.length}</p>
        </div>
      </div>

      <ReferralCard
        referralCode={referral.referralCode}
        totalReferred={referral.totalReferred}
        totalEarnedCents={referral.totalEarnedCents}
      />

      <TelegramLinkCard visitorId={visitorId} botUsername={botInfo?.username ?? null} linked={Boolean(telegramChatId)} />

      <nav className="mx-4 mt-5 flex flex-col overflow-hidden rounded-xl border border-border bg-card">
        {MENU.map(({ href, label, icon: Icon }, index) => (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-3 px-4 py-3.5 text-sm text-foreground ${
              index !== 0 ? "border-t border-border" : ""
            }`}
          >
            <Icon className="size-4 text-muted-foreground" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        ))}
      </nav>
    </ShopShell>
  )
}
