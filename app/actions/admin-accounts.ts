"use server"

import { revalidatePath } from "next/cache"
import { eq, desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { adminUsers, adminRoles } from "@/lib/db/schema"
import { requirePermission, requireAdmin } from "@/lib/admin-auth"
import { hashPassword } from "@/lib/password"
import { logAdminAction } from "@/lib/audit"

export async function listAdmins() {
  await requirePermission("admins.manage")
  return db
    .select({
      id: adminUsers.id,
      username: adminUsers.username,
      isOwner: adminUsers.isOwner,
      isActive: adminUsers.isActive,
      telegramId: adminUsers.telegramId,
      createdAt: adminUsers.createdAt,
      lastLoginAt: adminUsers.lastLoginAt,
      roleId: adminUsers.roleId,
      roleName: adminRoles.name,
    })
    .from(adminUsers)
    .innerJoin(adminRoles, eq(adminUsers.roleId, adminRoles.id))
    .orderBy(desc(adminUsers.createdAt))
}

export async function createAdminAction(formData: FormData) {
  const session = await requirePermission("admins.manage")

  const username = String(formData.get("username") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const roleId = Number(formData.get("roleId"))
  const telegramId = String(formData.get("telegramId") ?? "").trim() || null

  if (!username || username.length < 3) throw new Error("Username must be at least 3 characters")
  if (!password || password.length < 8) throw new Error("Password must be at least 8 characters")
  if (!Number.isFinite(roleId)) throw new Error("A role is required")

  const [existing] = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.username, username))
  if (existing) throw new Error("Username already taken")

  const [created] = await db
    .insert(adminUsers)
    .values({
      username,
      passwordHash: hashPassword(password),
      roleId,
      telegramId,
      isOwner: false,
      isActive: true,
    })
    .returning()

  await logAdminAction(session, "admin.create", { targetType: "admin_user", targetId: created.id, metadata: { username } })
  revalidatePath("/admin/admins")
}

export async function toggleAdminActiveAction(id: number, isActive: boolean) {
  const session = await requirePermission("admins.manage")

  const [target] = await db.select().from(adminUsers).where(eq(adminUsers.id, id))
  if (!target) throw new Error("Admin not found")
  if (target.isOwner) throw new Error("Cannot deactivate the owner account")

  await db.update(adminUsers).set({ isActive }).where(eq(adminUsers.id, id))
  await logAdminAction(session, isActive ? "admin.activate" : "admin.deactivate", {
    targetType: "admin_user",
    targetId: id,
    metadata: { username: target.username },
  })
  revalidatePath("/admin/admins")
}

export async function deleteAdminAction(id: number) {
  const session = await requirePermission("admins.manage")

  const [target] = await db.select().from(adminUsers).where(eq(adminUsers.id, id))
  if (!target) throw new Error("Admin not found")
  if (target.isOwner) throw new Error("Cannot delete the owner account")
  if (target.id === session.adminId) throw new Error("Cannot delete your own account")

  await db.delete(adminUsers).where(eq(adminUsers.id, id))
  await logAdminAction(session, "admin.delete", { targetType: "admin_user", targetId: id, metadata: { username: target.username } })
  revalidatePath("/admin/admins")
}

export async function changeAdminRoleAction(id: number, roleId: number) {
  const session = await requirePermission("admins.manage")

  const [target] = await db.select().from(adminUsers).where(eq(adminUsers.id, id))
  if (!target) throw new Error("Admin not found")
  if (target.isOwner) throw new Error("Cannot change the owner's role")

  await db.update(adminUsers).set({ roleId }).where(eq(adminUsers.id, id))
  await logAdminAction(session, "admin.change_role", { targetType: "admin_user", targetId: id, metadata: { roleId } })
  revalidatePath("/admin/admins")
}

export async function listRolesForSelect() {
  await requireAdmin()
  return db.select({ id: adminRoles.id, name: adminRoles.name }).from(adminRoles).orderBy(adminRoles.name)
}
