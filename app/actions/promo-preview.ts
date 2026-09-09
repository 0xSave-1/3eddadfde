"use server"

import { validatePromoCode } from "@/lib/data/promo"

export async function previewPromoCode(code: string) {
  const result = await validatePromoCode(code)
  return { valid: result.valid, discountPercent: result.discountPercent }
}
