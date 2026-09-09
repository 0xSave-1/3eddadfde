"use client"

import { useRef, useTransition } from "react"
import { PackagePlus } from "lucide-react"
import { createProductAction } from "@/app/actions/admin-products"

export function ProductAddForm({ categories }: { categories: { id: number; name: string }[] }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, startTransition] = useTransition()

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          await createProductAction(formData)
          formRef.current?.reset()
        })
      }
      className="flex flex-wrap items-end gap-2 border-b border-border bg-secondary p-3"
    >
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-medium text-muted-foreground">Name</label>
        <input
          name="name"
          required
          placeholder="Product name"
          className="w-40 rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-medium text-muted-foreground">Category</label>
        <select
          name="category"
          required
          className="w-32 rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-medium text-muted-foreground">Price (cents)</label>
        <input
          name="priceCents"
          type="number"
          min={1}
          required
          placeholder="1999"
          className="w-24 rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-medium text-muted-foreground">Image URL</label>
        <input
          name="imageUrl"
          placeholder="/products/example.png"
          className="w-40 rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-medium text-muted-foreground">Description</label>
        <input
          name="description"
          placeholder="Short description"
          className="w-48 rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
      >
        <PackagePlus className="size-3.5" /> Add product
      </button>
    </form>
  )
}
