import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getAdminSession } from "@/lib/admin-auth"
import { hasPermission } from "@/lib/permissions"
import { listUsersForAdmin } from "@/app/actions/admin-users-registry"
import { UserRegistryManager } from "@/components/admin/user-registry-manager"

export default async function AdminUsersPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin")
  if (!hasPermission(session.permissions, "users.manage")) redirect("/admin/dashboard")

  const users = await listUsersForAdmin()

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-6">
      <Link href="/admin/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Dashboard
      </Link>
      <h1 className="font-sans text-xl font-bold text-foreground">User registry</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every visitor who has opened the shop — balance, orders, activity, and access.
      </p>
      <UserRegistryManager initialUsers={users} />
    </main>
  )
}
