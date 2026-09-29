import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { PLAN_LIMITS } from "@/lib/billing/plans"

const FEATURES: Record<string, string[]> = {
  free: ["Up to 10 emails / month", "1 business location", "CSV customer import", "Unsubscribe + CAN-SPAM compliance", "Manual reminders"],
  pro: ["300 emails / month", "Automatic 3-day reminders", "Custom email templates", "CSV bulk import", "Email support"],
  business: ["1,500 emails / month", "All Pro features", "Bulk send up to 500 at once", "Priority email support", "Higher usage limits"],
}

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-center text-3xl font-bold">Simple, honest pricing</h1>
      <p className="mb-10 text-center text-muted-foreground">
        Start free. Upgrade only when you need to send more review requests.
      </p>
      <div className="grid gap-6 sm:grid-cols-3">
        {(Object.keys(PLAN_LIMITS) as Array<keyof typeof PLAN_LIMITS>).map((key) => {
          const plan = PLAN_LIMITS[key]
          return (
            <Card key={key} className={key === "pro" ? "border-primary shadow-md" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.label}
                  {key === "pro" && <Badge>Popular</Badge>}
                </CardTitle>
                <CardDescription>{plan.label === "Free" ? "For trying it out" : plan.label === "Pro" ? "For small businesses" : "For teams that need volume"}</CardDescription>
                <p className="text-3xl font-bold">{plan.price}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {FEATURES[key].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full" variant={key === "pro" ? "default" : "outline"}>
                  <Link href="/signup">Get started</Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
      <p className="mt-8 text-center text-xs text-muted-foreground">
        14-day money-back guarantee. Cancel anytime from your billing settings.
      </p>
    </div>
  )
}
