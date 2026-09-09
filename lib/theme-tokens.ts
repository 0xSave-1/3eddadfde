export const THEME_TOKEN_KEYS = [
  "background",
  "foreground",
  "card",
  "primary",
  "primaryForeground",
  "secondary",
  "muted",
  "accent",
  "destructive",
  "border",
] as const

export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number]

export const FONT_OPTIONS = ["Geist", "Inter", "Poppins", "Space Grotesk", "Manrope"] as const

export const DEFAULT_TOKENS: Record<ThemeTokenKey, string> = {
  background: "oklch(0.14 0.012 260)",
  foreground: "oklch(0.97 0.006 260)",
  card: "oklch(0.19 0.015 260)",
  primary: "oklch(0.68 0.19 41)",
  primaryForeground: "oklch(0.12 0.01 41)",
  secondary: "oklch(0.24 0.018 260)",
  muted: "oklch(0.23 0.015 260)",
  accent: "oklch(0.72 0.13 220)",
  destructive: "oklch(0.6 0.21 25)",
  border: "oklch(0.28 0.015 260 / 60%)",
}

export function themeTokensToCssVars(tokens: Record<string, string>) {
  const map: Record<ThemeTokenKey, string> = {
    background: "--background",
    foreground: "--foreground",
    card: "--card",
    primary: "--primary",
    primaryForeground: "--primary-foreground",
    secondary: "--secondary",
    muted: "--muted",
    accent: "--accent",
    destructive: "--destructive",
    border: "--border",
  }
  return Object.entries(map)
    .map(([key, cssVar]) => `${cssVar}: ${tokens[key] ?? DEFAULT_TOKENS[key as ThemeTokenKey]};`)
    .join(" ")
}
