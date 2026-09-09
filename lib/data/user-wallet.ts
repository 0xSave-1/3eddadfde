import { db } from "@/lib/db"
import { userWallets } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

export async function getUserWallet(visitorId: string) {
  const rows = await db.select().from(userWallets).where(eq(userWallets.visitorId, visitorId))
  if (rows[0]) return rows[0]
  const inserted = await db.insert(userWallets).values({ visitorId, balanceCents: 0 }).returning()
  return inserted[0]
}

export async function getUserBalanceCents(visitorId: string) {
  const w = await getUserWallet(visitorId)
  return w.balanceCents
}

/** Applies a signed delta to a user's balance. Throws if it would go negative. */
export async function adjustUserBalance(visitorId: string, deltaCents: number) {
  await getUserWallet(visitorId)
  if (deltaCents < 0) {
    const current = await getUserBalanceCents(visitorId)
    if (current + deltaCents < 0) throw new Error("Insufficient balance")
  }
  await db
    .update(userWallets)
    .set({ balanceCents: sql`${userWallets.balanceCents} + ${deltaCents}` })
    .where(eq(userWallets.visitorId, visitorId))
}

export async function creditUserBalance(visitorId: string, amountCents: number) {
  if (amountCents <= 0) throw new Error("Amount must be positive")
  await adjustUserBalance(visitorId, amountCents)
}

export async function listUserWallets() {
  return db.select().from(userWallets).orderBy(sql`${userWallets.lastActiveAt} desc`)
}

export async function getTotalUserWalletBalance() {
  const [result] = await db.select({ total: sql<string>`coalesce(sum(${userWallets.balanceCents}), 0)` }).from(userWallets)
  return Number(result?.total ?? 0)
}

export async function setUserBanned(visitorId: string, isBanned: boolean) {
  await getUserWallet(visitorId)
  await db.update(userWallets).set({ isBanned }).where(eq(userWallets.visitorId, visitorId))
}

export async function touchUserActivity(visitorId: string) {
  await db
    .update(userWallets)
    .set({ lastActiveAt: new Date() })
    .where(eq(userWallets.visitorId, visitorId))
}
