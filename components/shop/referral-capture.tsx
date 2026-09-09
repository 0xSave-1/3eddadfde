"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { captureReferralCode } from "@/app/actions/capture-referral"

export function ReferralCapture() {
  const searchParams = useSearchParams()
  const ref = searchParams.get("ref")

  useEffect(() => {
    if (ref) {
      captureReferralCode(ref)
    }
  }, [ref])

  return null
}
