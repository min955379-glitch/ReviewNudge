import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Send, MousePointerClick, Mail, FileText, Users, Clock, Sparkles } from "lucide-react"
import { requireBusiness } from "@/lib/supabase/require-user"
import { planLimit, PLAN_LIMITS } from "@/lib/billing/plans"
import { countRecentSends } from "@/lib/billing/quota"
import { LineChart, type DailyPoint } from "@/components/dashboard/line-chart"
import { QuickAddForm } from "@/components/dashboard/quick-add-form"

/** Build an array of the last N days (inclusive of today) as YYYY-MM-DD keys, local time. */
function lastNDays(n: number): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    out.push(`${y}-${m}-${day}`)
  }
  return out
}

function dayKey(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export default async function DashboardPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null
  }

  const { supabase, business } = await requireBusiness()
  if (!business.google_review_url) {
    const step = business.name ? 2 : 1
    redirect(`/app/onboarding?step=${step}`)
  }

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now()
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
  const since = new Date(now - THIRTY_DAYS_MS).toISOString()

  // Parallel data fetches
  const [
    sentRes,
    clickedRes,
    reviewedRes,
    customerRes,
    reminderRes,
    dailyInitialRes,
    dailyReminderRes,
  ] = await Promise.all([
    supabase
      .from("review_requests")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .gte("sent_at", since)
      .in("status", ["sent", "clicked"]),
    supabase
      .from("review_requests")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .gte("first_clicked_at", since)
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
    // Reminders sent in last 30d
    supabase
      .from("review_requests")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .gte("reminder_sent_at", since),
    // All initial-sent timestamps in window (for chart)
    supabase
      .from("review_requests")
      .select("sent_at")
      .eq("business_id", business.id)
      .gte("sent_at", since)
      .in("status", ["sent", "clicked"]),
    // All reminder-sent timestamps in window (counted as a send on that day)
    supabase
      .from("review_requests")
      .select("reminder_sent_at")
      .eq("business_id", business.id)
      .gte("reminder_sent_at", since),
  ])

  const initialCount = (sentRes.count as number) ?? 0
  const clickedCount = (clickedRes.count as number) ?? 0
  const reviewedCount = (reviewedRes.count as number) ?? 0
  const customerCount = (customerRes.count as number) ?? 0
  const reminderCount = (reminderRes.count as number) ?? 0
  const totalSent30d = initialCount + reminderCount
  const clickRate = initialCount > 0 ? `${Math.round((clickedCount / initialCount) * 100)}%` : "—"

  const emailConfigured = !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM_ADDRESS

  // Build 30-day chart points (initial + reminder sends per day)
  const days = lastNDays(30)
  const bucket = new Map<string, number>(days.map((d) => [d, 0]))
  for (const row of (dailyInitialRes.data ?? []) as { sent_at: string | null }[]) {
    const k = dayKey(row.sent_at)
    if (k && bucket.has(k)) bucket.set(k, (bucket.get(k) ?? 0) + 1)
  }
  for (const row of (dailyReminderRes.data ?? []) as { reminder_sent_at: string | null }[]) {
    const k = dayKey(row.reminder_sent_at)
    if (k && bucket.has(k)) bucket.set(k, (bucket.get(k) ?? 0) + 1)
  }
  const chartData: DailyPoint[] = days.map((d) => ({ date: d, value: bucket.get(d) ?? 0 }))

  // Recent requests
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

  // Quota (use a 30-day window aligned with the dashboard above)
  const limit = planLimit(business.plan)
  const used = await countRecentSends(supabase, business.id, since)
  const remaining = limit === null ? null : Math.max(0, limit - used)
  const pct = limit === null ? 0 : Math.min(100, (used / limit) * 100)
  const planLabel = PLAN_LIMITS[business.plan ?? "free"]?.label ?? "Free"
  const atLimit = limit !== null && used >= limit

  const stats = [
    { label: "Emails sent (30d)", value: String(totalSent30d), icon: Send },
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

      {/* Stats grid */}
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

      {/* Chart + Quota */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Emails sent — last 30 days</CardTitle>
            <CardDescription>
              Initial requests plus reminders. Hover a point to see the daily count.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {totalSent30d === 0 ? (
              <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                No emails sent yet. Send your first review request to see activity here.
              </div>
            ) : (
              <LineChart data={chartData} ariaLabel="Emails sent per day over the last 30 days" height={220} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Monthly emails</CardTitle>
              <Badge variant="outline">{planLabel}</Badge>
            </div>
            <CardDescription>Rolling 30-day window</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {limit === null ? (
              <>
                <div className="text-3xl font-semibold">
                  {used}
                  <span className="text-base font-normal text-muted-foreground"> sent</span>
                </div>
                <Progress value={100} max={100} />
                <p className="text-xs text-muted-foreground">
                  Unlimited sends on the {planLabel} plan.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-semibold">
                    {used}
                    <span className="text-base font-normal text-muted-foreground"> / {limit}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {remaining === 0 ? "At limit" : `${remaining} left`}
                  </div>
                </div>
                <Progress value={used} max={limit} />
                {atLimit ? (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                    You&apos;ve used all {limit} emails this month. Upgrade to Pro to keep sending.
                  </div>
                ) : pct >= 80 ? (
                  <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                    You&apos;re nearing your monthly limit. Upgrade to Pro for unlimited sends.
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Both initial sends and reminders count toward this quota.
                  </p>
                )}
                <Button asChild size="sm" variant={atLimit ? "default" : "outline"} className="w-full">
                  <Link href="/app/settings/billing">
                    <Sparkles className="mr-2 h-4 w-4" /> Upgrade to Pro
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent + Quick add + Quick actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent requests</CardTitle>
            <CardDescription>The last 5 emails you sent.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRows.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                No requests yet. Use the quick-add form to send your first one.
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
                <li className="pt-3">
                  <Button asChild variant="link" size="sm" className="px-0">
                    <Link href="/app/requests">View all requests →</Link>
                  </Button>
                </li>
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick add</CardTitle>
              <CardDescription>Add a customer & send in seconds.</CardDescription>
            </CardHeader>
            <CardContent>
              <QuickAddForm />
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
    </div>
  )
}
