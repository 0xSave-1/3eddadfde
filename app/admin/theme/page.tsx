import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getAdminSession } from "@/lib/admin-auth"
import { hasPermission } from "@/lib/permissions"
import { getThemeSettings } from "@/lib/data/theme"
import { ThemeEditor } from "@/components/admin/theme-editor"

export default async function AdminThemePage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin")
  if (!hasPermission(session.permissions, "theme.manage")) redirect("/admin/dashboard")

  const theme = await getThemeSettings()

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-6">
      <Link href="/admin/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Dashboard
      </Link>
      <h1 className="font-sans text-xl font-bold text-foreground">Theme</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Colors and font apply instantly across the whole storefront.
      </p>
      <ThemeEditor tokens={theme.tokens as Record<string, string>} fontSans={theme.fontSans} />
    </main>
  )
}
