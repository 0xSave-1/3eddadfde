"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ShoppingBag, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { ShopShell } from "@/components/shop/shell"
import { BackHeader } from "@/components/shop/back-header"
import { CartLineItem } from "@/components/shop/cart-line-item"
import { CheckoutDialog } from "@/components/shop/checkout-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCartStore, cartSubtotal } from "@/lib/cart-store"
import { formatCents } from "@/lib/format"
import { previewPromoCode } from "@/app/actions/promo-preview"

export default function CartPage() {
  const lines = useCartStore((s) => s.lines)
  const [promoCode, setPromoCode] = useState("")
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [promoState, setPromoState] = useState<{ status: "idle" | "checking" | "valid" | "invalid"; discountPercent: number }>({
    status: "idle",
    discountPercent: 0,
  })

  useEffect(() => {
    const trimmed = promoCode.trim()
    if (!trimmed) {
      setPromoState({ status: "idle", discountPercent: 0 })
      return
    }
    setPromoState((prev) => ({ ...prev, status: "checking" }))
    const handle = setTimeout(() => {
      previewPromoCode(trimmed).then((result) => {
        setPromoState({
          status: result.valid ? "valid" : "invalid",
          discountPercent: result.valid ? result.discountPercent : 0,
        })
      })
    }, 350)
    return () => clearTimeout(handle)
  }, [promoCode])

  const subtotal = cartSubtotal(lines)
  const discount = promoState.status === "valid" ? Math.round((subtotal * promoState.discountPercent) / 100) : 0
  const total = Math.max(0, subtotal - discount)

  return (
    <ShopShell>
      <BackHeader title="Your Cart" />

      {lines.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-24 text-center">
          <ShoppingBag className="size-10 text-muted-foreground" strokeWidth={1.25} />
          <p className="text-sm text-muted-foreground">Your cart is empty.</p>
          <Button size="sm" nativeButton={false} render={<Link href="/catalog" />}>
            Browse catalog
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 px-4 pt-4">
            {lines.map((line) => (
              <CartLineItem key={line.productId} line={line} />
            ))}
          </div>

          <div className="mt-4 px-4">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Have a promo code?</p>
            <div className="relative">
              <Input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Enter promo code"
                className="bg-secondary pr-9"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {promoState.status === "checking" && (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
                )}
                {promoState.status === "valid" && (
                  <CheckCircle2 className="size-4 text-emerald-500" aria-label="Promo code applied" />
                )}
                {promoState.status === "invalid" && (
                  <XCircle className="size-4 text-destructive" aria-label="Invalid promo code" />
                )}
              </span>
            </div>
            {promoState.status === "invalid" && (
              <p className="mt-1.5 text-xs text-destructive">This promo code is invalid or expired.</p>
            )}
          </div>

          <div className="mx-4 mt-5 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">{formatCents(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="mt-1.5 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Discount ({promoState.discountPercent}%)</span>
                <span className="font-medium text-emerald-500">-{formatCents(discount)}</span>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-sm">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-bold text-foreground">{formatCents(total)}</span>
            </div>
          </div>

          <div className="fixed inset-x-0 bottom-[64px] mx-auto w-full max-w-[480px] border-t border-border bg-background/95 p-4 supports-backdrop-filter:backdrop-blur-md">
            <Button size="lg" className="w-full" onClick={() => setCheckoutOpen(true)}>
              Proceed to Payment · {formatCents(total)}
            </Button>
          </div>

          <CheckoutDialog
            open={checkoutOpen}
            onOpenChange={setCheckoutOpen}
            lines={lines.map((l) => ({ productId: l.productId, quantity: l.quantity }))}
            promoCode={promoState.status === "valid" ? promoCode : undefined}
          />
        </>
      )}
    </ShopShell>
  )
}
