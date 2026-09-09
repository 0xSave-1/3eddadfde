"use client"

import { useTransition } from "react"
import { updateOrderStatusAction } from "@/app/actions/admin-orders"

const STATUSES = ["pending", "paid", "completed", "failed"] as const

export function OrderStatusSelect({ orderId, status }: { orderId: number; status: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value
        startTransition(() => updateOrderStatusAction(orderId, next))
      }}
      className="rounded-md border border-border bg-secondary px-2 py-1 text-[11px] font-semibold text-foreground disabled:opacity-60"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  )
}
