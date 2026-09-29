import Link from "next/link"
import { CheckoutButton } from "./checkout-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Check, ExternalLink, AlertCircle } from "lucide-react"
import { requireBusiness } from "@/lib/supabase/require-user"
import { PLAN_LIMITS, UPGRADE_PLANS, isValidPlan } from "@/lib/billing/plans"
import { countRecentSends } from "@/lib/billing/quota"
import { isPolarConfigured, createPortalLink } from "@/lib/billing/polar"

const PLAN_FEATURES: Record<string, string[]> = {
  free: ["10 emails per rolling month", "1 business location", "CSV import", "Manual reminders"],
  pro: ["300 emails / month", "Automatic 3-day reminders", "CSV import", "Email support"],
  business: ["1,500 emails / month", "Priority email support", "Bulk sending", "Custom templates"],
}

export default async function BillingSettingsPage({
  searchParams,
}: {
  searchParams?: { upgrade?: string }
}) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null
  }
  const { supabase, business } = await requireBusiness()
  // eslint-disable-next-line react-hooks/purity
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const used = await countRecentSends(supabase, business.id, since)

  const currentPlan = isValidPlan(business.plan) ? business.plan : "free"
  const currentLimit = PLAN_LIMITS[currentPlan].monthlyEmails
  const billingConfigured = isPolarConfigured()
  const biz = business as typeof business & {
    billing_customer_id?: string | null
    subscription_status?: string | null
    current_period_end?: string | null
    cancel_at_period_end?: boolean | null
  }
  const hasSubscription = !!(biz.billing_customer_id && biz.subscription_status)
  const portalUrl = hasSubscription && billingConfigured
    ? await createPortalLink(biz.billing_customer_id!)
    : null
  const upgradeSuccess = searchParams?.upgrade === "success"
  const upgradeCanceled = searchParams?.upgrade === "canceled"

  const periodEndLabel = biz.current_period_end
    ? new Date(biz.current_period_end).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/app">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to dashboard
          </Link>
        </Button>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">Manage your plan and email quota.</p>
      </div>

      {upgradeSuccess && (
        <Card className="border-green-300 bg-green-50 text-green-900">
          <CardContent className="flex items-start gap-2 p-4 text-sm">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>Thanks for upgrading! Your new plan is active. If you don&apos;t see it reflected yet, refresh in a moment.</div>
          </CardContent>
        </Card>
      )}
      {upgradeCanceled && (
        <Card className="border-amber-300 bg-amber-50 text-amber-900">
          <CardContent className="flex items-start gap-2 p-4 text-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>Checkout was canceled. You can try again at any time.</div>
          </CardContent>
        </Card>
      )}

      {/* Current plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current plan</CardTitle>
            <Badge>{PLAN_LIMITS[currentPlan].label}</Badge>
          </div>
          <CardDescription>
            {currentLimit === null
              ? "Unlimited monthly emails."
              : `${currentLimit} emails per rolling 30 days (initial requests + reminders).`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-muted-foreground">Used this month</span>
              <span className="text-lg font-semibold">
                {used}{currentLimit !== null ? ` / ${currentLimit}` : ""}
              </span>
            </div>
            {currentLimit !== null && <Progress value={used} max={currentLimit} />}
          </div>

          {biz.cancel_at_period_end && periodEndLabel && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
              Your subscription is set to cancel at the end of the billing period ({periodEndLabel}).
              You&apos;ll retain access until then and revert to Free afterward.
            </div>
          )}

          {hasSubscription ? (
            <div className="flex flex-wrap gap-2">
              {portalUrl && (
                <Button asChild variant="outline">
                  <a href={portalUrl} target="_blank" rel="noreferrer">
                    Manage subscription <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
              <Button asChild variant="ghost">
                <a href="mailto:support@reviewnudge.app">Contact support</a>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Plan picker */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Choose a plan</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Free */}
          <Card className={currentPlan === "free" ? "border-primary ring-2 ring-primary/20" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Free
                {currentPlan === "free" && <Badge variant="outline">Current</Badge>}
              </CardTitle>
              <p className="text-2xl font-bold">$0</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-1 text-sm text-muted-foreground">
                {PLAN_FEATURES.free.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {currentPlan !== "free" && (
                <p className="text-xs text-muted-foreground">
                  Canceling your paid subscription returns you to Free at period end.
                </p>
              )}
            </CardContent>
          </Card>

          {UPGRADE_PLANS.map((plan) => {
            const info = PLAN_LIMITS[plan]
            const isCurrent = currentPlan === plan
            return (
              <Card key={plan} className={isCurrent ? "border-primary ring-2 ring-primary/20" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {info.label}
                    {plan === "pro" && <Badge>Popular</Badge>}
                    {isCurrent && <Badge variant="outline">Current</Badge>}
                  </CardTitle>
                  <p className="text-2xl font-bold">{info.price}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {PLAN_FEATURES[plan].map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button disabled className="w-full">Current plan</Button>
                  ) : billingConfigured ? (
                    <CheckoutButton plan={plan} label={info.label} variant={plan === "pro" ? "default" : "outline"} />
                  ) : (
                    <Button disabled className="w-full" variant="outline">
                      Coming soon
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {!billingConfigured && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Self-serve checkout is not yet enabled. Email{" "}
            <a className="underline" href="mailto:support@reviewnudge.app">support@reviewnudge.app</a>{" "}
            and we&apos;ll enable Pro/Business for your account manually.
          </p>
        )}
      </div>
    </div>
  )
}
