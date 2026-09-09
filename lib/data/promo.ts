import { db } from "@/lib/db"
import { promoCodes } from "@/lib/db/schema"
import { desc, eq, sql } from "drizzle-orm"

export async function listPromoCodes() {
  return db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt))
}

export async function createPromoCode(input: {
  code: string
  discountPercent: number
  maxUses: number | null
  expiresAt: Date | null
}) {
  const [row] = await db
    .insert(promoCodes)
    .values({
      code: input.code.trim().toUpperCase(),
      discountPercent: Math.max(1, Math.min(100, Math.round(input.discountPercent))),
      maxUses: input.maxUses,
      expiresAt: input.expiresAt,
    })
    .returning()
  return row
}

export async function togglePromoCode(id: number, isActive: boolean) {
  await db.update(promoCodes).set({ isActive }).where(eq(promoCodes.id, id))
}

export async function deletePromoCode(id: number) {
  await db.delete(promoCodes).where(eq(promoCodes.id, id))
}

/**
 * Validates a promo code against active status, expiry, and remaining uses.
 * Returns the discount percent (0 if invalid) so callers can compute the discount
 * without trusting client-supplied numbers.
 */
export async function validatePromoCode(code: string) {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return { valid: false, discountPercent: 0, reason: "empty" as const }

  const [promo] = await db.select().from(promoCodes).where(eq(promoCodes.code, normalized))
  if (!promo) return { valid: false, discountPercent: 0, reason: "not_found" as const }
  if (!promo.isActive) return { valid: false, discountPercent: 0, reason: "inactive" as const }
  if (promo.expiresAt && promo.expiresAt.getTime() < Date.now())
    return { valid: false, discountPercent: 0, reason: "expired" as const }
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses)
    return { valid: false, discountPercent: 0, reason: "exhausted" as const }

  return { valid: true, discountPercent: promo.discountPercent, reason: null }
}

export async function incrementPromoUsage(code: string) {
  const normalized = code.trim().toUpperCase()
  await db
    .update(promoCodes)
    .set({ usedCount: sql`${promoCodes.usedCount} + 1` })
    .where(eq(promoCodes.code, normalized))
}
