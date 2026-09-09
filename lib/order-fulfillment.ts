import "server-only"

import { incrementPromoUsage } from "@/lib/data/promo"
import { creditReferralForOrder, getOrCreateTelegramUser, getTelegramChatId } from "@/lib/data/referral"
import { deliverProductForOrder } from "@/lib/data/delivery"
import { sendTelegramMessage } from "@/lib/telegram"
import { formatCents } from "@/lib/format"
import { getOrderWithItems } from "@/lib/data/orders"

/**
 * Shared post-payment pipeline used by both Stripe checkout and wallet-funded
 * checkout: delivers product content, credits referral rewards, and notifies
 * the buyer over Telegram. Callers must have already flipped the order's
 * payment status to "paid" before invoking this.
 */
export async function fulfillPaidOrder(orderId: number, visitorId: string) {
  const record = await getOrderWithItems(orderId)
  if (!record) return

  for (const item of record.items) {
    await deliverProductForOrder(orderId, item.productId, item.quantity).catch(() => {})
  }

  if (record.order.promoCode) {
    await incrementPromoUsage(record.order.promoCode).catch(() => {})
  }

  await getOrCreateTelegramUser(visitorId)
  await creditReferralForOrder(visitorId, orderId, record.order.subtotalCents).catch(() => {})

  const chatId = await getTelegramChatId(visitorId)
  if (chatId) {
    await sendTelegramMessage(
      chatId,
      `Your NEXORA order #${orderId.toString().padStart(5, "0")} is paid — total ${formatCents(record.order.totalCents)}. We're on it!`,
    ).catch(() => {})
  }
}
