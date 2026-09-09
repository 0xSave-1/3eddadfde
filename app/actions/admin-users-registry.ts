"use server"

import { revalidatePath } from "next/cache"
import { requirePermission } from "@/lib/admin-auth"
import { logAdminAction } from "@/lib/audit"
import { listUserWallets, adjustUserBalance, setUserBanned, getUserWallet } from "@/lib/data/user-wallet"
import { getOrdersForVisitor } from "@/lib/data/orders"
import { getTelegramChatId } from "@/lib/data/referral"

export async function listUsersForAdmin() {
  await requirePermission("users.manage")
  const wallets = await listUserWallets()
  return wallets
}

export async function getUserDetailForAdmin(visitorId: string) {
  await requirePermission("users.manage")
  const [wallet, orders, telegramChatId] = await Promise.all([
    getUserWallet(visitorId),
    getOrdersForVisitor(visitorId),
    getTelegramChatId(visitorId),
  ])
  return { wallet, orders, hasTelegram: Boolean(telegramChatId) }
}

export async function adminAdjustBalance(visitorId: string, amountCents: number, reason: string) {
  const session = await requirePermission("users.manage")
  if (!Number.isFinite(amountCents) || amountCents === 0) throw new Error("Enter a non-zero amount")
  await adjustUserBalance(visitorId, Math.trunc(amountCents))
  await logAdminAction(session, amountCents > 0 ? "user.balance.credit" : "user.balance.debit", {
    targetType: "user",
    targetId: visitorId,
    metadata: { amountCents, reason },
  })
  revalidatePath("/admin/users")
}

export async function adminSetUserBanned(visitorId: string, isBanned: boolean) {
  const session = await requirePermission("users.manage")
  await setUserBanned(visitorId, isBanned)
  await logAdminAction(session, isBanned ? "user.ban" : "user.unban", { targetType: "user", targetId: visitorId })
  revalidatePath("/admin/users")
}
