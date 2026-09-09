"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { adminLogout } from "@/lib/admin-auth"

export function AdminLogoutButton() {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await adminLogout()
          router.push("/admin")
          router.refresh()
        })
      }
    >
      <LogOut className="size-3.5" /> Log out
    </Button>
  )
}
