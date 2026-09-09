import { Suspense } from "react"
import { ShopShell } from "@/components/shop/shell"
import { TopHeader } from "@/components/shop/top-header"
import { ReferralCapture } from "@/components/shop/referral-capture"
import { HomepageBlockRenderer } from "@/components/shop/homepage-block-renderer"
import { getHomepageBlocksForRender } from "@/app/actions/admin-homepage"
import { getCategories, getPopularProducts, getLatestProducts, getProducts } from "@/lib/data/catalog"

export default async function HomePage() {
  const blocks = await getHomepageBlocksForRender()

  return (
    <ShopShell>
      <Suspense fallback={null}>
        <ReferralCapture />
      </Suspense>
      <TopHeader />
      {blocks.map((block) => (
        <HomepageBlockContent key={block.id} type={block.type} config={block.config as Record<string, unknown>} />
      ))}
    </ShopShell>
  )
}

async function HomepageBlockContent({ type, config }: { type: string; config: Record<string, unknown> }) {
  if (type === "category_grid") {
    const categories = await getCategories()
    return <HomepageBlockRenderer type={type} config={config} categories={categories} />
  }

  if (type === "product_rail") {
    const mode = (config.mode as string) ?? "popular"
    let products
    if (mode === "manual") {
      const ids = Array.isArray(config.productIds) ? (config.productIds as number[]) : []
      const all = await getProducts()
      products = all.filter((p) => ids.includes(p.id))
    } else if (mode === "latest") {
      products = await getLatestProducts(4)
    } else {
      products = await getPopularProducts(4)
    }
    return <HomepageBlockRenderer type={type} config={config} products={products} />
  }

  return <HomepageBlockRenderer type={type} config={config} />
}
