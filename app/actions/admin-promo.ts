"use server"

import { revalidatePath } from "next/cache"
import { requirePermission } from "@/lib/admin-auth"
import { logAdminAction } from "@/lib/audit"
import { createPromoCode, deletePromoCode, togglePromoCode } from "@/lib/data/promo"

export async function createPromoCodeAction(formData: FormData) {
  const session = await requirePermission("promos.manage")

  const code = String(formData.get("code") ?? "")
  const discountPercent = Number(formData.get("discountPercent") ?? 0)
  const maxUsesRaw = String(formData.get("maxUses") ?? "")
  const expiresAtRaw = String(formData.get("expiresAt") ?? "")

  if (!code.trim()) throw new Error("Code is required")
  if (!Number.isFinite(discountPercent) || discountPercent <= 0) throw new Error("Invalid discount")

  const created = await createPromoCode({
    code,
    discountPercent,
    maxUses: maxUsesRaw ? Math.max(1, Math.round(Number(maxUsesRaw))) : null,
    expiresAt: expiresAtRaw ? new Date(expiresAtRaw) : null,
  })

  await logAdminAction(session, "promo.create", { targetType: "promo_code", targetId: created?.id, metadata: { code, discountPercent } })
  revalidatePath("/admin/dashboard")
}

export async function togglePromoCodeAction(id: number, isActive: boolean) {
  const session = await requirePermission("promos.manage")
  await togglePromoCode(id, isActive)
  await logAdminAction(session, isActive ? "promo.activate" : "promo.deactivate", { targetType: "promo_code", targetId: id })
  revalidatePath("/admin/dashboard")
}

export async function deletePromoCodeAction(id: number) {
  const session = await requirePermission("promos.manage")
  await deletePromoCode(id)
  await logAdminAction(session, "promo.delete", { targetType: "promo_code", targetId: id })
  revalidatePath("/admin/dashboard")
}
