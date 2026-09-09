"use client"

import { useRef, useState, useTransition } from "react"
import { Trash2, ShieldPlus, Lock } from "lucide-react"
import { createRoleAction, deleteRoleAction, updateRolePermissionsAction } from "@/app/actions/admin-roles"
import { PERMISSIONS, PERMISSION_LABELS, type Permission } from "@/lib/permissions"

interface RoleRow {
  id: number
  name: string
  isSystem: boolean
  permissions: unknown
}

function permsOf(role: RoleRow): string[] {
  return Array.isArray(role.permissions) ? (role.permissions as string[]) : []
}

export function RolesManager({ roles }: { roles: RoleRow[] }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const createFormRef = useRef<HTMLFormElement>(null)

  function handleCreate(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await createRoleAction(formData)
        createFormRef.current?.reset()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create role")
      }
    })
  }

  function handleUpdate(id: number, formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await updateRolePermissionsAction(id, formData)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update role")
      }
    })
  }

  function handleDelete(id: number) {
    setError(null)
    startTransition(async () => {
      try {
        await deleteRoleAction(id)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete role")
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-xs text-destructive">{error}</p>}

      <form ref={createFormRef} action={handleCreate} className="rounded-xl border border-border bg-secondary p-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-muted-foreground">New role name</label>
            <input
              name="name"
              required
              placeholder="support"
              className="w-40 rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            <ShieldPlus className="size-3.5" /> Create role
          </button>
        </div>
        <PermissionGrid namePrefix="" />
      </form>

      <div className="flex flex-col gap-4">
        {roles.map((role) => (
          <div key={role.id} className="overflow-hidden rounded-xl border border-border">
            <div className="flex items-center justify-between bg-secondary px-4 py-2.5">
              <p className="flex items-center gap-1.5 text-sm font-semibold capitalize text-foreground">
                {role.name}
                {role.isSystem && <Lock className="size-3 text-muted-foreground" />}
              </p>
              {!role.isSystem && (
                <button
                  type="button"
                  aria-label={`Delete role ${role.name}`}
                  disabled={pending}
                  onClick={() => handleDelete(role.id)}
                  className="text-muted-foreground hover:text-destructive disabled:opacity-40"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
            {role.name === "owner" ? (
              <p className="px-4 py-4 text-xs text-muted-foreground">
                The owner role always has full access and cannot be modified.
              </p>
            ) : (
              <form action={(fd) => handleUpdate(role.id, fd)} className="px-4 py-4">
                <PermissionGrid namePrefix="" defaultChecked={permsOf(role)} />
                <button
                  type="submit"
                  disabled={pending}
                  className="mt-3 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                >
                  Save permissions
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function PermissionGrid({
  namePrefix,
  defaultChecked = [],
}: {
  namePrefix: string
  defaultChecked?: string[]
}) {
  return (
    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {PERMISSIONS.map((perm: Permission) => (
        <label key={perm} className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground">
          <input
            type="checkbox"
            name={`${namePrefix}perm_${perm}`}
            defaultChecked={defaultChecked.includes(perm)}
            className="size-3.5"
          />
          {PERMISSION_LABELS[perm]}
        </label>
      ))}
    </div>
  )
}
