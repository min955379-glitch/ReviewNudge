import { createSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ExternalLink, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { signToken } from "@/lib/utils/crypto"

interface Params { params: Promise<{ code: string }> }

type TReq = {
  id: string
  status: "queued" | "sent" | "failed" | "clicked"
  first_clicked_at: string | null
  click_count: number
  business: { id: string; name: string; google_review_url: string } | null
  customer: { email: string | null } | null
}

export default async function TrackingRedirectPage({ params }: Params) {
  const { code } = await params
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
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
  const supabase = await createSupabaseServerClient()

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

  // Mark clicked if not already (cast the chained update to satisfy strict RSC types)
  type ChainableUpdate = { update: (v: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<unknown> } }
  const rq = supabase.from("review_requests") as unknown as ChainableUpdate
  if (req.status !== "clicked" && !req.first_clicked_at) {
    await rq.update({
      status: "clicked",
      first_clicked_at: new Date().toISOString(),
      click_count: (req.click_count ?? 0) + 1,
    }).eq("id", req.id)
  } else if (req.first_clicked_at) {
    await rq.update({ click_count: (req.click_count ?? 1) + 1 }).eq("id", req.id)
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
