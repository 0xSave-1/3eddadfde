import {
  Bot,
  ImageIcon,
  Code2,
  Gamepad2,
  Trophy,
  Clapperboard,
  Music,
  PlaySquare,
  Gift,
  Frame,
  Palette,
  AppWindow,
  Settings,
  type LucideIcon,
} from "lucide-react"

interface ProductVisual {
  icon: LucideIcon
  gradient: string
}

const PRODUCT_VISUALS: Record<number, ProductVisual> = {
  1: { icon: Palette, gradient: "from-amber-400 to-orange-600" },
  2: { icon: Settings, gradient: "from-amber-400 to-orange-600" },
  3: { icon: Gamepad2, gradient: "from-sky-400 to-blue-600" },
  4: { icon: Gamepad2, gradient: "from-sky-400 to-blue-600" },
  5: { icon: Trophy, gradient: "from-sky-400 to-blue-600" },
  6: { icon: Gamepad2, gradient: "from-sky-400 to-blue-600" },
  7: { icon: Bot, gradient: "from-violet-400 to-indigo-600" },
  8: { icon: ImageIcon, gradient: "from-violet-400 to-indigo-600" },
  9: { icon: Code2, gradient: "from-violet-400 to-indigo-600" },
  10: { icon: Clapperboard, gradient: "from-rose-400 to-pink-600" },
  11: { icon: Music, gradient: "from-rose-400 to-pink-600" },
  12: { icon: PlaySquare, gradient: "from-rose-400 to-pink-600" },
  13: { icon: Gift, gradient: "from-emerald-400 to-teal-600" },
  14: { icon: Gift, gradient: "from-emerald-400 to-teal-600" },
  15: { icon: Gift, gradient: "from-emerald-400 to-teal-600" },
  16: { icon: Frame, gradient: "from-fuchsia-400 to-purple-600" },
  17: { icon: Palette, gradient: "from-fuchsia-400 to-purple-600" },
  18: { icon: AppWindow, gradient: "from-fuchsia-400 to-purple-600" },
}

const DEFAULT_VISUAL: ProductVisual = { icon: Gift, gradient: "from-slate-400 to-slate-600" }

export function getProductVisual(productId: number): ProductVisual {
  return PRODUCT_VISUALS[productId] ?? DEFAULT_VISUAL
}
