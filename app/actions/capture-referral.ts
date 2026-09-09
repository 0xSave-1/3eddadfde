"use server"

import { db } from "@/lib/db"
import { telegramUsers } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getOrCreateTelegramUser } from "@/lib/data/referral"
import { getOrCreateVisitorId } from "@/lib/visitor"

export async function captureReferralCode(refCode: string) {
  const normalized = refCode.trim().toUpperCase()
  if (!normalized) return

  const visitorId = await getOrCreateVisitorId()
  const user = await getOrCreateTelegramUser(visitorId)

  // Ignore self-referrals and don't overwrite an existing referrer.
  if (user.referredByCode || user.referralCode === normalized) return

  const [referrer] = await db.select().from(telegramUsers).where(eq(telegramUsers.referralCode, normalized))
  if (!referrer) return

  await db.update(telegramUsers).set({ referredByCode: normalized }).where(eq(telegramUsers.visitorId, visitorId))
}
