"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { loginAdmin, verifyAdminPassword } from "@/lib/admin-auth"

export function AdminLoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      // Try real per-admin login first; fall back to the one-time bootstrap password
      // path (only works when no admin accounts exist yet) if username is blank.
      const ok = username.trim() ? await loginAdmin(username.trim(), password) : await verifyAdminPassword(password)
      if (!ok) {
        setError("Incorrect username or password")
        return
      }
      router.push("/admin/dashboard")
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Lock className="size-5" />
        </div>
        <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
        <p className="text-xs text-muted-foreground">Sign in with your admin account.</p>
      </div>

      <Input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username (leave blank for first-time setup)"
        autoFocus
        autoCapitalize="none"
        autoComplete="username"
        className="bg-secondary"
      />
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        autoComplete="current-password"
        className="bg-secondary"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button type="submit" disabled={pending || !password}>
        {pending ? "Checking..." : "Sign in"}
      </Button>
    </form>
  )
}
