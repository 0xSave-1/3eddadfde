import { db } from "@/lib/db"
import { botInstances, telegramUsers } from "@/lib/db/schema"
import { eq, isNotNull } from "drizzle-orm"

export async function listBotInstances() {
  return db.select().from(botInstances)
}

export async function addBotInstance(label: string, botToken: string) {
  const [created] = await db.insert(botInstances).values({ label, botToken }).returning()
  return created
}

export async function removeBotInstance(id: number) {
  await db.delete(botInstances).where(eq(botInstances.id, id))
}

export async function setBotInstanceActive(id: number, isActive: boolean) {
  await db.update(botInstances).set({ isActive }).where(eq(botInstances.id, id))
}

export async function getAllTelegramChatIds() {
  const rows = await db.select({ telegramId: telegramUsers.telegramId }).from(telegramUsers).where(isNotNull(telegramUsers.telegramId))
  return rows.map((r) => r.telegramId!).filter(Boolean)
}
