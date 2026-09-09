import { ArrowDownLeft, ArrowUpRight, RotateCcw } from "lucide-react"
import { formatCents } from "@/lib/format"
import { cn } from "@/lib/utils"

interface WalletTransactionItemProps {
  transaction: {
    id: number
    type: string
    amountCents: number
    description: string
    status: string
    createdAt: Date | string
  }
}

const TYPE_ICON = {
  topup: ArrowDownLeft,
  purchase: ArrowUpRight,
  refund: RotateCcw,
} as const

export function WalletTransactionItem({ transaction }: WalletTransactionItemProps) {
  const Icon = TYPE_ICON[transaction.type as keyof typeof TYPE_ICON] ?? ArrowUpRight
  const positive = transaction.amountCents > 0
  const date = new Date(transaction.createdAt)

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          positive ? "bg-emerald-500/15 text-emerald-500" : "bg-destructive/15 text-destructive",
        )}
      >
        <Icon className="size-4" strokeWidth={2} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{transaction.description}</p>
        <p className="text-[11px] text-muted-foreground">
          {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {transaction.status}
        </p>
      </div>
      <span className={cn("text-sm font-semibold", positive ? "text-emerald-500" : "text-foreground")}>
        {positive ? "+" : ""}
        {formatCents(transaction.amountCents)}
      </span>
    </div>
  )
}
