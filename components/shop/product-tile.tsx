import Link from "next/link"
import { Star } from "lucide-react"
import { getProductVisual } from "@/lib/product-visuals"
import { formatCentsShort } from "@/lib/format"
import { AddToCartButton } from "@/components/shop/add-to-cart-button"

interface ProductTileProps {
  product: {
    id: number
    name: string
    priceCents: number
    compareAtPriceCents: number | null
    badge: string | null
    rating: string
    imageUrl: string
  }
}

export function ProductTile({ product }: ProductTileProps) {
  const { icon: Icon, gradient } = getProductVisual(product.id)

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <Link href={`/product/${product.id}`} className="flex flex-col">
        <div className={`relative flex aspect-square items-center justify-center bg-gradient-to-br ${gradient}`}>
          <Icon className="size-10 text-white/90" strokeWidth={1.5} />
          {product.badge && (
            <span className="absolute top-2 left-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white">
              {product.badge}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1 p-2.5">
          <p className="line-clamp-1 text-xs font-medium text-foreground">{product.name}</p>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Star className="size-3 fill-primary text-primary" />
            {Number(product.rating).toFixed(1)}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold text-foreground">{formatCentsShort(product.priceCents)}</span>
            {product.compareAtPriceCents && (
              <span className="text-[11px] text-muted-foreground line-through">
                {formatCentsShort(product.compareAtPriceCents)}
              </span>
            )}
          </div>
        </div>
      </Link>
      <div className="absolute right-2 bottom-2">
        <AddToCartButton
          product={{ id: product.id, name: product.name, priceCents: product.priceCents, imageIcon: product.imageUrl }}
          size="icon-sm"
        />
      </div>
    </div>
  )
}
