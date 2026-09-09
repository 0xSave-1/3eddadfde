"use client"

import { useState, useTransition } from "react"
import { Eye, EyeOff, GripVertical, Image, LayoutGrid, ListOrdered, MonitorSmartphone, Plus, Ticket, Trash2 } from "lucide-react"
import {
  addHomepageBlockAction,
  deleteHomepageBlockAction,
  reorderHomepageBlocksAction,
  toggleHomepageBlockVisibilityAction,
  updateHomepageBlockConfigAction,
  type HomepageBlockType,
} from "@/app/actions/admin-homepage"
import { BlockPropertiesPanel } from "@/components/admin/homepage-builder/properties-panel"

export interface HomepageBlockData {
  id: number
  type: string
  sortOrder: number
  isVisible: boolean
  config: Record<string, unknown>
}

interface ProductOption { id: number; name: string; categoryName: string }
interface CategoryOption { id: number; name: string }

const BLOCK_META: Record<string, { label: string; icon: typeof Image }> = {
  hero_banner: { label: "Hero banner", icon: Image },
  category_grid: { label: "Category grid", icon: LayoutGrid },
  product_rail: { label: "Product rail", icon: ListOrdered },
  promo_banner: { label: "Promo banner", icon: Ticket },
}

export function HomepageBuilder({ initialBlocks, products, categories }: {
  initialBlocks: HomepageBlockData[]
  products: ProductOption[]
  categories: CategoryOption[]
}) {
  const [blocks, setBlocks] = useState(initialBlocks)
  const [selectedId, setSelectedId] = useState<number | null>(initialBlocks[0]?.id ?? null)
  const [dragId, setDragId] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()
  const selected = blocks.find((block) => block.id === selectedId) ?? null

  function reorder(targetId: number) {
    if (dragId === null || dragId === targetId) return
    const next = [...blocks]
    const from = next.findIndex((block) => block.id === dragId)
    const to = next.findIndex((block) => block.id === targetId)
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setBlocks(next)
    setDragId(null)
    startTransition(() => reorderHomepageBlocksAction(next.map((block) => block.id)))
  }

  function add(type: HomepageBlockType) {
    startTransition(async () => {
      const created = await addHomepageBlockAction(type)
      setBlocks((current) => [...current, { ...created, config: created.config as Record<string, unknown> }])
      setSelectedId(created.id)
    })
  }

  function remove(id: number) {
    startTransition(() => deleteHomepageBlockAction(id))
    setBlocks((current) => current.filter((block) => block.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  function toggle(id: number, isVisible: boolean) {
    startTransition(() => toggleHomepageBlockVisibilityAction(id, isVisible))
    setBlocks((current) => current.map((block) => (block.id === id ? { ...block, isVisible } : block)))
  }

  function save(id: number, config: Record<string, unknown>) {
    startTransition(() => updateHomepageBlockConfigAction(id, config))
    setBlocks((current) => current.map((block) => (block.id === id ? { ...block, config } : block)))
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/10">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground"><MonitorSmartphone className="size-4 text-primary" /> Mini App canvas</div>
        <span className="text-[10px] text-muted-foreground">Changes save to the live Telegram storefront</span>
      </div>
      <div className="grid min-h-[680px] grid-cols-1 lg:grid-cols-[250px_minmax(360px,1fr)_300px]">
        <aside className="border-b border-border p-3 lg:border-b-0 lg:border-r">
          <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Add section</p>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {(Object.keys(BLOCK_META) as HomepageBlockType[]).map((type) => {
              const Icon = BLOCK_META[type].icon
              return <button key={type} type="button" disabled={pending} onClick={() => add(type)} className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-2.5 py-2 text-left text-[11px] font-medium text-foreground hover:border-primary/60 disabled:opacity-50"><Plus className="size-3 text-primary" /><Icon className="size-3.5" />{BLOCK_META[type].label}</button>
            })}
          </div>
          <p className="px-1 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Layers</p>
          <div className="space-y-1">
            {blocks.length === 0 ? <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">Add a section to begin.</p> : blocks.map((block) => {
              const meta = BLOCK_META[block.type] ?? { label: block.type, icon: Image }
              const Icon = meta.icon
              return <div key={block.id} draggable onDragStart={() => setDragId(block.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => reorder(block.id)} onClick={() => setSelectedId(block.id)} className={`flex cursor-pointer items-center gap-1.5 rounded-lg border p-2 transition-colors ${selectedId === block.id ? "border-primary bg-primary/10" : "border-transparent hover:border-border hover:bg-secondary/70"} ${dragId === block.id ? "opacity-40" : ""}`}>
                <GripVertical className="size-3.5 shrink-0 cursor-grab text-muted-foreground" /><Icon className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-[11px] text-foreground">{meta.label}</span>
                <button type="button" aria-label={block.isVisible ? "Hide section" : "Show section"} disabled={pending} onClick={(event) => { event.stopPropagation(); toggle(block.id, !block.isVisible) }} className="text-muted-foreground hover:text-foreground">{block.isVisible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}</button>
                <button type="button" aria-label="Delete section" disabled={pending} onClick={(event) => { event.stopPropagation(); remove(block.id) }} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button>
              </div>
            })}
          </div>
        </aside>

        <section className="min-h-[500px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,.08),transparent_45%)] p-6 sm:p-10">
          <div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-[2rem] border-[7px] border-zinc-950 bg-background shadow-2xl shadow-black/40">
            <div className="mx-auto mt-2 h-4 w-24 rounded-full bg-zinc-950" />
            <div className="mt-2 flex items-center justify-between border-y border-border px-4 py-2.5"><span className="text-xs font-semibold">NEXORA</span><span className="rounded-full bg-primary/15 px-2 py-1 text-[10px] font-semibold text-primary">$0.00</span></div>
            <div className="max-h-[500px] min-h-[420px] overflow-y-auto pb-5">
              {blocks.filter((block) => block.isVisible).map((block) => <CanvasBlock key={block.id} block={block} selected={block.id === selectedId} onSelect={() => setSelectedId(block.id)} />)}
              {blocks.filter((block) => block.isVisible).length === 0 && <p className="px-5 py-20 text-center text-xs text-muted-foreground">No visible sections</p>}
            </div>
          </div>
        </section>

        <aside className="border-t border-border p-4 lg:border-l lg:border-t-0">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Properties</p>
          {selected ? <BlockPropertiesPanel key={selected.id} block={selected} products={products} categories={categories} onSave={(config) => save(selected.id, config)} /> : <p className="rounded-lg border border-dashed border-border p-5 text-center text-xs text-muted-foreground">Select a layer to edit it.</p>}
        </aside>
      </div>
    </div>
  )
}

function CanvasBlock({ block, selected, onSelect }: { block: HomepageBlockData; selected: boolean; onSelect: () => void }) {
  const config = block.config
  const label = BLOCK_META[block.type]?.label ?? block.type
  const className = `relative cursor-pointer border-2 transition-colors ${selected ? "border-primary" : "border-transparent hover:border-primary/50"}`
  if (block.type === "hero_banner") return <button type="button" onClick={onSelect} className={`${className} m-3 flex w-[calc(100%-1.5rem)] flex-col items-start rounded-2xl bg-primary/15 p-4 text-left`}><span className="text-[9px] font-semibold uppercase text-primary">Nexora Marketplace</span><strong className="mt-1 text-base">{String(config.title || "Unlock more possibilities")}</strong><span className="mt-1 text-[10px] text-muted-foreground">{String(config.subtitle || "Digital goods inside Telegram")}</span><span className="mt-3 rounded-full bg-primary px-3 py-1.5 text-[10px] font-semibold text-primary-foreground">{String(config.buttonText || "Explore")}</span><CanvasTag label={label} /></button>
  if (block.type === "category_grid") return <button type="button" onClick={onSelect} className={`${className} w-full px-4 py-3 text-left`}><strong className="text-xs">{String(config.title || "Categories")}</strong><div className="mt-2 grid grid-cols-4 gap-1.5">{["Games", "AI", "Apps", "More"].map((item) => <span key={item} className="rounded-lg bg-secondary px-1 py-3 text-center text-[9px] text-muted-foreground">{item}</span>)}</div><CanvasTag label={label} /></button>
  if (block.type === "product_rail") return <button type="button" onClick={onSelect} className={`${className} w-full px-4 py-3 text-left`}><div className="flex justify-between"><strong className="text-xs">{String(config.title || "Popular products")}</strong><span className="text-[10px] text-primary">See all</span></div><div className="mt-2 grid grid-cols-2 gap-2">{["Product one", "Product two"].map((item) => <span key={item} className="rounded-lg bg-secondary p-2 text-[10px] text-muted-foreground">{item}<b className="mt-3 block text-foreground">$9.99</b></span>)}</div><CanvasTag label={label} /></button>
  return <button type="button" onClick={onSelect} className={`${className} mx-3 mt-3 flex w-[calc(100%-1.5rem)] items-center gap-2 rounded-xl bg-primary/10 p-3 text-left`}><Ticket className="size-4 text-primary" /><span className="text-[10px] font-semibold">{String(config.text || "Limited time offer")}</span><CanvasTag label={label} /></button>
}

function CanvasTag({ label }: { label: string }) { return <span className="absolute -top-2 left-1 rounded bg-primary px-1.5 py-0.5 text-[8px] font-semibold text-primary-foreground">{label}</span> }
