import { db } from "@/lib/db"
import { orderItems, orders } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import type { CartLine } from "@/lib/cart-store"

export async function createPendingOrder(
  lines: CartLine[],
  subtotalCents: number,
  discountCents: number,
  totalCents: number,
  promoCode?: string,
  visitorId?: string,
) {
  const [order] = await db
    .insert(orders)
    .values({
      status: "pending",
      paymentStatus: "unpaid",
      subtotalCents,
      discountCents,
      totalCents,
      promoCode: promoCode ?? null,
      visitorId: visitorId ?? null,
    })
    .returning()

  if (lines.length > 0) {
    await db.insert(orderItems).values(
      lines.map((l) => ({
        orderId: order.id,
        productId: l.productId,
        productName: l.name,
        unitPriceCents: l.priceCents,
        quantity: l.quantity,
      })),
    )
  }

  return order
}

export async function attachStripeSession(orderId: number, stripeSessionId: string) {
  await db.update(orders).set({ stripeSessionId }).where(eq(orders.id, orderId))
}

export async function markOrderPaid(stripeSessionId: string) {
  await db
    .update(orders)
    .set({ status: "completed", paymentStatus: "paid" })
    .where(eq(orders.stripeSessionId, stripeSessionId))
}

export async function listOrders(limit = 50) {
  return db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit)
}

export async function getOrderWithItems(orderId: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId))
  if (!order) return null
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId))
  return { order, items }
}

export async function getOrderByStripeSession(stripeSessionId: string) {
  const [order] = await db.select().from(orders).where(eq(orders.stripeSessionId, stripeSessionId))
  if (!order) return null
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id))
  return { order, items }
}

export async function getAllOrdersWithItems(limit = 100) {
  const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit)
  const allItems = await db.select().from(orderItems)
  return allOrders.map((order) => ({
    order,
    items: allItems.filter((item) => item.orderId === order.id),
  }))
}

export async function getOrdersForVisitor(visitorId: string) {
  return db.select().from(orders).where(eq(orders.visitorId, visitorId)).orderBy(desc(orders.createdAt))
}

export async function getOrderStats() {
  const allOrders = await db.select().from(orders)
  const paid = allOrders.filter((o) => o.paymentStatus === "paid")
  const revenueCents = paid.reduce((sum, o) => sum + o.totalCents, 0)
  return {
    totalOrders: allOrders.length,
    paidOrders: paid.length,
    revenueCents,
  }
}
