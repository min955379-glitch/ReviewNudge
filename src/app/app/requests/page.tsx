import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireBusiness } from "@/lib/supabase/require-user"
import { redirect } from "next/navigation"
import { RequestsClient } from "./requests-client"

export default async function RequestsPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <Card>
        <CardHeader><CardTitle>Review requests</CardTitle></CardHeader>
        <CardContent><CardDescription>Configure Supabase first.</CardDescription></CardContent>
      </Card>
    )
  }
  const { supabase, business } = await requireBusiness()
  if (!business.google_review_url) redirect(`/app/onboarding?step=${business.name ? 2 : 1}`)

  const { data: rawRequests } = await supabase
    .from("review_requests")
    .select("*, customer:customers(full_name, email)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(200)

  type RawRow = {
    id: string
    status: "queued" | "sent" | "failed" | "clicked"
    first_clicked_at: string | null
    sent_at: string | null
    manually_marked_reviewed: boolean | null
    error_message: string | null
    created_at: string
    customer: { full_name: string | null; email: string | null } | null
  }
  const requests = ((rawRequests ?? []) as RawRow[]).map((r) => ({
    id: r.id,
    customer_name: r.customer?.full_name ?? null,
    customer_email: r.customer?.email ?? "",
    status: r.status,
    first_clicked_at: r.first_clicked_at,
    sent_at: r.sent_at,
    manually_marked_reviewed: !!r.manually_marked_reviewed,
    error_message: r.error_message,
    created_at: r.created_at,
  }))

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Review requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track who you&apos;ve asked, delivery status, and clicks.
        </p>
      </div>
      <RequestsClient initialRequests={requests} />
    </div>
  )
}
