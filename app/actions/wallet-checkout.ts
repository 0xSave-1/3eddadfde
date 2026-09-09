"use server"

import { stripe } from "@/lib/stripe"
import { attachTopupSession, completeTopupBySession, createPendingTopup, getWalletTransactionById } from "@/lib/data/wallet"
import { getOrCreateVisitorId } from "@/lib/visitor"

const MIN_TOPUP_CENTS = 500
const MAX_TOPUP_CENTS = 100000

export async function startWalletTopup(amountCents: number) {
  const clamped = Math.max(MIN_TOPUP_CENTS, Math.min(MAX_TOPUP_CENTS, Math.round(amountCents)))

  const visitorId = await getOrCreateVisitorId()
  const transaction = await createPendingTopup(visitorId, clamped)

  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded_page",
    redirect_on_completion: "never",
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "NEXORA Wallet Top-up" },
          unit_amount: clamped,
        },
        quantity: 1,
      },
    ],
  })

  await attachTopupSession(transaction.id, session.id!)

  return { clientSecret: session.client_secret, transactionId: transaction.id }
}

export async function confirmTopupPaid(transactionId: number) {
  const visitorId = await getOrCreateVisitorId()
  const tx = await getWalletTransactionById(transactionId, visitorId)
  if (!tx) throw new Error("Transaction not found")
  if (tx.status === "completed") return tx
  if (!tx.stripeSessionId) throw new Error("Transaction missing checkout session")

  const session = await stripe.checkout.sessions.retrieve(tx.stripeSessionId)
  if (session.payment_status === "paid") {
    await completeTopupBySession(tx.stripeSessionId, visitorId)
  }
  return getWalletTransactionById(transactionId, visitorId)
}
