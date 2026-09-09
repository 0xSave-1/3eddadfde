import { redirect } from "next/navigation"
import { AdminLoginForm } from "@/components/admin/login-form"
import { isAdminAuthenticated } from "@/lib/admin-auth"

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect("/admin/dashboard")

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[480px] items-center justify-center bg-background px-6">
      <AdminLoginForm />
    </main>
  )
}
