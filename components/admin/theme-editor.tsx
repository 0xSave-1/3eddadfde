"use client"

import { useState, useTransition } from "react"
import { Loader2, RotateCcw, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { saveThemeSettings } from "@/app/actions/admin-theme"
import { DEFAULT_TOKENS, FONT_OPTIONS, THEME_TOKEN_KEYS, themeTokensToCssVars, type ThemeTokenKey } from "@/lib/theme-tokens"

const TOKEN_LABELS: Record<ThemeTokenKey, string> = {
  background: "Background",
  foreground: "Text",
  card: "Card surface",
  primary: "Primary",
  primaryForeground: "Text on primary",
  secondary: "Secondary",
  muted: "Muted surface",
  accent: "Accent",
  destructive: "Destructive",
  border: "Border",
}

/** Converts an OKLCH color string to a hex approximation the browser <input type=color> can edit; falls back gracefully. */
function oklchToEditableColor(value: string) {
  return value
}

export function ThemeEditor({ tokens, fontSans }: { tokens: Record<string, string>; fontSans: string }) {
  const [values, setValues] = useState<Record<string, string>>(tokens)
  const [font, setFont] = useState(fontSans)
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function setToken(key: ThemeTokenKey, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    setSaved(false)
    startTransition(async () => {
      await saveThemeSettings(values, font)
      setSaved(true)
    })
  }

  function handleReset() {
    setValues(DEFAULT_TOKENS)
    setFont("Geist")
  }

  return (
    <div className="mt-5 flex flex-col gap-5">
      <div
        className="rounded-xl border border-border p-4"
        style={{ ...cssVarsToStyle(themeTokensToCssVars(values)), fontFamily: font }}
      >
        <div className="rounded-lg bg-[var(--background)] p-4">
          <p className="font-sans text-sm font-semibold text-[var(--foreground)]">Live preview</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)]">
              Buy now
            </span>
            <span className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs text-[var(--foreground)]">
              Add to cart
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="theme-font">Font family</Label>
        <select
          id="theme-font"
          value={font}
          onChange={(e) => setFont(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {THEME_TOKEN_KEYS.map((key) => (
          <div key={key} className="flex flex-col gap-1.5">
            <Label htmlFor={`token-${key}`} className="text-xs">
              {TOKEN_LABELS[key]}
            </Label>
            <input
              id={`token-${key}`}
              type="text"
              value={values[key] ?? oklchToEditableColor(DEFAULT_TOKENS[key])}
              onChange={(e) => setToken(key, e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-2.5 font-mono text-xs text-foreground"
              placeholder="oklch(...)"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" onClick={handleSave} disabled={pending}>
          {pending ? <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden="true" /> : <Save className="mr-1.5 size-4" aria-hidden="true" />}
          Save theme
        </Button>
        <Button type="button" variant="secondary" onClick={handleReset} disabled={pending}>
          <RotateCcw className="mr-1.5 size-4" aria-hidden="true" />
          Reset
        </Button>
        {saved && <span className="text-xs text-success">Saved — live on the storefront now.</span>}
      </div>
    </div>
  )
}

function cssVarsToStyle(cssVarsString: string): React.CSSProperties {
  const style: Record<string, string> = {}
  for (const decl of cssVarsString.split(";")) {
    const [key, value] = decl.split(":").map((s) => s.trim())
    if (key && value) style[key] = value
  }
  return style as React.CSSProperties
}
