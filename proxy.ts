import { NextResponse, type NextRequest } from "next/server"

const COOKIE_NAME = "nexora_visitor"

export function proxy(request: NextRequest) {
  const response = NextResponse.next()

  // A browser-only visitor is for local preview. Telegram users receive a
  // separately signed session after their Mini App initData is verified.
  if (!request.cookies.get(COOKIE_NAME)) {
    response.cookies.set(COOKIE_NAME, crypto.randomUUID(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    })
  }

  return response
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
}
