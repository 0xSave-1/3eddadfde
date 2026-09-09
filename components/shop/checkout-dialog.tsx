"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { CheckCircle2, Loader2 } from "lucide-react"
import { stripePromise } from "@/lib/stripe-client"
import { startWalletAwareCheckout, confirmWalletAwareOrderPaid } from "@/app/actions/wallet-order-checkout"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useCartStore } from "@/lib/cart-store"

interface CheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lines: { productId: number; quantity: number }[]
  promoCode?: string
}

export function CheckoutDialog({ open, onOpenChange, lines, promoCode }: CheckoutDialogProps) {
  const router = useRouter()
  const clear = useCartStore((s) => s.clear)
  const [orderId, setOrderId] = useState<number | null>(null)
  const [status, setStatus] = useState<"checking" | "wallet-paid" | "card">("checking")

  useEffect(() => {
    if (!open) {
      setStatus("checking")
      setOrderId(null)
      return
    }

    let cancelled = false
    async function run() {
      const result = await startWalletAwareCheckout(lines, promoCode)
      if (cancelled) return
      setOrderId(result.orderId)
      if (result.fullyPaidByWallet) {
        setStatus("wallet-paid")
        clear()
        setTimeout(() => {
          if (!cancelled) {
            onOpenChange(false)
            router.push(`/orders?success=${result.orderId}`)
          }
        }, 1400)
      } else {
        setStatus("card")
      }
    }
    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const fetchClientSecret = useCallback(async () => {
    const result = await startWalletAwareCheckout(lines, promoCode)
    setOrderId(result.orderId)
    if (!("clientSecret" in result) || !result.clientSecret) {
      throw new Error("Order was already paid from balance")
    }
    return result.clientSecret
  }, [lines, promoCode])

  const handleComplete = useCallback(async () => {
    if (orderId) await confirmWalletAwareOrderPaid(orderId)
    clear()
    onOpenChange(false)
    router.push(`/orders?success=${orderId ?? ""}`)
  }, [orderId, clear, onOpenChange, router])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-[420px] overflow-y-auto sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Complete your payment</DialogTitle>
        </DialogHeader>
        {open && status === "checking" && (
          <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" aria-hidden="true" />
            <p className="text-sm">Checking your balance…</p>
          </div>
        )}
        {open && status === "wallet-paid" && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <CheckCircle2 className="size-10 text-primary" aria-hidden="true" />
            <p className="font-sans text-sm font-medium text-foreground">Paid from your balance</p>
            <p className="text-xs text-muted-foreground">No card needed — redirecting to your order…</p>
          </div>
        )}
        {open && status === "card" && (
          <div id="checkout">
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ fetchClientSecret, onComplete: handleComplete }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
