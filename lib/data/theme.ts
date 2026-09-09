import { db } from "@/lib/db"
import { themeSettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { DEFAULT_TOKENS, type ThemeTokenKey } from "@/lib/theme-tokens"

export async function getThemeSettings() {
  const rows = await db.select().from(themeSettings).limit(1)
  if (rows[0]) return rows[0]
  const [created] = await db.insert(themeSettings).values({ tokens: DEFAULT_TOKENS, fontSans: "Geist" }).returning()
  return created
}

export async function updateThemeSettings(tokens: Record<string, string>, fontSans: string) {
  const current = await getThemeSettings()
  await db
    .update(themeSettings)
    .set({ tokens, fontSans, updatedAt: new Date() })
    .where(eq(themeSettings.id, current.id))
}


