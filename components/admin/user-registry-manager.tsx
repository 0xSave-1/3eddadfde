"use client"

import { useState, useTransition } from "react"
import { Ban, CheckCircle2, Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { adminAdjustBalance, adminSetUserBanned } from "@/app/actions/admin-users-registry"
import { formatCents } from "@/lib/format"

interface UserRow {
  visitorId: string
  balanceCents: number
  isBanned: boolean
  lastActiveAt: string | Date
  createdAt: string | Date
}

export function UserRegistryManager({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = users.filter((u) => u.visitorId.toLowerCase().includes(query.toLowerCase()))

  function updateLocal(visitorId: string, patch: Partial<UserRow>) {
    setUsers((prev) => prev.map((u) => (u.visitorId === visitorId ? { ...u, ...patch } : u)))
  }

  return (
    <div className="mt-5 flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by visitor ID…"
          className="pl-9"
          aria-label="Search users"
        />
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} users</p>

      <ul className="flex flex-col gap-2">
        {filtered.map((user) => (
          <UserCard
            key={user.visitorId}
            user={user}
            expanded={expanded === user.visitorId}
            onToggle={() => setExpanded((cur) => (cur === user.visitorId ? null : user.visitorId))}
            onUpdate={(patch) => updateLocal(user.visitorId, patch)}
          />
        ))}
        {filtered.length === 0 && <li className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No users found.</li>}
      </ul>
    </div>
  )
}

function UserCard({
  user,
  expanded,
  onToggle,
  onUpdate,
}: {
  user: UserRow
  expanded: boolean
  onToggle: () => void
  onUpdate: (patch: Partial<UserRow>) => void
}) {
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submitAdjustment(sign: 1 | -1) {
    const cents = Math.round(Number.parseFloat(amount || "0") * 100) * sign
    if (!cents) {
      setError("Enter an amount")
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await adminAdjustBalance(user.visitorId, cents, reason || (sign > 0 ? "Manual credit" : "Manual debit"))
        onUpdate({ balanceCents: user.balanceCents + cents })
        setAmount("")
        setReason("")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed")
      }
    })
  }

  function toggleBan() {
    startTransition(async () => {
      await adminSetUserBanned(user.visitorId, !user.isBanned)
      onUpdate({ isBanned: !user.isBanned })
    })
  }

  return (
    <li className="rounded-xl border border-border bg-card p-3.5">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-3 text-left">
        <div className="min-w-0">
          <p className="truncate font-mono text-xs text-foreground">{user.visitorId}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Last active {new Date(user.lastActiveAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {user.isBanned && (
            <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] font-medium text-destructive">Banned</span>
          )}
          <span className="text-sm font-semibold text-foreground">{formatCents(user.balanceCents)}</span>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 flex flex-col gap-2.5 border-t border-border pt-3">
          <div className="flex gap-2">
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount, e.g. 10.00"
              inputMode="decimal"
              className="flex-1"
              aria-label="Amount"
            />
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional)"
              className="flex-1"
              aria-label="Reason"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" disabled={pending} onClick={() => submitAdjustment(1)}>
              {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : "Credit"}
            </Button>
            <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => submitAdjustment(-1)}>
              Debit
            </Button>
            <Button type="button" size="sm" variant={user.isBanned ? "secondary" : "destructive"} disabled={pending} onClick={toggleBan}>
              {user.isBanned ? (
                <>
                  <CheckCircle2 className="mr-1.5 size-3.5" aria-hidden="true" /> Unban
                </>
              ) : (
                <>
                  <Ban className="mr-1.5 size-3.5" aria-hidden="true" /> Ban
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </li>
  )
}
