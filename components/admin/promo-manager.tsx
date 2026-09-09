"use client"

import { useRef, useTransition } from "react"
import { Trash2, Ticket } from "lucide-react"
import { createPromoCodeAction, deletePromoCodeAction, togglePromoCodeAction } from "@/app/actions/admin-promo"

interface PromoRow {
  id: number
  code: string
  discountPercent: number
  maxUses: number | null
  usedCount: number
  isActive: boolean
  expiresAt: Date | null
}

export function PromoManager({ promoCodes }: { promoCodes: PromoRow[] }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border">
      <form
        ref={formRef}
        action={(formData) =>
          startTransition(async () => {
            await createPromoCodeAction(formData)
            formRef.current?.reset()
          })
        }
        className="flex flex-wrap items-end gap-2 border-b border-border bg-secondary p-3"
      >
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-muted-foreground">Code</label>
          <input
            name="code"
            required
            placeholder="SUMMER20"
            className="w-28 rounded-md border border-border bg-card px-2 py-1.5 text-xs uppercase text-foreground outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-muted-foreground">Discount %</label>
          <input
            name="discountPercent"
            type="number"
            min={1}
            max={100}
            required
            placeholder="10"
            className="w-20 rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-muted-foreground">Max uses</label>
          <input
            name="maxUses"
            type="number"
            min={1}
            placeholder="Unlimited"
            className="w-24 rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-muted-foreground">Expires</label>
          <input
            name="expiresAt"
            type="date"
            className="rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
        >
          <Ticket className="size-3.5" /> Create
        </button>
      </form>

      <table className="w-full text-left text-xs">
        <thead className="bg-secondary text-muted-foreground">
          <tr>
            <th className="px-3 py-2.5 font-medium">Code</th>
            <th className="px-3 py-2.5 font-medium">Discount</th>
            <th className="px-3 py-2.5 font-medium">Usage</th>
            <th className="px-3 py-2.5 font-medium">Expires</th>
            <th className="px-3 py-2.5 font-medium">Status</th>
            <th className="px-3 py-2.5 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {promoCodes.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                No promo codes yet.
              </td>
            </tr>
          ) : (
            promoCodes.map((promo) => (
              <tr key={promo.id}>
                <td className="px-3 py-2.5 font-semibold text-foreground">{promo.code}</td>
                <td className="px-3 py-2.5 text-foreground">{promo.discountPercent}%</td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {promo.usedCount}
                  {promo.maxUses ? ` / ${promo.maxUses}` : ""}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {promo.expiresAt ? new Date(promo.expiresAt).toLocaleDateString() : "Never"}
                </td>
                <td className="px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => startTransition(() => togglePromoCodeAction(promo.id, !promo.isActive))}
                    className={
                      promo.isActive
                        ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-500"
                        : "rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground"
                    }
                  >
                    {promo.isActive ? "Active" : "Disabled"}
                  </button>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button
                    type="button"
                    aria-label={`Delete promo code ${promo.code}`}
                    onClick={() => startTransition(() => deletePromoCodeAction(promo.id))}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
