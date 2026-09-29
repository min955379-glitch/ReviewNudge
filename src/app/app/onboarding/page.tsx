import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function OnboardingPage() {
  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Set up your business</CardTitle>
          <CardDescription>
            Welcome! Let&apos;s get you set up to start sending review requests.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Badge variant="secondary">Coming in Phase 2</Badge>
          <p className="text-sm text-muted-foreground">
            The 3-step onboarding wizard (business info → Google review link → email
            template preview) will be built in Phase 2. For now, no businesses exist yet
            — database migrations are being set up as part of Phase 1.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
