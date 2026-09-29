import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle>Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none text-muted-foreground">
          <p>
            <em>Placeholder — final terms coming in Phase 8.</em>
          </p>
          <p>
            By using ReviewNudge you agree not to send emails to people who have not
            done business with you or who have not consented to be contacted. You agree
            not to offer incentives for reviews, which violates Google policy and may
            result in account termination.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
