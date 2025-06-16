import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Create response with secure CSP headers
  const response = NextResponse.next()

  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === "development"

  // Set Content Security Policy - more permissive for development
  const csp = [
    "default-src 'self'",
    isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" // Allow unsafe-eval in development
      : "script-src 'self' 'unsafe-inline'", // Stricter in production
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.openai.com https://*.documents.azure.com https://prod-87.southeastasia.logic.azure.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ")

  response.headers.set("Content-Security-Policy", csp)

  // Add other security headers (less strict in development)
  if (!isDev) {
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
