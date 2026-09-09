"use server"

import { cookies } from "next/headers"
import crypto from "node:crypto"
import { db } from "@/lib/db"
import { adminUsers, adminRoles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { hasPermission, type Permission } from "@/lib/permissions"
import { hashPassword, verifyPassword } from "@/lib/password"

const COOKIE_NAME = "nexora_admin_session"
const SESSION_TTL_SECONDS = 60 * 60 * 12

type SessionPayload = {
  adminId: number
  username: string
  isOwner: boolean
  exp: number
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not configured")
  return secret
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("hex")
}

function encodeSession(payload: SessionPayload) {
  const json = JSON.stringify(payload)
  const base = Buffer.from(json).toString("base64url")
  const signature = sign(base)
  return `${base}.${signature}`
}

function decodeSession(token: string): SessionPayload | null {
  const [base, signature] = token.split(".")
  if (!base || !signature) return null
  if (sign(base) !== signature) return null
  try {
    const payload = JSON.parse(Buffer.from(base, "base64url").toString("utf8")) as SessionPayload
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

async function setSessionCookie(payload: Omit<SessionPayload, "exp">) {
  const cookieStore = await cookies()
  const token = encodeSession({ ...payload, exp: Date.now() + SESSION_TTL_SECONDS * 1000 })
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  })
}

/** Ensures the owner role + owner admin account exist. Safe to call repeatedly. */
export async function ensureOwnerBootstrap() {
  const [ownerRole] = await db.select().from(adminRoles).where(eq(adminRoles.name, "owner")).limit(1)
  if (!ownerRole) return null

  const existingOwners = await db.select().from(adminUsers).where(eq(adminUsers.isOwner, true))
  if (existingOwners.length > 0) return existingOwners[0]

  const bootstrapPassword = process.env.ADMIN_PASSWORD
  if (!bootstrapPassword) return null

  const [created] = await db
    .insert(adminUsers)
    .values({
      username: "owner",
      passwordHash: hashPassword(bootstrapPassword),
      roleId: ownerRole.id,
      telegramId: process.env.OWNER_TELEGRAM_ID || null,
      isOwner: true,
      isActive: true,
    })
    .returning()

  return created
}

export type AdminSession = {
  adminId: number
  username: string
  isOwner: boolean
  permissions: string[]
  roleName: string
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  const payload = decodeSession(token)
  if (!payload) return null

  const rows = await db
    .select({
      id: adminUsers.id,
      username: adminUsers.username,
      isOwner: adminUsers.isOwner,
      isActive: adminUsers.isActive,
      roleName: adminRoles.name,
      permissions: adminRoles.permissions,
    })
    .from(adminUsers)
    .innerJoin(adminRoles, eq(adminUsers.roleId, adminRoles.id))
    .where(eq(adminUsers.id, payload.adminId))
    .limit(1)

  const row = rows[0]
  if (!row || !row.isActive) return null

  return {
    adminId: row.id,
    username: row.username,
    isOwner: row.isOwner,
    permissions: row.permissions as string[],
    roleName: row.roleName,
  }
}

export async function isAdminAuthenticated() {
  const session = await getAdminSession()
  return session !== null
}

export async function requireAdmin() {
  const session = await getAdminSession()
  if (!session) throw new Error("Not authenticated")
  return session
}

export async function requirePermission(permission: Permission) {
  const session = await requireAdmin()
  if (!hasPermission(session.permissions, permission)) {
    throw new Error(`Missing permission: ${permission}`)
  }
  return session
}

export async function loginAdmin(username: string, password: string) {
  await ensureOwnerBootstrap()

  const rows = await db
    .select({
      id: adminUsers.id,
      username: adminUsers.username,
      passwordHash: adminUsers.passwordHash,
      isOwner: adminUsers.isOwner,
      isActive: adminUsers.isActive,
    })
    .from(adminUsers)
    .where(eq(adminUsers.username, username))
    .limit(1)

  const row = rows[0]
  if (!row || !row.isActive) return false
  if (!verifyPassword(password, row.passwordHash)) return false

  await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, row.id))
  await setSessionCookie({ adminId: row.id, username: row.username, isOwner: row.isOwner })
  return true
}

/** Legacy single-password login, kept only as a bootstrap path when no admin accounts exist yet. */
export async function verifyAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) throw new Error("ADMIN_PASSWORD is not configured")

  const anyAdmins = await db.select({ id: adminUsers.id }).from(adminUsers).limit(1)
  if (anyAdmins.length > 0) {
    // Real accounts exist; bootstrap password login is disabled.
    return false
  }

  if (password !== expected) return false
  const owner = await ensureOwnerBootstrap()
  if (!owner) return false

  await setSessionCookie({ adminId: owner.id, username: owner.username, isOwner: owner.isOwner })
  return true
}

export async function adminLogout() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
