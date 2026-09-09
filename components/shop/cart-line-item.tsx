"use client"

import { X } from "lucide-react"
import { getProductVisual } from "@/lib/product-visuals"
import { formatCents } from "@/lib/format"
import { QuantityStepper } from "@/components/shop/quantity-stepper"
import { useCartStore, type CartLine } from "@/lib/cart-store"

export function CartLineItem({ line }: { line: CartLine }) {
  const setQuantity = useCartStore((s) => s.setQuantity)
  const removeLine = useCartStore((s) => s.removeLine)
  const { icon: Icon, gradient } = getProductVisual(line.productId)

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <div className={`flex size-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${gradient}`}>
        <Icon className="size-6 text-white/90" strokeWidth={1.5} />
      </div>
      <div className="flex-1">
        <p className="line-clamp-1 text-sm font-medium text-foreground">{line.name}</p>
        <p className="mt-0.5 text-sm font-semibold text-foreground">{formatCents(line.priceCents)}</p>
        <div className="mt-2">
          <QuantityStepper value={line.quantity} onChange={(q) => setQuantity(line.productId, q)} />
        </div>
      </div>
      <button
        type="button"
        aria-label={`Remove ${line.name} from cart`}
        onClick={() => removeLine(line.productId)}
        className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
