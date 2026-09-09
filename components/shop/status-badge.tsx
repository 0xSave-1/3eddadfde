import { cn } from "@/lib/utils"

const STYLES: Record<string, string> = {
  paid: "bg-emerald-500/15 text-emerald-500",
  completed: "bg-emerald-500/15 text-emerald-500",
  unpaid: "bg-amber-500/15 text-amber-500",
  pending: "bg-amber-500/15 text-amber-500",
  failed: "bg-destructive/15 text-destructive",
  topup: "bg-emerald-500/15 text-emerald-500",
  purchase: "bg-destructive/15 text-destructive",
  refund: "bg-sky-500/15 text-sky-500",
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
        STYLES[status] ?? "bg-secondary text-muted-foreground",
      )}
    >
      {status}
    </span>
  )
}
