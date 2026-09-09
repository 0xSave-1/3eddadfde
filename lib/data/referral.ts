import { db } from "@/lib/db"
import { referralRewards, telegramUsers } from "@/lib/db/schema"
import { desc, eq, sql } from "drizzle-orm"
import { randomBytes } from "node:crypto"

const REFERRAL_REWARD_PERCENT = 5

function generateReferralCode() {
  return randomBytes(4).toString("hex").toUpperCase()
}

export async function getOrCreateTelegramUser(visitorId: string, referredByCode?: string | null) {
  const [existing] = await db.select().from(telegramUsers).where(eq(telegramUsers.visitorId, visitorId))
  if (existing) return existing

  let code = generateReferralCode()
  // Extremely unlikely collision, but guard anyway.
  for (let attempts = 0; attempts < 5; attempts++) {
    const [clash] = await db.select().from(telegramUsers).where(eq(telegramUsers.referralCode, code))
    if (!clash) break
    code = generateReferralCode()
  }

  const [row] = await db
    .insert(telegramUsers)
    .values({
      visitorId,
      referralCode: code,
      referredByCode: referredByCode ?? null,
    })
    .returning()
  return row
}

export async function linkTelegramAccount(visitorId: string, telegramId: string, username: string | null) {
  const [existing] = await db.select().from(telegramUsers).where(eq(telegramUsers.visitorId, visitorId))
  if (existing) {
    await db.update(telegramUsers).set({ telegramId, username }).where(eq(telegramUsers.visitorId, visitorId))
  } else {
    await getOrCreateTelegramUser(visitorId)
    await db.update(telegramUsers).set({ telegramId, username }).where(eq(telegramUsers.visitorId, visitorId))
  }
}

export async function getTelegramChatId(visitorId: string) {
  const [user] = await db.select().from(telegramUsers).where(eq(telegramUsers.visitorId, visitorId))
  return user?.telegramId ?? null
}

export async function getReferralStats(visitorId: string) {
  const [user] = await db.select().from(telegramUsers).where(eq(telegramUsers.visitorId, visitorId))
  if (!user) return { referralCode: null, totalReferred: 0, totalEarnedCents: 0, pendingCents: 0 }

  const [referredCountRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(telegramUsers)
    .where(eq(telegramUsers.referredByCode, user.referralCode))

  const rewardRows = await db
    .select()
    .from(referralRewards)
    .where(eq(referralRewards.referrerVisitorId, visitorId))

  const totalEarnedCents = rewardRows
    .filter((r) => r.status === "paid")
    .reduce((sum, r) => sum + r.rewardCents, 0)
  const pendingCents = rewardRows.filter((r) => r.status === "pending").reduce((sum, r) => sum + r.rewardCents, 0)

  return {
    referralCode: user.referralCode,
    totalReferred: Number(referredCountRow?.count ?? 0),
    totalEarnedCents,
    pendingCents,
  }
}

/**
 * Credits the referrer of `refereeVisitorId` (if any) once an order is paid.
 * Reward is a percentage of the order subtotal, marked paid immediately since
 * wallet crediting happens in the same flow that calls this.
 */
export async function creditReferralForOrder(refereeVisitorId: string, orderId: number, orderSubtotalCents: number) {
  const [referee] = await db.select().from(telegramUsers).where(eq(telegramUsers.visitorId, refereeVisitorId))
  if (!referee?.referredByCode) return null

  const [referrer] = await db.select().from(telegramUsers).where(eq(telegramUsers.referralCode, referee.referredByCode))
  if (!referrer) return null

  const rewardCents = Math.round((orderSubtotalCents * REFERRAL_REWARD_PERCENT) / 100)
  if (rewardCents <= 0) return null

  const [row] = await db
    .insert(referralRewards)
    .values({
      referrerVisitorId: referrer.visitorId,
      refereeVisitorId,
      rewardCents,
      status: "paid",
      orderId,
    })
    .returning()
  return row
}

export async function listReferralRewards() {
  return db.select().from(referralRewards).orderBy(desc(referralRewards.createdAt)).limit(50)
}
