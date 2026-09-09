import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getAdminSession } from "@/lib/admin-auth"
import { hasPermission } from "@/lib/permissions"
import { getBotOverview, listMirrorBots } from "@/app/actions/admin-bots"
import { BotManager } from "@/components/admin/bot-manager"

export default async function AdminBotsPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin")
  if (!hasPermission(session.permissions, "bots.manage")) redirect("/admin/dashboard")

  const [primaryOverview, mirrors] = await Promise.all([getBotOverview(), listMirrorBots()])

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-6">
      <Link href="/admin/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Dashboard
      </Link>
      <h1 className="font-sans text-xl font-bold text-foreground">Bot control center</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Broadcast to every linked user, edit your bot&apos;s profile and commands, and run mirror bots that all point
        at this same shop.
      </p>
      <BotManager primaryOverview={primaryOverview} mirrors={mirrors} />
    </main>
  )
}
