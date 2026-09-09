"use client"

import { useState, useTransition } from "react"
import { PackageOpen, Trash2 } from "lucide-react"
import { deleteProductAction, toggleProductAction } from "@/app/actions/admin-products"
import { ProductDeliveryEditor } from "@/components/admin/product-delivery-editor"

export function ProductRowActions({ id, name, isActive }: { id: number; name: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition()
  const [deliveryOpen, setDeliveryOpen] = useState(false)

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        aria-label={`Manage delivery for ${name}`}
        onClick={() => setDeliveryOpen(true)}
        className="text-muted-foreground hover:text-primary"
      >
        <PackageOpen className="size-3.5" />
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => toggleProductAction(id, !isActive))}
        className={
          isActive
            ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-500 disabled:opacity-60"
            : "rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground disabled:opacity-60"
        }
      >
        {isActive ? "Active" : "Hidden"}
      </button>
      <button
        type="button"
        aria-label="Delete product"
        disabled={pending}
        onClick={() => startTransition(() => deleteProductAction(id))}
        className="text-muted-foreground hover:text-destructive disabled:opacity-60"
      >
        <Trash2 className="size-3.5" />
      </button>
      <ProductDeliveryEditor productId={id} productName={name} open={deliveryOpen} onOpenChange={setDeliveryOpen} />
    </div>
  )
}
