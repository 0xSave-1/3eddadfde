"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TopupDialog } from "@/components/shop/topup-dialog"

const AMOUNTS_CENTS = [500, 1000, 2500, 5000]

export function TopupTrigger() {
  const [amountCents, setAmountCents] = useState(1000)
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-semibold text-foreground">Top Up Balance</p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {AMOUNTS_CENTS.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => setAmountCents(amount)}
            className={
              amount === amountCents
                ? "rounded-lg border border-primary bg-primary/10 py-2 text-xs font-semibold text-primary"
                : "rounded-lg border border-border bg-secondary py-2 text-xs font-medium text-foreground"
            }
          >
            ${amount / 100}
          </button>
        ))}
      </div>
      <Button className="mt-3 w-full" onClick={() => setOpen(true)}>
        Top Up ${amountCents / 100}
      </Button>
      <TopupDialog open={open} onOpenChange={setOpen} amountCents={amountCents} />
    </div>
  )
}
