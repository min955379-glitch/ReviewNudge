import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Sparkles } from "lucide-react"
import { requireBusiness } from "@/lib/supabase/require-user"
import { PLAN_LIMITS, planLimit } from "@/lib/billing/plans"
import { countRecentSends } from "@/lib/billing/quota"

export default async function BillingSettingsPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null
  }
  const { supabase, business } = await requireBusiness()
  // eslint-disable-next-line react-hooks/purity
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const used = await countRecentSends(supabase, business.id, since)
  const limit = planLimit(business.plan)
  const planLabel = PLAN_LIMITS[business.plan ?? "free"]?.label ?? "Free"

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/app">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to dashboard
          </Link>
        </Button>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">Manage your plan and email quota.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current plan</CardTitle>
            <Badge>{planLabel}</Badge>
          </div>
          <CardDescription>
            {limit === null
              ? "Unlimited monthly emails."
              : `${limit} emails per rolling 30 days (initial requests + reminders).`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground">Used this month</span>
            <span className="text-lg font-semibold">
              {used}{limit !== null ? ` / ${limit}` : ""}
            </span>
          </div>
          <p className="text-muted-foreground">
            Billing provider integration (Polar or Lemon Squeezy) is coming in
            Phase 7. Until then, the Free plan limit is enforced automatically
            and all accounts are capped at {PLAN_LIMITS.free.monthlyEmails} emails
            per rolling 30 days.
          </p>
          <Button disabled className="w-full sm:w-auto">
            <Sparkles className="mr-2 h-4 w-4" />
            Upgrade to Pro (coming soon)
          </Button>
          <p className="text-xs text-muted-foreground">
            Want to upgrade early? Email <span className="font-mono">support@reviewnudge.app</span>{" "}
            and we&apos;ll enable Pro for your account manually.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
