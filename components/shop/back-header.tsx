import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export function BackHeader({
  title,
  href = "/",
  action,
}: {
  title: string
  href?: string
  action?: React.ReactNode
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-3 py-3 supports-backdrop-filter:backdrop-blur-md">
      <Link
        href={href}
        aria-label="Go back"
        className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-foreground"
      >
        <ChevronLeft className="size-4" />
      </Link>
      <h1 className="flex-1 truncate text-sm font-semibold text-foreground">{title}</h1>
      {action}
    </header>
  )
}
