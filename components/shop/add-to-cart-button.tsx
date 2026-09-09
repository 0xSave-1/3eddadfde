"use client"

import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/lib/cart-store"

interface AddToCartButtonProps {
  product: { id: number; name: string; priceCents: number; imageIcon: string }
  quantity?: number
  size?: "icon-sm" | "default" | "lg"
  fullWidth?: boolean
}

export function AddToCartButton({ product, quantity = 1, size = "default", fullWidth }: AddToCartButtonProps) {
  const addLine = useCartStore((s) => s.addLine)

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    addLine(
      { productId: product.id, name: product.name, priceCents: product.priceCents, imageIcon: product.imageIcon },
      quantity,
    )
    toast.success(`Added ${product.name} to cart`)
  }

  if (size === "icon-sm") {
    return (
      <Button size="icon-sm" onClick={handleAdd} aria-label={`Add ${product.name} to cart`}>
        <Plus />
      </Button>
    )
  }

  return (
    <Button size={size} onClick={handleAdd} className={fullWidth ? "w-full" : undefined}>
      <Plus /> Add to cart
    </Button>
  )
}
