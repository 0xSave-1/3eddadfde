import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Script from "next/script"
import { getThemeSettings } from "@/lib/data/theme"
import { themeTokensToCssVars } from "@/lib/theme-tokens"
import { TelegramMiniAppProvider } from "@/components/shop/telegram-mini-app-provider"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: "NEXORA — Your Digital World in Telegram",
  description:
    "Shop digital goods, games, AI subscriptions, and services inside Telegram. Top up your wallet, track orders, and manage everything from one mini app.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#141820",
}

// The storefront and admin views are database-backed and session-aware.
// Rendering them per request prevents Next from querying a deployment database at build time.
export const dynamic = "force-dynamic"

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const theme = await getThemeSettings().catch(() => null)
  const overrideVars = theme ? themeTokensToCssVars(theme.tokens as Record<string, string>) : ""

  return (
    <html lang="en" className={`dark bg-background ${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        {overrideVars && <style dangerouslySetInnerHTML={{ __html: `:root { ${overrideVars} }` }} />}
        {theme?.fontSans && theme.fontSans !== "Geist" && (
          <style
            dangerouslySetInnerHTML={{
              __html: `:root { --font-sans: '${theme.fontSans}', 'Geist Fallback', sans-serif; }`,
            }}
          />
        )}
      </head>
      <body className="font-sans antialiased">
        <TelegramMiniAppProvider />
        {children}
      </body>
    </html>
  )
}
