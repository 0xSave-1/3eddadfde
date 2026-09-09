"use server"

import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { attachStripeSession, createPendingOrder, markOrderPaid } from "@/lib/data/orders"
import { validatePromoCode } from "@/lib/data/promo"
import { getOrCreateVisitorId } from "@/lib/visitor"
import { fulfillPaidOrder } from "@/lib/order-fulfillment"
import type { CartLine } from "@/lib/cart-store"

interface CheckoutLineInput {
  productId: number
  quantity: number
}

export async function startCartCheckout(lines: CheckoutLineInput[], promoCode?: string) {
  if (!lines.length) throw new Error("Cart is empty")

  const trustedLines: CartLine[] = []
  let subtotalCents = 0

  for (const line of lines) {
    const quantity = Math.max(1, Math.min(20, Math.floor(line.quantity)))
    const [product] = await db.select().from(products).where(eq(products.id, line.productId))
    if (!product || !product.isActive) continue
    trustedLines.push({
      productId: product.id,
      name: product.name,
      priceCents: product.priceCents,
      imageIcon: product.imageUrl,
      quantity,
    })
    subtotalCents += product.priceCents * quantity
  }

  if (!trustedLines.length) throw new Error("No valid items in cart")

  // Discount is always recomputed server-side from the promo code's stored
  // percentage — the client never supplies a discount amount directly.
  let discountCents = 0
  let appliedPromoCode: string | undefined
  if (promoCode?.trim()) {
    const validation = await validatePromoCode(promoCode)
    if (validation.valid) {
      discountCents = Math.round((subtotalCents * validation.discountPercent) / 100)
      appliedPromoCode = promoCode.trim().toUpperCase()
    }
  }
  const totalCents = Math.max(50, subtotalCents - discountCents)

  const visitorId = await getOrCreateVisitorId()
  const order = await createPendingOrder(trustedLines, subtotalCents, discountCents, totalCents, appliedPromoCode, visitorId)

  // Stripe line items can't carry a negative unit_amount, so any discount is folded
  // into the single charged total rather than itemized. Order items with their own
  // per-product prices remain stored in the database for receipts and the admin panel.
  const itemCount = trustedLines.reduce((sum, l) => sum + l.quantity, 0)
  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded_page",
    redirect_on_completion: "never",
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `NEXORA Order — ${itemCount} item${itemCount === 1 ? "" : "s"}`,
            description: trustedLines.map((l) => `${l.quantity}× ${l.name}`).join(", "),
          },
          unit_amount: totalCents,
        },
        quantity: 1,
      },
    ],
  })

  await attachStripeSession(order.id, session.id!)

  return { clientSecret: session.client_secret, orderId: order.id }
}

export async function confirmOrderPaid(orderId: number) {
  const record = await getOrderById(orderId)
  if (!record) throw new Error("Order not found")
  if (record.order.paymentStatus === "paid") return record.order

  if (!record.order.stripeSessionId) throw new Error("Order missing checkout session")
  const session = await stripe.checkout.sessions.retrieve(record.order.stripeSessionId)
  if (session.payment_status === "paid") {
    await markOrderPaid(record.order.stripeSessionId)
    const visitorId = await getOrCreateVisitorId()
    await fulfillPaidOrder(orderId, visitorId)
  }
  return getOrderById(orderId)
}

async function getOrderById(orderId: number) {
  const { getOrderWithItems } = await import("@/lib/data/orders")
  return getOrderWithItems(orderId)
}
