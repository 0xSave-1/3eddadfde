import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getAdminSession } from "@/lib/admin-auth"
import { hasPermission } from "@/lib/permissions"
import { getAuditLog } from "@/lib/audit"

export default async function AuditLogPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin")
  if (!hasPermission(session.permissions, "audit.view")) redirect("/admin/dashboard")

  const entries = await getAuditLog(150)

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Back to dashboard
        </Link>
        <h1 className="mt-3 text-xl font-bold text-foreground">Audit Log</h1>
        <p className="mt-1 text-xs text-muted-foreground">A record of sensitive actions taken across the admin panel.</p>

        <div className="mt-6 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5 font-medium">Time</th>
                <th className="px-3 py-2.5 font-medium">Actor</th>
                <th className="px-3 py-2.5 font-medium">Action</th>
                <th className="px-3 py-2.5 font-medium">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                    No actions logged yet.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-foreground">{entry.actorUsername}</td>
                    <td className="px-3 py-2.5 text-foreground">{entry.action}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {entry.targetType ? `${entry.targetType} #${entry.targetId}` : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
