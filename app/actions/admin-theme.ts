"use server"

import { revalidatePath } from "next/cache"
import { requirePermission } from "@/lib/admin-auth"
import { logAdminAction } from "@/lib/audit"
import { updateThemeSettings } from "@/lib/data/theme"

export async function saveThemeSettings(tokens: Record<string, string>, fontSans: string) {
  const session = await requirePermission("theme.manage")
  await updateThemeSettings(tokens, fontSans)
  await logAdminAction(session, "theme.update", { metadata: { fontSans } })
  revalidatePath("/", "layout")
  revalidatePath("/admin/theme")
}
