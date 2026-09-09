import type React from "react"
import { BottomNav } from "@/components/shop/bottom-nav"

export function ShopShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[480px] bg-background pb-24">
      {children}
      <BottomNav />
    </div>
  )
}
