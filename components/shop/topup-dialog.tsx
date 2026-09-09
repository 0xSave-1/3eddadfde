"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { stripePromise } from "@/lib/stripe-client"
import { startWalletTopup, confirmTopupPaid } from "@/app/actions/wallet-checkout"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface TopupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  amountCents: number
}

export function TopupDialog({ open, onOpenChange, amountCents }: TopupDialogProps) {
  const router = useRouter()
  const [transactionId, setTransactionId] = useState<number | null>(null)

  const fetchClientSecret = useCallback(async () => {
    const result = await startWalletTopup(amountCents)
    setTransactionId(result.transactionId)
    return result.clientSecret!
  }, [amountCents])

  const handleComplete = useCallback(async () => {
    if (transactionId) await confirmTopupPaid(transactionId)
    onOpenChange(false)
    router.refresh()
  }, [transactionId, onOpenChange, router])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-[420px] overflow-y-auto sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Top up your wallet</DialogTitle>
        </DialogHeader>
        {open && (
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
