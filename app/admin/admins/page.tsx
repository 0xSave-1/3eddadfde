import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getAdminSession } from "@/lib/admin-auth"
import { hasPermission } from "@/lib/permissions"
import { listAdmins, listRolesForSelect } from "@/app/actions/admin-accounts"
import { AdminAccountsManager } from "@/components/admin/admin-accounts-manager"

export default async function AdminsPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin")
  if (!hasPermission(session.permissions, "admins.manage")) redirect("/admin/dashboard")

  const [admins, roles] = await Promise.all([listAdmins(), listRolesForSelect()])

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Back to dashboard
        </Link>
        <h1 className="mt-3 text-xl font-bold text-foreground">Admin Accounts</h1>
        <p className="mt-1 text-xs text-muted-foreground">Create and manage admin accounts and their assigned roles.</p>

        <div className="mt-6">
          <AdminAccountsManager admins={admins} roles={roles} currentAdminId={session.adminId} />
        </div>
      </div>
    </main>
  )
}
