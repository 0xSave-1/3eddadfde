"use server"

import { revalidatePath } from "next/cache"
import { requirePermission } from "@/lib/admin-auth"
import { logAdminAction } from "@/lib/audit"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

const ALLOWED_STATUSES = ["pending", "paid", "completed", "failed"] as const

export async function updateOrderStatusAction(orderId: number, status: string) {
  const session = await requirePermission("orders.update_status")
  if (!ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
    throw new Error("Invalid status")
  }

  await db.update(orders).set({ status }).where(eq(orders.id, orderId))
  await logAdminAction(session, "order.update_status", { targetType: "order", targetId: orderId, metadata: { status } })
  revalidatePath("/admin/dashboard")
  revalidatePath("/orders")
}
