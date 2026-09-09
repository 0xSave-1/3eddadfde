import type { LucideIcon } from "lucide-react"

export function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: LucideIcon
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <Icon className="size-3.5 text-primary" />
      </div>
      <p className="mt-1.5 text-xl font-bold text-foreground">{value}</p>
    </div>
  )
}
