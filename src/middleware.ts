import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"
import { rateLimit, rateLimitKey } from "@/lib/rate-limit"

/** IP resolution: prefer x-forwarded-for (Vercel/most proxies) then conn.remoteAddress. */
function getIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0]!.trim()
  const real = req.headers.get("x-real-ip")
  if (real) return real.trim()
  return "unknown"
}

function tooMany(req: NextRequest, resetSec: number) {
  const res = NextResponse.json(
    { ok: false, error: "Too many requests — slow down and try again shortly." },
    { status: 429 },
  )
  res.headers.set("Retry-After", String(resetSec))
  res.headers.set("Cache-Control", "no-store")
  return res
}

export async function middleware(request: NextRequest) {
  const ip = getIp(request)
  const path = request.nextUrl.pathname

  // Aggressive rate limits on auth + public action endpoints.
  if (path.startsWith("/api/")) {
    if (path === "/api/cron/reminders") {
      // Cron is protected by Authorization: Bearer <CRON_SECRET> — rate-limit
      // hard to prevent brute force on the secret.
      const rl = rateLimit(rateLimitKey(ip, "cron"), { max: 10, windowSec: 60 })
      if (!rl.ok) return tooMany(request, Math.ceil((rl.resetAt - Date.now()) / 1000))
    } else if (path.startsWith("/api/webhooks/")) {
      // Webhooks come from Polar — allow generous calls but don't let anyone
      // else hammer them.
      const rl = rateLimit(rateLimitKey(ip, "webhook"), { max: 60, windowSec: 60 })
      if (!rl.ok) return tooMany(request, Math.ceil((rl.resetAt - Date.now()) / 1000))
    } else if (path.startsWith("/api/unsubscribe/")) {
      // One-click unsubscribe can be triggered by email providers; still cap
      // per-IP to prevent abuse.
      const rl = rateLimit(rateLimitKey(ip, "unsub"), { max: 30, windowSec: 60 })
      if (!rl.ok) return tooMany(request, Math.ceil((rl.resetAt - Date.now()) / 1000))
    }
  }

  if (
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/auth/callback")
  ) {
    // Generous for legitimate users, but stops credential stuffing.
    const rl = rateLimit(rateLimitKey(ip, "auth"), { max: 20, windowSec: 60 })
    if (!rl.ok) return tooMany(request, Math.ceil((rl.resetAt - Date.now()) / 1000))
  }

  if (path.startsWith("/r/")) {
    // Click tracking — casual readers generate 1 request per click; bots can
    // hammer it. 60/min per IP is extremely generous for a human.
    const rl = rateLimit(rateLimitKey(ip, "track"), { max: 60, windowSec: 60 })
    if (!rl.ok) return tooMany(request, Math.ceil((rl.resetAt - Date.now()) / 1000))
  }

  // Delegate to Supabase session middleware for auth.
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - public files (images, fonts, manifest, robots, sitemap)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt)$).*)",
  ],
}
