"use server"

import { revalidatePath } from "next/cache"
import { requirePermission } from "@/lib/admin-auth"
import { logAdminAction } from "@/lib/audit"
import { db } from "@/lib/db"
import { categories, products } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { addStockLines, clearStockLines, getAvailableStockCount, getDeliveryContent, upsertDeliveryContent } from "@/lib/data/delivery"

export async function createProductAction(formData: FormData) {
  const session = await requirePermission("products.manage")

  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const categoryName = String(formData.get("category") ?? "").trim()
  const priceCents = Math.round(Number(formData.get("priceCents") ?? 0))
  const imageUrl = String(formData.get("imageUrl") ?? "").trim()

  if (!name || !categoryName) throw new Error("Name and category are required")
  if (!Number.isFinite(priceCents) || priceCents <= 0) throw new Error("Invalid price")

  const [category] = await db.select().from(categories).where(eq(categories.name, categoryName))
  if (!category) throw new Error("Unknown category")

  const sku = `${categoryName.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`

  const [created] = await db
    .insert(products)
    .values({
      categoryId: category.id,
      name,
      description,
      priceCents,
      imageUrl,
      sku,
      isActive: true,
    })
    .returning()

  await logAdminAction(session, "product.create", { targetType: "product", targetId: created?.id, metadata: { name, priceCents } })
  revalidatePath("/admin/dashboard")
  revalidatePath("/catalog")
}

export async function toggleProductAction(id: number, isActive: boolean) {
  const session = await requirePermission("products.manage")
  await db.update(products).set({ isActive }).where(eq(products.id, id))
  await logAdminAction(session, isActive ? "product.activate" : "product.deactivate", { targetType: "product", targetId: id })
  revalidatePath("/admin/dashboard")
  revalidatePath("/catalog")
}

export async function deleteProductAction(id: number) {
  const session = await requirePermission("products.manage")
  await db.delete(products).where(eq(products.id, id))
  await logAdminAction(session, "product.delete", { targetType: "product", targetId: id })
  revalidatePath("/admin/dashboard")
  revalidatePath("/catalog")
}

export async function getProductDeliverySettingsAction(productId: number) {
  await requirePermission("products.manage")
  const [content, stockCount] = await Promise.all([getDeliveryContent(productId), getAvailableStockCount(productId)])
  return {
    deliveryMode: (content?.deliveryMode as "shared" | "pool") ?? "shared",
    content: content?.content ?? "",
    stockCount,
  }
}

export async function saveProductDeliveryContentAction(productId: number, content: string, deliveryMode: "shared" | "pool") {
  const session = await requirePermission("products.manage")
  await upsertDeliveryContent(productId, content, deliveryMode)
  await logAdminAction(session, "product.delivery.update", { targetType: "product", targetId: productId, metadata: { deliveryMode } })
  revalidatePath("/admin/dashboard")
}

export async function addProductStockLinesAction(productId: number, rawLines: string) {
  const session = await requirePermission("products.manage")
  const lines = rawLines.split("\n")
  await addStockLines(productId, lines)
  await logAdminAction(session, "product.delivery.stock_added", { targetType: "product", targetId: productId, metadata: { count: lines.length } })
  revalidatePath("/admin/dashboard")
  return getAvailableStockCount(productId)
}

export async function clearProductStockAction(productId: number) {
  const session = await requirePermission("products.manage")
  await clearStockLines(productId)
  await logAdminAction(session, "product.delivery.stock_cleared", { targetType: "product", targetId: productId })
  revalidatePath("/admin/dashboard")
  return 0
}
