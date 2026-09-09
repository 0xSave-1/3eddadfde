"use client"

import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { useCartStore, cartCount } from "@/lib/cart-store"

export function CartButton() {
  const lines = useCartStore((s) => s.lines)
  const count = cartCount(lines)

  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
      className="relative flex size-8 items-center justify-center rounded-full border border-border bg-secondary text-foreground"
    >
      <ShoppingCart className="size-4" />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  )
}
