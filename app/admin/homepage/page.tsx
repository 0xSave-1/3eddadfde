import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getAdminSession } from "@/lib/admin-auth"
import { hasPermission } from "@/lib/permissions"
import { listHomepageBlocksForEditor } from "@/app/actions/admin-homepage"
import { getAllProductsWithCategory, getCategories } from "@/lib/data/catalog"
import { HomepageBuilder } from "@/components/admin/homepage-builder/builder"

export default async function HomepageBuilderPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin")
  if (!hasPermission(session.permissions, "homepage.manage")) redirect("/admin/dashboard")

  const [blocks, products, categories] = await Promise.all([
    listHomepageBlocksForEditor(),
    getAllProductsWithCategory(),
    getCategories(),
  ])

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Back to dashboard
        </Link>
        <h1 className="mt-3 text-xl font-bold text-foreground">Homepage Builder</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Drag to reorder sections, toggle visibility, and edit each section&apos;s content.
        </p>

        <div className="mt-6">
          <HomepageBuilder
            initialBlocks={blocks.map((b) => ({ ...b, config: b.config as Record<string, unknown> }))}
            products={products}
            categories={categories}
          />
        </div>
      </div>
    </main>
  )
}
