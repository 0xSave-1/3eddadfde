"use client"

import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 20,
}: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary p-0.5">
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Decrease quantity"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus />
      </Button>
      <span className="w-6 text-center text-sm font-medium tabular-nums">{value}</span>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Increase quantity"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus />
      </Button>
    </div>
  )
}
