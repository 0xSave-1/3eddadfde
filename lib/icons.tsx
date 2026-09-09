import {
  Bot,
  Gamepad2,
  Gem,
  Wrench,
  Gift,
  Box,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  bot: Bot,
  "gamepad-2": Gamepad2,
  gem: Gem,
  wrench: Wrench,
  gift: Gift,
  box: Box,
  sparkles: Sparkles,
}

export function getCategoryIcon(icon: string): LucideIcon {
  return CATEGORY_ICONS[icon] ?? Sparkles
}
