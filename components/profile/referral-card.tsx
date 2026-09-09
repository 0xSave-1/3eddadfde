"use client"

import { useEffect, useState } from "react"
import { Check, Copy, Gift } from "lucide-react"
import { formatCents } from "@/lib/format"

interface ReferralCardProps {
  referralCode: string | null
  totalReferred: number
  totalEarnedCents: number
}

export function ReferralCard({ referralCode, totalReferred, totalEarnedCents }: ReferralCardProps) {
  const [copied, setCopied] = useState(false)
  // Start empty so the server-rendered markup and the client's first paint
  // match exactly, then fill in the real origin once mounted. Reading
  // window.location.origin directly during render causes a hydration
  // mismatch because the server has no window.
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  if (!referralCode) return null

  const referralLink = `${origin}/?ref=${referralCode}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-4 mt-5 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Gift className="size-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Invite friends, earn rewards</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Share your link. You earn 5% of every order your friends complete, credited to your wallet.
      </p>

      <div className="mt-3 flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
        <p className="flex-1 truncate text-xs font-medium text-foreground">{referralLink}</p>
        <button
          type="button"
          onClick={handleCopy}
          className="flex shrink-0 items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-[11px] font-semibold text-primary-foreground"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[11px] text-muted-foreground">Friends referred</p>
          <p className="mt-0.5 text-base font-bold text-foreground">{totalReferred}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Rewards earned</p>
          <p className="mt-0.5 text-base font-bold text-emerald-500">{formatCents(totalEarnedCents)}</p>
        </div>
      </div>
    </div>
  )
}
