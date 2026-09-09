"use server"

import { db } from "@/lib/db"
import { orders, products } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { stripe } from "@/lib/stripe"
import { attachStripeSession, createPendingOrder, getOrderWithItems } from "@/lib/data/orders"
import { validatePromoCode } from "@/lib/data/promo"
import { getUserBalanceCents, adjustUserBalance, getUserWallet } from "@/lib/data/user-wallet"
import { getOrCreateVisitorId } from "@/lib/visitor"
import { fulfillPaidOrder } from "@/lib/order-fulfillment"
import type { CartLine } from "@/lib/cart-store"

interface CheckoutLineInput {
  productId: number
  quantity: number
}

/**
 * Builds a pending order from trusted, server-priced cart lines and applies as
 * much of the buyer's wallet balance as possible. If the balance fully covers
 * the total, the order is marked paid immediately and delivered. Otherwise the
 * remaining balance-due amount gets a Stripe Checkout session for just the
 * shortfall — the buyer never pays more by card than their wallet doesn't cover.
 */
export async function startWalletAwareCheckout(lines: CheckoutLineInput[], promoCode?: string) {
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

  const visitorId = await getOrCreateVisitorId()
  const wallet = await getUserWallet(visitorId)
  if (wallet.isBanned) throw new Error("Your account is blocked from placing orders")

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

  const order = await createPendingOrder(trustedLines, subtotalCents, discountCents, totalCents, appliedPromoCode, visitorId)
  const balanceCents = await getUserBalanceCents(visitorId)

  if (balanceCents <= 0) {
    return startCardPayment(order.id, totalCents, trustedLines)
  }

  const walletAppliedCents = Math.min(balanceCents, totalCents)
  await adjustUserBalance(visitorId, -walletAppliedCents)
  await db.update(orders).set({ walletAppliedCents, paymentMethod: walletAppliedCents === totalCents ? "wallet" : "wallet+card" }).where(eq(orders.id, order.id))

  const remainingCents = totalCents - walletAppliedCents
  if (remainingCents <= 0) {
    await db.update(orders).set({ status: "completed", paymentStatus: "paid" }).where(eq(orders.id, order.id))
    await fulfillPaidOrder(order.id, visitorId)
    return { fullyPaidByWallet: true, orderId: order.id }
  }

  return startCardPayment(order.id, remainingCents, trustedLines)
}

async function startCardPayment(orderId: number, amountCents: number, lines: CartLine[]) {
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0)
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
            description: lines.map((l) => `${l.quantity}× ${l.name}`).join(", "),
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
  })
  await attachStripeSession(orderId, session.id!)
  return { fullyPaidByWallet: false, clientSecret: session.client_secret, orderId }
}

export async function confirmWalletAwareOrderPaid(orderId: number) {
  const record = await getOrderWithItems(orderId)
  if (!record) throw new Error("Order not found")
  if (record.order.paymentStatus === "paid") return record.order
  if (!record.order.stripeSessionId) throw new Error("Order missing checkout session")

  const session = await stripe.checkout.sessions.retrieve(record.order.stripeSessionId)
  if (session.payment_status === "paid") {
    await db.update(orders).set({ status: "completed", paymentStatus: "paid" }).where(eq(orders.id, orderId))
    const visitorId = await getOrCreateVisitorId()
    await fulfillPaidOrder(orderId, visitorId)
  }
  return getOrderWithItems(orderId)
}

export async function getWalletBalanceForCheckout() {
  const visitorId = await getOrCreateVisitorId()
  return getUserBalanceCents(visitorId)
}
