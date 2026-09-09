import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getAdminSession } from "@/lib/admin-auth"
import { hasPermission } from "@/lib/permissions"
import { listRoles } from "@/app/actions/admin-roles"
import { RolesManager } from "@/components/admin/roles-manager"

export default async function RolesPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin")
  if (!hasPermission(session.permissions, "roles.manage")) redirect("/admin/dashboard")

  const roles = await listRoles()

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Back to dashboard
        </Link>
        <h1 className="mt-3 text-xl font-bold text-foreground">Roles & Permissions</h1>
        <p className="mt-1 text-xs text-muted-foreground">Define custom roles and control exactly what each one can do.</p>

        <div className="mt-6">
          <RolesManager roles={roles} />
        </div>
      </div>
    </main>
  )
}
