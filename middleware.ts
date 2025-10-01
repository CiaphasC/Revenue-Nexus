import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export const config = {
  matcher: ["/workspace/:path*"],
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const existingVariant = request.cookies.get("ls-variant")?.value

  if (!existingVariant) {
    const variant = Math.random() > 0.5 ? "A" : "B"
    response.cookies.set("ls-variant", variant, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    })
    response.headers.set("x-lumen-variant", variant)
  } else {
    response.headers.set("x-lumen-variant", existingVariant)
  }

  return response
}
