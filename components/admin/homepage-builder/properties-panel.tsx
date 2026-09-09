"use client"

import { useState } from "react"
import type { HomepageBlockData } from "@/components/admin/homepage-builder/builder"

interface ProductOption {
  id: number
  name: string
  categoryName: string
}

interface CategoryOption {
  id: number
  name: string
}

const BLOCK_TITLES: Record<string, string> = {
  hero_banner: "Hero Banner",
  category_grid: "Category Grid",
  product_rail: "Product Rail",
  promo_banner: "Promo Banner",
}

export function BlockPropertiesPanel({
  block,
  products,
  categories,
  onSave,
}: {
  block: HomepageBlockData
  products: ProductOption[]
  categories: CategoryOption[]
  onSave: (config: Record<string, unknown>) => void
}) {
  const [config, setConfig] = useState<Record<string, unknown>>(block.config)
  const [dirty, setDirty] = useState(false)

  function update(key: string, value: unknown) {
    setConfig((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  function handleSave() {
    onSave(config)
    setDirty(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{BLOCK_TITLES[block.type] ?? block.type}</h2>
        <button
          type="button"
          disabled={!dirty}
          onClick={handleSave}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
        >
          Save changes
        </button>
      </div>

      {block.type === "hero_banner" && (
        <div className="flex flex-col gap-3">
          <Field label="Title" value={config.title as string} onChange={(v) => update("title", v)} />
          <Field label="Subtitle" value={config.subtitle as string} onChange={(v) => update("subtitle", v)} textarea />
          <Field label="Image URL (optional)" value={(config.imageUrl as string) ?? ""} onChange={(v) => update("imageUrl", v)} />
          <Field label="Button text" value={config.buttonText as string} onChange={(v) => update("buttonText", v)} />
          <Field label="Button link" value={config.buttonLink as string} onChange={(v) => update("buttonLink", v)} />
        </div>
      )}

      {block.type === "category_grid" && (
        <div className="flex flex-col gap-3">
          <Field label="Section title" value={config.title as string} onChange={(v) => update("title", v)} />
          <p className="text-[11px] text-muted-foreground">
            Shows all {categories.length} categories automatically, in their configured order.
          </p>
        </div>
      )}

      {block.type === "product_rail" && (
        <div className="flex flex-col gap-3">
          <Field label="Section title" value={config.title as string} onChange={(v) => update("title", v)} />
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-muted-foreground">Source</label>
            <select
              value={(config.mode as string) ?? "popular"}
              onChange={(e) => update("mode", e.target.value)}
              className="rounded-md border border-border bg-secondary px-2 py-1.5 text-xs text-foreground outline-none"
            >
              <option value="popular">Most popular</option>
              <option value="latest">Latest</option>
              <option value="manual">Manual selection</option>
            </select>
          </div>
          {config.mode === "manual" && (
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-muted-foreground">Products</label>
              <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-secondary p-2">
                {products.map((p) => {
                  const selectedIds = Array.isArray(config.productIds) ? (config.productIds as number[]) : []
                  const checked = selectedIds.includes(p.id)
                  return (
                    <label key={p.id} className="flex items-center gap-2 py-1 text-xs text-foreground">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...selectedIds, p.id]
                            : selectedIds.filter((id) => id !== p.id)
                          update("productIds", next)
                        }}
                        className="size-3.5"
                      />
                      {p.name} <span className="text-[10px] text-muted-foreground">({p.categoryName})</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {block.type === "promo_banner" && (
        <div className="flex flex-col gap-3">
          <Field label="Banner text" value={config.text as string} onChange={(v) => update("text", v)} />
          <Field label="Promo code (optional)" value={(config.code as string) ?? ""} onChange={(v) => update("code", v)} />
          <Field label="Link" value={config.link as string} onChange={(v) => update("link", v)} />
        </div>
      )}

      <StyleControls
        style={(config.style as Record<string, unknown>) ?? {}}
        onChange={(style) => update("style", style)}
      />
    </div>
  )
}

function StyleControls({
  style,
  onChange,
}: {
  style: Record<string, unknown>
  onChange: (style: Record<string, unknown>) => void
}) {
  function set(key: string, value: unknown) {
    onChange({ ...style, [key]: value })
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3">
      <p className="text-[11px] font-medium text-foreground">Section style</p>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-medium text-muted-foreground">Background color</label>
        <div className="flex items-center gap-2">
          <input
            value={(style.backgroundColor as string) ?? ""}
            onChange={(e) => set("backgroundColor", e.target.value)}
            placeholder="e.g. oklch(0.2 0.02 260) or transparent"
            className="flex-1 rounded-md border border-border bg-secondary px-2 py-1.5 text-xs text-foreground outline-none"
          />
          {style.backgroundColor ? (
            <button
              type="button"
              onClick={() => set("backgroundColor", "")}
              className="text-[10px] text-muted-foreground underline"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-medium text-muted-foreground">Alignment</label>
        <select
          value={(style.align as string) ?? "left"}
          onChange={(e) => set("align", e.target.value)}
          className="rounded-md border border-border bg-secondary px-2 py-1.5 text-xs text-foreground outline-none"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-medium text-muted-foreground">Padding</label>
        <select
          value={(style.padding as string) ?? "md"}
          onChange={(e) => set("padding", e.target.value)}
          className="rounded-md border border-border bg-secondary px-2 py-1.5 text-xs text-foreground outline-none"
        >
          <option value="none">None</option>
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
        </select>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  textarea?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium text-muted-foreground">{label}</label>
      {textarea ? (
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="rounded-md border border-border bg-secondary px-2 py-1.5 text-xs text-foreground outline-none"
        />
      ) : (
        <input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-md border border-border bg-secondary px-2 py-1.5 text-xs text-foreground outline-none"
        />
      )}
    </div>
  )
}
