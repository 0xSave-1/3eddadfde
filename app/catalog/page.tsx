import Link from "next/link"
import { Search } from "lucide-react"
import { ShopShell } from "@/components/shop/shell"
import { BackHeader } from "@/components/shop/back-header"
import { ProductTile } from "@/components/shop/product-tile"
import { getCategories, getProducts } from "@/lib/data/catalog"
import { cn } from "@/lib/utils"

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>
}) {
  const { category = "all", q } = await searchParams
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ categorySlug: category, search: q }),
  ])

  return (
    <ShopShell>
      <BackHeader title="Catalog" />
      <div className="px-4 pt-3">
        <form action="/catalog" className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2">
          <input type="hidden" name="category" value={category} />
          <Search className="size-4 text-muted-foreground" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search for products"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </form>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <Link
          href="/catalog?category=all"
          className={cn(
            "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium",
            category === "all"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground",
          )}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/catalog?category=${c.slug}`}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium",
              category === c.slug
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground",
            )}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <section className="mt-4 px-4">
        {products.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No products found.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => (
              <ProductTile key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </ShopShell>
  )
}
