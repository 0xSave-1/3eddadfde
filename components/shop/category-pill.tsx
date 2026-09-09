import Link from "next/link"
import { getCategoryIcon } from "@/lib/icons"
import { cn } from "@/lib/utils"

export function CategoryPill({
  name,
  slug,
  icon,
  active,
}: {
  name: string
  slug: string
  icon: string
  active?: boolean
}) {
  const Icon = getCategoryIcon(icon)

  return (
    <Link
      href={`/catalog?category=${slug}`}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-foreground hover:border-primary/40",
      )}
    >
      <Icon className="size-5" strokeWidth={1.75} />
      <span className="text-[11px] font-medium leading-tight">{name}</span>
    </Link>
  )
}
