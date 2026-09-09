"use client"

import { useRef, useState, useTransition } from "react"
import { Trash2, UserPlus } from "lucide-react"
import {
  createAdminAction,
  deleteAdminAction,
  toggleAdminActiveAction,
  changeAdminRoleAction,
} from "@/app/actions/admin-accounts"

interface AdminRow {
  id: number
  username: string
  isOwner: boolean
  isActive: boolean
  telegramId: string | null
  roleId: number
  roleName: string
  createdAt: Date
  lastLoginAt: Date | null
}

interface RoleOption {
  id: number
  name: string
}

export function AdminAccountsManager({
  admins,
  roles,
  currentAdminId,
}: {
  admins: AdminRow[]
  roles: RoleOption[]
  currentAdminId: number
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleCreate(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await createAdminAction(formData)
        formRef.current?.reset()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create admin")
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        ref={formRef}
        action={handleCreate}
        className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-secondary p-3"
      >
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-muted-foreground">Username</label>
          <input
            name="username"
            required
            placeholder="jane"
            className="w-32 rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-muted-foreground">Password</label>
          <input
            name="password"
            type="password"
            required
            placeholder="At least 8 characters"
            className="w-40 rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-muted-foreground">Role</label>
          <select
            name="roleId"
            required
            className="rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none"
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-muted-foreground">Telegram ID (optional)</label>
          <input
            name="telegramId"
            placeholder="123456789"
            className="w-32 rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
        >
          <UserPlus className="size-3.5" /> Create admin
        </button>
      </form>
      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-xs">
          <thead className="bg-secondary text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5 font-medium">Username</th>
              <th className="px-3 py-2.5 font-medium">Role</th>
              <th className="px-3 py-2.5 font-medium">Telegram</th>
              <th className="px-3 py-2.5 font-medium">Last login</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {admins.map((admin) => (
              <tr key={admin.id}>
                <td className="px-3 py-2.5 font-medium text-foreground">
                  {admin.username}
                  {admin.isOwner && (
                    <span className="ml-1.5 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                      Owner
                    </span>
                  )}
                  {admin.id === currentAdminId && <span className="ml-1.5 text-[10px] text-muted-foreground">(you)</span>}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {admin.isOwner ? (
                    <span className="capitalize">{admin.roleName}</span>
                  ) : (
                    <select
                      defaultValue={admin.roleId}
                      disabled={pending}
                      onChange={(e) => startTransition(() => changeAdminRoleAction(admin.id, Number(e.target.value)))}
                      className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground outline-none"
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">{admin.telegramId || "—"}</td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : "Never"}
                </td>
                <td className="px-3 py-2.5">
                  <button
                    type="button"
                    disabled={admin.isOwner || pending}
                    onClick={() => startTransition(() => toggleAdminActiveAction(admin.id, !admin.isActive))}
                    className={
                      admin.isActive
                        ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-500 disabled:opacity-60"
                        : "rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground disabled:opacity-60"
                    }
                  >
                    {admin.isActive ? "Active" : "Disabled"}
                  </button>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button
                    type="button"
                    aria-label={`Delete admin ${admin.username}`}
                    disabled={admin.isOwner || admin.id === currentAdminId || pending}
                    onClick={() => startTransition(() => deleteAdminAction(admin.id))}
                    className="text-muted-foreground hover:text-destructive disabled:opacity-40"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
