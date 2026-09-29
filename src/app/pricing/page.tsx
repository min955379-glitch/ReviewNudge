import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-center text-3xl font-bold">Pricing</h1>
      <p className="mb-10 text-center text-muted-foreground">
        Full pricing page with feature comparison coming in Phase 8.
      </p>
      <div className="grid gap-6 sm:grid-cols-3">
        {[
          { name: "Free", price: "$0", features: ["10 requests/month", "1 business"] },
          { name: "Pro", price: "$12/mo", features: ["300 requests/month", "Auto reminders", "CSV import"] },
          { name: "Business", price: "$29/mo", features: ["1,500 requests/month", "Bulk send", "Priority support"] },
        ].map((plan) => (
          <Card key={plan.name}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {plan.name}
                {plan.name === "Pro" && <Badge>Popular</Badge>}
              </CardTitle>
              <p className="text-2xl font-bold">{plan.price}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-1 text-sm text-muted-foreground">
                {plan.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <Button asChild className="w-full" variant={plan.name === "Pro" ? "default" : "outline"}>
                <Link href="/signup">Get started</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
