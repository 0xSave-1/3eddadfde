import { db } from "@/lib/db"
import { adminAuditLog } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
import type { AdminSession } from "@/lib/admin-auth"

export async function logAdminAction(
  actor: AdminSession,
  action: string,
  options?: { targetType?: string; targetId?: string | number; metadata?: Record<string, unknown> },
) {
  await db.insert(adminAuditLog).values({
    adminUserId: actor.adminId,
    actorUsername: actor.username,
    action,
    targetType: options?.targetType,
    targetId: options?.targetId !== undefined ? String(options.targetId) : undefined,
    metadata: options?.metadata ?? {},
  })
}

export async function getAuditLog(limit = 100) {
  return db.select().from(adminAuditLog).orderBy(desc(adminAuditLog.createdAt)).limit(limit)
}
