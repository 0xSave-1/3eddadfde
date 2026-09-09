import { db } from "@/lib/db"
import { orderDeliveries, productDeliveryContent, productDeliveryStock } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"

export async function getDeliveryContent(productId: number) {
  const rows = await db.select().from(productDeliveryContent).where(eq(productDeliveryContent.productId, productId))
  return rows[0] ?? null
}

export async function upsertDeliveryContent(productId: number, content: string, deliveryMode: "shared" | "pool") {
  const existing = await getDeliveryContent(productId)
  if (existing) {
    await db
      .update(productDeliveryContent)
      .set({ content, deliveryMode, updatedAt: new Date() })
      .where(eq(productDeliveryContent.productId, productId))
  } else {
    await db.insert(productDeliveryContent).values({ productId, content, deliveryMode })
  }
}

export async function getAvailableStockCount(productId: number) {
  const rows = await db
    .select()
    .from(productDeliveryStock)
    .where(and(eq(productDeliveryStock.productId, productId), eq(productDeliveryStock.isUsed, false)))
  return rows.length
}

export async function addStockLines(productId: number, lines: string[]) {
  const trimmed = lines.map((l) => l.trim()).filter(Boolean)
  if (!trimmed.length) return
  await db.insert(productDeliveryStock).values(trimmed.map((value) => ({ productId, value })))
}

export async function clearStockLines(productId: number) {
  await db.delete(productDeliveryStock).where(and(eq(productDeliveryStock.productId, productId), eq(productDeliveryStock.isUsed, false)))
}

/**
 * Attempts to deliver `quantity` units of a product's content for a paid order item.
 * Shared mode always succeeds (same text repeated). Pool mode consumes that many
 * unused stock rows; if insufficient stock exists, delivers what's available and
 * returns a shortfall count so the caller can flag the order for manual fulfillment.
 */
export async function deliverProductForOrder(orderId: number, productId: number, quantity: number) {
  const config = await getDeliveryContent(productId)
  if (!config || !config.content.trim()) return { delivered: false, shortfall: 0 }

  if (config.deliveryMode === "shared") {
    for (let i = 0; i < quantity; i++) {
      await db.insert(orderDeliveries).values({ orderId, productId, content: config.content })
    }
    return { delivered: true, shortfall: 0 }
  }

  const available = await db
    .select()
    .from(productDeliveryStock)
    .where(and(eq(productDeliveryStock.productId, productId), eq(productDeliveryStock.isUsed, false)))
    .limit(quantity)

  for (const row of available) {
    await db.update(productDeliveryStock).set({ isUsed: true, orderId }).where(eq(productDeliveryStock.id, row.id))
    await db.insert(orderDeliveries).values({ orderId, productId, content: row.value })
  }

  const shortfall = quantity - available.length
  return { delivered: available.length > 0, shortfall }
}

export async function getOrderDeliveries(orderId: number) {
  return db.select().from(orderDeliveries).where(eq(orderDeliveries.orderId, orderId))
}

export async function retryDelivery(orderId: number, productId: number, quantity: number) {
  const alreadyDelivered = await db
    .select()
    .from(orderDeliveries)
    .where(and(eq(orderDeliveries.orderId, orderId), eq(orderDeliveries.productId, productId)))
  const remaining = quantity - alreadyDelivered.length
  if (remaining <= 0) return { delivered: true, shortfall: 0 }
  return deliverProductForOrder(orderId, productId, remaining)
}
