import Link from "next/link"
import { CartButton } from "@/components/shop/cart-button"
import { getWallet } from "@/lib/data/wallet"
import { formatCentsShort } from "@/lib/format"
import { getVisitorId } from "@/lib/visitor"

export async function TopHeader({ title }: { title?: string }) {
  const visitorId = await getVisitorId()
  const wallet = await getWallet(visitorId)

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 supports-backdrop-filter:backdrop-blur-md">
      <Link href="/" className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-mono text-sm font-bold text-primary-foreground">
          N
        </span>
        <span className="font-sans text-sm font-semibold tracking-wide text-foreground">
          {title ?? "NEXORA"}
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href="/wallet"
          className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground"
        >
          {formatCentsShort(wallet.balanceCents)}
        </Link>
        <CartButton />
      </div>
    </header>
  )
}
