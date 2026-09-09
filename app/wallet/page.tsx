import { WalletIcon } from "lucide-react"
import { ShopShell } from "@/components/shop/shell"
import { BackHeader } from "@/components/shop/back-header"
import { TopupTrigger } from "@/components/shop/topup-trigger"
import { WalletTransactionItem } from "@/components/shop/wallet-transaction-item"
import { getWallet, getWalletTransactions } from "@/lib/data/wallet"
import { getVisitorId } from "@/lib/visitor"
import { formatCents } from "@/lib/format"

export default async function WalletPage() {
  const visitorId = await getVisitorId()
  const [wallet, transactions] = await Promise.all([getWallet(visitorId), getWalletTransactions(visitorId)])

  return (
    <ShopShell>
      <BackHeader title="Wallet" />

      <div className="mx-4 mt-4 rounded-2xl border border-border bg-gradient-to-br from-primary/20 via-card to-card p-5">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <WalletIcon className="size-4" /> Total Balance
        </div>
        <p className="mt-2 text-3xl font-bold text-foreground">{formatCents(wallet.balanceCents)}</p>
      </div>

      <div className="mx-4 mt-4">
        <TopupTrigger />
      </div>

      <section className="mt-6 px-4">
        <h2 className="text-sm font-semibold text-foreground">Recent Transactions</h2>
        <div className="mt-3 flex flex-col gap-2.5">
          {transactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            transactions.map((tx) => <WalletTransactionItem key={tx.id} transaction={tx} />)
          )}
        </div>
      </section>
    </ShopShell>
  )
}
