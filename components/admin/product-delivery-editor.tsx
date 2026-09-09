"use client"

import { useEffect, useState, useTransition } from "react"
import { Loader2, PackageOpen } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  addProductStockLinesAction,
  clearProductStockAction,
  getProductDeliverySettingsAction,
  saveProductDeliveryContentAction,
} from "@/app/actions/admin-products"

export function ProductDeliveryEditor({
  productId,
  productName,
  open,
  onOpenChange,
}: {
  productId: number
  productName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<"shared" | "pool">("shared")
  const [content, setContent] = useState("")
  const [stockCount, setStockCount] = useState(0)
  const [newStock, setNewStock] = useState("")
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setSaved(false)
    getProductDeliverySettingsAction(productId).then((settings) => {
      setMode(settings.deliveryMode)
      setContent(settings.content)
      setStockCount(settings.stockCount)
      setLoading(false)
    })
  }, [open, productId])

  function handleSave() {
    startTransition(async () => {
      await saveProductDeliveryContentAction(productId, content, mode)
      setSaved(true)
    })
  }

  function handleAddStock() {
    startTransition(async () => {
      const count = await addProductStockLinesAction(productId, newStock)
      setStockCount(count)
      setNewStock("")
    })
  }

  function handleClearStock() {
    startTransition(async () => {
      const count = await clearProductStockAction(productId)
      setStockCount(count)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5">
            <PackageOpen className="size-4 text-primary" aria-hidden="true" />
            Delivery — {productName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Loading…
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Delivery mode</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("shared")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-left text-xs ${mode === "shared" ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"}`}
                >
                  <span className="font-medium">Shared text</span>
                  <p className="mt-0.5 text-[11px]">Same message sent to every buyer</p>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("pool")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-left text-xs ${mode === "pool" ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"}`}
                >
                  <span className="font-medium">Stock pool</span>
                  <p className="mt-0.5 text-[11px]">One unique line per order</p>
                </button>
              </div>
            </div>

            {mode === "shared" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="delivery-content" className="text-xs">
                  Content sent after payment
                </Label>
                <Textarea
                  id="delivery-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="License key, instructions, or download link…"
                  rows={4}
                />
              </div>
            )}

            {mode === "pool" && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">
                  {stockCount} unit{stockCount === 1 ? "" : "s"} available. Each paid order consumes one line.
                </p>
                <Label htmlFor="delivery-stock" className="text-xs">
                  Add stock (one code per line)
                </Label>
                <Textarea
                  id="delivery-stock"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  placeholder={"KEY-AAA-111\nKEY-BBB-222"}
                  rows={4}
                  className="font-mono text-xs"
                />
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" onClick={handleAddStock} disabled={pending || !newStock.trim()}>
                    Add stock
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={handleClearStock} disabled={pending || stockCount === 0}>
                    Clear unused stock
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 border-t border-border pt-3">
              <Button type="button" onClick={handleSave} disabled={pending}>
                {pending ? <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden="true" /> : null}
                Save delivery settings
              </Button>
              {saved && <span className="text-xs text-success">Saved</span>}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
