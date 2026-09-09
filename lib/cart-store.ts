import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartLine {
  productId: number
  name: string
  priceCents: number
  imageIcon: string
  quantity: number
}

interface CartState {
  lines: CartLine[]
  addLine: (line: Omit<CartLine, "quantity">, quantity?: number) => void
  removeLine: (productId: number) => void
  setQuantity: (productId: number, quantity: number) => void
  clear: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      addLine: (line, quantity = 1) => {
        const existing = get().lines.find((l) => l.productId === line.productId)
        if (existing) {
          set({
            lines: get().lines.map((l) =>
              l.productId === line.productId ? { ...l, quantity: l.quantity + quantity } : l,
            ),
          })
        } else {
          set({ lines: [...get().lines, { ...line, quantity }] })
        }
      },
      removeLine: (productId) => set({ lines: get().lines.filter((l) => l.productId !== productId) }),
      setQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          set({ lines: get().lines.filter((l) => l.productId !== productId) })
          return
        }
        set({ lines: get().lines.map((l) => (l.productId === productId ? { ...l, quantity } : l)) })
      },
      clear: () => set({ lines: [] }),
    }),
    { name: "nexora-cart" },
  ),
)

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.priceCents * l.quantity, 0)
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0)
}
