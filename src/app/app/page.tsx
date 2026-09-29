import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Send, Clock, MousePointerClick, Mail, FileText, Users } from "lucide-react"
import { requireBusiness } from "@/lib/supabase/require-user"

export default async function DashboardPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null
  }

  const { supabase, business } = await requireBusiness()
  if (!business.google_review_url) {
    const step = business.name ? 2 : 1
    redirect(`/app/onboarding?step=${step}`)
  }

  // Real 30-day stats (server component — Date.now is fine, lint-disable because RSC isn't "render")
  // eslint-disable-next-line react-hooks/purity
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [sentRes, clickedRes, reviewedRes, customerRes] = await Promise.all([
    supabase
      .from("review_requests")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .gte("created_at", since)
      .in("status", ["sent", "clicked"]),
    supabase
      .from("review_requests")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .gte("created_at", since)
      .eq("status", "clicked"),
    supabase
      .from("review_requests")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("manually_marked_reviewed", true),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id),
  ])

  const sentCount = (sentRes.count as number) ?? 0
  const clickedCount = (clickedRes.count as number) ?? 0
  const reviewedCount = (reviewedRes.count as number) ?? 0
  const customerCount = (customerRes.count as number) ?? 0
  const clickRate = sentCount > 0 ? `${Math.round((clickedCount / sentCount) * 100)}%` : "—"

  const emailConfigured = !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM_ADDRESS

  const { data: recent } = await supabase
    .from("review_requests")
    .select("id, created_at, status, sent_at, first_clicked_at, customer:customers(full_name, email)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .limit(5)
  type RecentRow = {
    id: string
    status: string
    created_at: string
    sent_at: string | null
    first_clicked_at: string | null
    customer: { full_name: string | null; email: string | null } | null
  }
  const recentRows = ((recent as unknown as { data: RecentRow[] | null }).data ?? []) as RecentRow[]

  const stats = [
    { label: "Requests sent (30d)", value: String(sentCount), icon: Send },
    { label: "Click rate", value: clickRate, icon: MousePointerClick },
    { label: "Clicks (30d)", value: String(clickedCount), icon: MousePointerClick },
    { label: "Marked reviewed", value: String(reviewedCount), icon: Mail },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {business.name}.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/app/templates">
              <FileText className="mr-2 h-4 w-4" /> Templates
            </Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/app/customers">
              <Send className="mr-2 h-4 w-4" />
              Send a request
            </Link>
          </Button>
        </div>
      </div>

      {!emailConfigured && (
        <Card className="border-amber-300 bg-amber-50 text-amber-900">
          <CardContent className="p-4 text-sm">
            <strong>Email sending isn&apos;t configured yet.</strong> Set{" "}
            <code className="rounded bg-amber-100 px-1">RESEND_API_KEY</code> and{" "}
            <code className="rounded bg-amber-100 px-1">EMAIL_FROM_ADDRESS</code> in{" "}
            <code className="rounded bg-amber-100 px-1">.env.local</code> to start
            sending review requests.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-md bg-primary/10 p-2">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-semibold">{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent requests</CardTitle>
            <CardDescription>The last 5 emails you sent.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRows.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                No requests yet. Add your first customer to start sending.
                <div className="mt-3">
                  <Button asChild size="sm">
                    <Link href="/app/customers">Go to Customers</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <ul className="divide-y">
                {recentRows.map((r) => {
                  const label =
                    r.status === "clicked" ? "Clicked" :
                    r.status === "sent" ? "Sent" :
                    r.status === "failed" ? "Failed" :
                    r.status === "queued" ? "Queued" : r.status
                  const variant =
                    r.status === "clicked" ? "success" :
                    r.status === "failed" ? "destructive" :
                    r.status === "queued" ? "secondary" : "default"
                  return (
                    <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                      <div>
                        <div className="font-medium">{r.customer?.full_name || "(no name)"}</div>
                        <div className="text-xs text-muted-foreground">{r.customer?.email}</div>
                      </div>
                      <Badge variant={variant as "default" | "secondary" | "destructive" | "success"}>{label}</Badge>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/app/customers">
                <Users className="mr-2 h-4 w-4" />
                {customerCount} customer{customerCount === 1 ? "" : "s"} — add or import
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/app/requests">
                <Clock className="mr-2 h-4 w-4" /> View all requests
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/app/templates">
                <FileText className="mr-2 h-4 w-4" /> Customize email templates
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
