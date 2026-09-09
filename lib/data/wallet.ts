import { db } from "@/lib/db"
import { userWallets, walletTransactions } from "@/lib/db/schema"
import { desc, eq, sql } from "drizzle-orm"

export async function getWallet(visitorId: string) {
  const rows = await db.select().from(userWallets).where(eq(userWallets.visitorId, visitorId))
  if (rows[0]) return rows[0]
  const inserted = await db.insert(userWallets).values({ visitorId, balanceCents: 0 }).returning()
  return inserted[0]
}

export async function getWalletTransactions(visitorId: string, limit = 20) {
  return db.select().from(walletTransactions).where(eq(walletTransactions.visitorId, visitorId)).orderBy(desc(walletTransactions.createdAt)).limit(limit)
}

export async function getWalletTransactionById(id: number, visitorId: string) {
  const rows = await db.select().from(walletTransactions).where(sql`${walletTransactions.id} = ${id} and ${walletTransactions.visitorId} = ${visitorId}`)
  return rows[0] ?? null
}

export async function adjustWalletBalance(visitorId: string, deltaCents: number, description: string, type: string) {
  const current = await getWallet(visitorId)
  await db.update(userWallets).set({ balanceCents: sql`${userWallets.balanceCents} + ${deltaCents}` }).where(eq(userWallets.id, current.id))
  await db.insert(walletTransactions).values({
    type,
    amountCents: deltaCents,
    description,
    status: "completed",
    visitorId,
  })
}

export async function createPendingTopup(visitorId: string, amountCents: number) {
  const [row] = await db
    .insert(walletTransactions)
    .values({
      type: "topup",
      amountCents,
      description: "Wallet top-up",
      status: "pending",
      visitorId,
    })
    .returning()
  return row
}

export async function attachTopupSession(transactionId: number, stripeSessionId: string) {
  await db.update(walletTransactions).set({ stripeSessionId }).where(eq(walletTransactions.id, transactionId))
}

export async function completeTopupBySession(stripeSessionId: string, visitorId: string) {
  const rows = await db.select().from(walletTransactions).where(sql`${walletTransactions.stripeSessionId} = ${stripeSessionId} and ${walletTransactions.visitorId} = ${visitorId}`)
  const tx = rows[0]
  if (!tx || tx.status === "completed") return null

  const current = await getWallet(visitorId)
  await db
    .update(userWallets)
    .set({ balanceCents: sql`${userWallets.balanceCents} + ${tx.amountCents}` })
    .where(eq(userWallets.id, current.id))
  await db.update(walletTransactions).set({ status: "completed" }).where(eq(walletTransactions.id, tx.id))
  return tx
}
