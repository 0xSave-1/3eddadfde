"use client"

import { useState } from "react"
import { ChevronDown, Copy, PackageCheck } from "lucide-react"
import { getProductVisual } from "@/lib/product-visuals"
import { formatCents } from "@/lib/format"
import { StatusBadge } from "@/components/shop/status-badge"

interface OrderCardProps {
  order: {
    id: number
    status: string
    paymentStatus: string
    totalCents: number
    createdAt: Date | string
  }
  items: { id: number; productId: number; productName: string; quantity: number; unitPriceCents: number }[]
  deliveries?: { id: number; productId: number; content: string }[]
}

export function OrderCard({ order, items, deliveries = [] }: OrderCardProps) {
  const date = new Date(order.createdAt)
  const [showDelivery, setShowDelivery] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  function handleCopy(id: number, content: string) {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500)
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">Order #{order.id.toString().padStart(5, "0")}</p>
        <StatusBadge status={order.paymentStatus} />
      </div>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {items.map((item) => {
          const { icon: Icon, gradient } = getProductVisual(item.productId)
          return (
            <div key={item.id} className="flex items-center gap-2.5">
              <div className={`flex size-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${gradient}`}>
                <Icon className="size-4 text-white/90" strokeWidth={1.5} />
              </div>
              <p className="line-clamp-1 flex-1 text-xs text-foreground">{item.productName}</p>
              <p className="shrink-0 text-xs text-muted-foreground">×{item.quantity}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
        <span className="text-xs text-muted-foreground">Total</span>
        <span className="text-sm font-bold text-foreground">{formatCents(order.totalCents)}</span>
      </div>

      {order.paymentStatus === "paid" && deliveries.length > 0 && (
        <div className="mt-2.5 border-t border-border pt-2.5">
          <button
            type="button"
            onClick={() => setShowDelivery((v) => !v)}
            className="flex w-full items-center justify-between text-xs font-medium text-primary"
          >
            <span className="flex items-center gap-1.5">
              <PackageCheck className="size-3.5" aria-hidden="true" />
              Delivered content ({deliveries.length})
            </span>
            <ChevronDown className={`size-3.5 transition-transform ${showDelivery ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
          {showDelivery && (
            <ul className="mt-2 flex flex-col gap-1.5">
              {deliveries.map((delivery) => (
                <li key={delivery.id} className="flex items-center gap-2 rounded-lg bg-secondary px-2.5 py-2">
                  <p className="line-clamp-2 flex-1 break-all font-mono text-[11px] text-foreground">{delivery.content}</p>
                  <button
                    type="button"
                    onClick={() => handleCopy(delivery.id, delivery.content)}
                    aria-label="Copy delivered content"
                    className="shrink-0 text-muted-foreground hover:text-primary"
                  >
                    {copiedId === delivery.id ? (
                      <span className="text-[10px] text-success">Copied</span>
                    ) : (
                      <Copy className="size-3.5" aria-hidden="true" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
