import { createSupabaseServiceClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Bot, ExternalLink, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { headers } from "next/headers"
import Link from "next/link"
import { signToken } from "@/lib/utils/crypto"
import { createHash, randomBytes } from "crypto"

interface Params { params: Promise<{ code: string }> }

type TReq = {
  id: string
  status: "queued" | "sent" | "failed" | "clicked" | "reviewed"
  first_clicked_at: string | null
  click_count: number
  business: { id: string; name: string; google_review_url: string } | null
  customer: { email: string | null } | null
}

/** Well-known bot/scanner/preview user agents that shouldn't count as clicks. */
const BOT_UA_RE =
  /bot|crawler|spider|scraper|curl|wget|python-requests|httpclient|scanner|preview|headless|whatsapp|slackbot|teams|telegrambot|facebookexternalhit|twitterbot|linkedinbot|pingdom|monitoring|uptime|googleother|google-extended|mediapartners|apis-google|gtmetrix|ahrefs|semrush|mj12bot|dotbot/i

export default async function TrackingRedirectPage({ params }: Params) {
  const { code } = await params
  const requestHeaders = await headers()
  const userAgent = (requestHeaders.get("user-agent") ?? "").toLowerCase()
  const isBot = BOT_UA_RE.test(userAgent)
  // Public tracking page uses the service-role client (bypasses RLS); it must
  // never use the anon key, and we require SUPABASE_SERVICE_ROLE_KEY to be set.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">ReviewNudge</CardTitle>
            <CardDescription className="text-center">
              This review link isn&apos;t active yet because the business hasn&apos;t finished setup.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }
  const supabase = await createSupabaseServiceClient()

  // Look up the request by short_code
  const { data: raw } = await supabase
    .from("review_requests")
    .select("id, status, first_clicked_at, click_count, business:businesses(id, name, google_review_url), customer:customers(email)")
    .eq("short_code", code)
    .maybeSingle()
  const req = raw as TReq | null

  if (!req || !req.business || !req.business.google_review_url) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-center">Link not found</CardTitle>
            <CardDescription className="text-center">
              This review link has expired or is invalid.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const business = req.business as { id: string; name: string; google_review_url: string }
  const customer = req.customer as { email: string | null } | null
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""
  const unsubscribeLink = customer?.email
    ? `${appUrl}/unsubscribe/${signToken({ business_id: business.id, email: customer.email })}`
    : null

  // Only count human-looking traffic as a click. Bots, link scanners, and link
  // previews from email/slack/whatsapp still see the review page but don't
  // update status or click_count. We also log an anonymized row in click_events
  // for dashboard analytics.
  if (!isBot) {
    const ipRaw = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? requestHeaders.get("x-real-ip")
      ?? "unknown"
    const ipSalt = process.env.UNSUBSCRIBE_SIGNING_SECRET?.slice(0, 16) ?? "reviewnudge-salt"
    const ipHash = createHash("sha256").update(ipRaw + "|" + ipSalt).digest("hex").slice(0, 32)
    const ua = requestHeaders.get("user-agent") ?? null

    const now = new Date().toISOString()
    const isFirstClick = req.status !== "clicked" && req.status !== "reviewed" && !req.first_clicked_at
    const newCount = (req.click_count ?? 0) + 1

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rq = supabase as any
    const { error: updErr } = await rq
      .from("review_requests")
      .update({
        status: isFirstClick ? "clicked" : req.status,
        first_clicked_at: isFirstClick ? now : req.first_clicked_at,
        click_count: newCount,
      })
      .eq("id", req.id)

    // Best-effort analytics row; don't block render if it fails. The column
    // name `request_id` may not match the stale generated TS types for
    // click_events (which still reference legacy `review_request_id`), so cast
    // through unknown to bypass any compile-time mismatch and always insert at
    // runtime with the real schema column.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const evSb = supabase as any
    const { data: evData, error: evErr } = await evSb.from("click_events").insert({
      request_id: req.id,
      ip_hash: ipHash,
      user_agent: ua,
      is_bot: false,
      created_at: now,
    }).select()

    if (updErr) console.error("Failed to record click on review_request:", JSON.stringify(updErr))
    if (evErr) console.error("Failed to insert click_event:", JSON.stringify(evErr))
    if (!evErr && !evData) console.error("click_events insert returned no data and no error")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Star className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-xl">Leave a review for {business.name}</CardTitle>
          <CardDescription>
            Thank you! Clicking the button below will take you to Google to leave your review.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          {isBot && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Bot className="h-3 w-3" /> Automated preview — your click isn&apos;t counted.
            </p>
          )}
          <Button asChild size="lg" className="w-full sm:w-auto">
            <a href={business.google_review_url} target="_blank" rel="noopener noreferrer">
              Open Google Reviews <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <p className="text-xs text-muted-foreground text-center max-w-sm">
            This link is provided by ReviewNudge. We can&apos;t see whether you leave a review — and
            that&apos;s on purpose. Thank you for your feedback!
          </p>
          {unsubscribeLink && (
            <p className="text-xs text-muted-foreground">
              <Link href={unsubscribeLink} className="underline hover:text-foreground">Unsubscribe from future emails</Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
