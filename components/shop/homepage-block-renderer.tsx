import Link from "next/link"
import { ArrowRight, Ticket } from "lucide-react"
import { CategoryPill } from "@/components/shop/category-pill"
import { ProductTile } from "@/components/shop/product-tile"

interface CategoryOption {
  id: number
  name: string
  slug: string
  icon: string
}

interface ProductOption {
  id: number
  name: string
  priceCents: number
  compareAtPriceCents: number | null
  badge: string | null
  rating: string
  imageUrl: string
}

export interface BlockStyleConfig {
  backgroundColor?: string
  align?: "left" | "center" | "right"
  padding?: "none" | "sm" | "md" | "lg"
}

const PADDING_CLASS: Record<NonNullable<BlockStyleConfig["padding"]>, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-5",
  lg: "p-8",
}

const ALIGN_CLASS: Record<NonNullable<BlockStyleConfig["align"]>, string> = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
}

function getBlockStyle(config: Record<string, unknown>) {
  const style = (config.style as BlockStyleConfig | undefined) ?? {}
  return {
    backgroundColor: style.backgroundColor || undefined,
    alignClass: style.align ? ALIGN_CLASS[style.align] : "",
    paddingClass: style.padding ? PADDING_CLASS[style.padding] : "",
  }
}

export function HomepageBlockRenderer({
  type,
  config,
  categories,
  products,
}: {
  type: string
  config: Record<string, unknown>
  categories?: CategoryOption[]
  products?: ProductOption[]
}) {
  const { backgroundColor, alignClass, paddingClass } = getBlockStyle(config)

  if (type === "hero_banner") {
    return (
      <section
        className={`relative mx-4 mt-4 flex flex-col overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/20 via-card to-card ${paddingClass || "p-5"} ${alignClass}`}
        style={backgroundColor ? { backgroundColor, backgroundImage: "none" } : undefined}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Nexora Marketplace</p>
        <h1 className="mt-1.5 max-w-[220px] text-balance text-xl font-bold leading-tight text-foreground">
          {(config.title as string) || "Unlock More Possibilities"}
        </h1>
        {config.subtitle ? (
          <p className="mt-1.5 max-w-[240px] text-pretty text-xs leading-relaxed text-muted-foreground">
            {config.subtitle as string}
          </p>
        ) : null}
        <Link
          href={(config.buttonLink as string) || "/catalog"}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
        >
          {(config.buttonText as string) || "Explore Now"} <ArrowRight className="size-3.5" />
        </Link>
      </section>
    )
  }

  if (type === "category_grid" && categories) {
    return (
      <section
        className={`mt-6 flex flex-col px-4 ${paddingClass} ${alignClass}`}
        style={backgroundColor ? { backgroundColor } : undefined}
      >
        {config.title ? <h2 className="mb-3 text-sm font-semibold text-foreground">{config.title as string}</h2> : null}
        <div className="grid w-full grid-cols-4 gap-2">
          {categories.map((c) => (
            <CategoryPill key={c.id} name={c.name} slug={c.slug} icon={c.icon} />
          ))}
        </div>
      </section>
    )
  }

  if (type === "product_rail" && products) {
    return (
      <section
        className={`mt-6 flex flex-col px-4 ${paddingClass} ${alignClass}`}
        style={backgroundColor ? { backgroundColor } : undefined}
      >
        <div className="flex w-full items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">{(config.title as string) || "Products"}</h2>
          <Link href="/catalog" className="text-xs font-medium text-primary">
            See all
          </Link>
        </div>
        <div className="mt-3 grid w-full grid-cols-2 gap-3">
          {products.map((p) => (
            <ProductTile key={p.id} product={p} />
          ))}
        </div>
      </section>
    )
  }

  if (type === "promo_banner") {
    return (
      <section className={`mx-4 mt-6 flex flex-col ${paddingClass} ${alignClass}`}>
        <Link
          href={(config.link as string) || "/catalog"}
          className="flex w-full items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3"
          style={backgroundColor ? { backgroundColor } : undefined}
        >
          <Ticket className="size-4 shrink-0 text-primary" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-foreground">{(config.text as string) || "Limited time offer"}</p>
            {config.code ? <p className="text-[11px] text-primary">Code: {config.code as string}</p> : null}
          </div>
        </Link>
      </section>
    )
  }

  return null
}
