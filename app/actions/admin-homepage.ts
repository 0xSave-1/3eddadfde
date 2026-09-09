"use server"

import { revalidatePath } from "next/cache"
import { asc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { homepageBlocks } from "@/lib/db/schema"
import { requirePermission } from "@/lib/admin-auth"
import { logAdminAction } from "@/lib/audit"

export type HomepageBlockType = "hero_banner" | "category_grid" | "product_rail" | "promo_banner"

const DEFAULT_CONFIG: Record<HomepageBlockType, Record<string, unknown>> = {
  hero_banner: {
    title: "Unlock More Possibilities",
    subtitle: "Games, AI, digital goods and services — all in one place.",
    buttonText: "Explore Now",
    buttonLink: "/catalog",
  },
  category_grid: { title: "Categories" },
  product_rail: { title: "Popular Products", mode: "popular", productIds: [] },
  promo_banner: { text: "Limited time offer", code: "", link: "/catalog" },
}

/** Seeds the table once from the original hardcoded homepage layout, if empty. */
export async function ensureHomepageSeeded() {
  const existing = await db.select({ id: homepageBlocks.id }).from(homepageBlocks).limit(1)
  if (existing.length > 0) return

  await db.insert(homepageBlocks).values([
    {
      type: "hero_banner",
      sortOrder: 0,
      isVisible: true,
      config: DEFAULT_CONFIG.hero_banner,
    },
    {
      type: "category_grid",
      sortOrder: 1,
      isVisible: true,
      config: DEFAULT_CONFIG.category_grid,
    },
    {
      type: "product_rail",
      sortOrder: 2,
      isVisible: true,
      config: { title: "Popular Products", mode: "popular", productIds: [] },
    },
  ])
}

export async function getHomepageBlocksForRender() {
  await ensureHomepageSeeded()
  return db.select().from(homepageBlocks).where(eq(homepageBlocks.isVisible, true)).orderBy(asc(homepageBlocks.sortOrder))
}

export async function listHomepageBlocksForEditor() {
  await requirePermission("homepage.manage")
  await ensureHomepageSeeded()
  return db.select().from(homepageBlocks).orderBy(asc(homepageBlocks.sortOrder))
}

export async function addHomepageBlockAction(type: HomepageBlockType) {
  const session = await requirePermission("homepage.manage")

  const rows = await db.select({ sortOrder: homepageBlocks.sortOrder }).from(homepageBlocks)
  const nextOrder = rows.reduce((max, r) => Math.max(max, r.sortOrder), -1) + 1

  const [created] = await db
    .insert(homepageBlocks)
    .values({ type, sortOrder: nextOrder, isVisible: true, config: DEFAULT_CONFIG[type] })
    .returning()

  await logAdminAction(session, "homepage.add_block", { targetType: "homepage_block", targetId: created.id, metadata: { type } })
  revalidatePath("/admin/homepage")
  revalidatePath("/")
  return created
}

export async function deleteHomepageBlockAction(id: number) {
  const session = await requirePermission("homepage.manage")
  await db.delete(homepageBlocks).where(eq(homepageBlocks.id, id))
  await logAdminAction(session, "homepage.delete_block", { targetType: "homepage_block", targetId: id })
  revalidatePath("/admin/homepage")
  revalidatePath("/")
}

export async function toggleHomepageBlockVisibilityAction(id: number, isVisible: boolean) {
  const session = await requirePermission("homepage.manage")
  await db.update(homepageBlocks).set({ isVisible, updatedAt: new Date() }).where(eq(homepageBlocks.id, id))
  await logAdminAction(session, "homepage.toggle_block", { targetType: "homepage_block", targetId: id, metadata: { isVisible } })
  revalidatePath("/admin/homepage")
  revalidatePath("/")
}

export async function updateHomepageBlockConfigAction(id: number, config: Record<string, unknown>) {
  const session = await requirePermission("homepage.manage")
  await db.update(homepageBlocks).set({ config, updatedAt: new Date() }).where(eq(homepageBlocks.id, id))
  await logAdminAction(session, "homepage.update_block", { targetType: "homepage_block", targetId: id, metadata: { config } })
  revalidatePath("/admin/homepage")
  revalidatePath("/")
}

export async function reorderHomepageBlocksAction(orderedIds: number[]) {
  const session = await requirePermission("homepage.manage")

  await Promise.all(
    orderedIds.map((id, index) => db.update(homepageBlocks).set({ sortOrder: index, updatedAt: new Date() }).where(eq(homepageBlocks.id, id))),
  )

  await logAdminAction(session, "homepage.reorder", { metadata: { orderedIds } })
  revalidatePath("/admin/homepage")
  revalidatePath("/")
}
