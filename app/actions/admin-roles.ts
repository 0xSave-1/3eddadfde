"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { adminRoles, adminUsers } from "@/lib/db/schema"
import { requirePermission } from "@/lib/admin-auth"
import { logAdminAction } from "@/lib/audit"
import { PERMISSIONS } from "@/lib/permissions"

export async function listRoles() {
  await requirePermission("roles.manage")
  return db.select().from(adminRoles).orderBy(adminRoles.name)
}

export async function createRoleAction(formData: FormData) {
  const session = await requirePermission("roles.manage")

  const name = String(formData.get("name") ?? "").trim().toLowerCase()
  const permissions = PERMISSIONS.filter((p) => formData.get(`perm_${p}`) === "on")

  if (!name || name.length < 3) throw new Error("Role name must be at least 3 characters")

  const [existing] = await db.select({ id: adminRoles.id }).from(adminRoles).where(eq(adminRoles.name, name))
  if (existing) throw new Error("Role name already exists")

  const [created] = await db.insert(adminRoles).values({ name, isSystem: false, permissions }).returning()

  await logAdminAction(session, "role.create", { targetType: "admin_role", targetId: created.id, metadata: { name, permissions } })
  revalidatePath("/admin/roles")
}

export async function updateRolePermissionsAction(id: number, formData: FormData) {
  const session = await requirePermission("roles.manage")

  const [role] = await db.select().from(adminRoles).where(eq(adminRoles.id, id))
  if (!role) throw new Error("Role not found")
  if (role.name === "owner") throw new Error("The owner role cannot be modified")

  const permissions = PERMISSIONS.filter((p) => formData.get(`perm_${p}`) === "on")
  await db.update(adminRoles).set({ permissions }).where(eq(adminRoles.id, id))

  await logAdminAction(session, "role.update_permissions", { targetType: "admin_role", targetId: id, metadata: { permissions } })
  revalidatePath("/admin/roles")
}

export async function deleteRoleAction(id: number) {
  const session = await requirePermission("roles.manage")

  const [role] = await db.select().from(adminRoles).where(eq(adminRoles.id, id))
  if (!role) throw new Error("Role not found")
  if (role.isSystem) throw new Error("System roles cannot be deleted")

  const assignedAdmins = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.roleId, id))
  if (assignedAdmins.length > 0) throw new Error("Cannot delete a role that is assigned to admins")

  await db.delete(adminRoles).where(eq(adminRoles.id, id))
  await logAdminAction(session, "role.delete", { targetType: "admin_role", targetId: id, metadata: { name: role.name } })
  revalidatePath("/admin/roles")
}
