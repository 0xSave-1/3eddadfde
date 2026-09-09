import { notFound } from "next/navigation"
import { Star, ShieldCheck, Zap } from "lucide-react"
import { ShopShell } from "@/components/shop/shell"
import { BackHeader } from "@/components/shop/back-header"
import { CartButton } from "@/components/shop/cart-button"
import { AddToCartButton } from "@/components/shop/add-to-cart-button"
import { getProductById } from "@/lib/data/catalog"
import { getProductVisual } from "@/lib/product-visuals"
import { formatCents } from "@/lib/format"

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getProductById(Number(id))
  if (!product) notFound()

  const { icon: Icon, gradient } = getProductVisual(product.id)

  return (
    <ShopShell>
      <BackHeader title="Product" action={<CartButton />} />

      <div className={`flex aspect-square items-center justify-center bg-gradient-to-br ${gradient}`}>
        <Icon className="size-20 text-white/90" strokeWidth={1.25} />
      </div>

      <div className="px-4 py-4">
        {product.badge && (
          <span className="mb-2 inline-block rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            {product.badge}
          </span>
        )}
        <h1 className="text-balance text-lg font-bold leading-snug text-foreground">{product.name}</h1>

        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Star className="size-3.5 fill-primary text-primary" />
          <span className="font-medium text-foreground">{Number(product.rating).toFixed(1)}</span>
          <span>({product.reviewCount.toLocaleString()} reviews)</span>
          <span className="text-border">•</span>
          <span className={product.stock > 0 ? "text-emerald-500" : "text-destructive"}>
            {product.stock > 0 ? "In stock" : "Out of stock"}
          </span>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-foreground">{formatCents(product.priceCents)}</span>
          {product.compareAtPriceCents && (
            <>
              <span className="text-sm text-muted-foreground line-through">
                {formatCents(product.compareAtPriceCents)}
              </span>
              <span className="rounded bg-destructive/15 px-1.5 py-0.5 text-[11px] font-semibold text-destructive">
                -{Math.round((1 - product.priceCents / product.compareAtPriceCents) * 100)}%
              </span>
            </>
          )}
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="size-4 text-primary" /> Instant delivery
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" /> Official product
          </div>
        </div>

        <div className="mt-5">
          <h2 className="text-sm font-semibold text-foreground">About</h2>
          <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
            {product.description || "No description available for this product yet."}
          </p>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[64px] mx-auto w-full max-w-[480px] border-t border-border bg-background/95 p-4 supports-backdrop-filter:backdrop-blur-md">
        <AddToCartButton
          product={{ id: product.id, name: product.name, priceCents: product.priceCents, imageIcon: product.imageUrl }}
          size="lg"
          fullWidth
        />
      </div>
    </ShopShell>
  )
}
