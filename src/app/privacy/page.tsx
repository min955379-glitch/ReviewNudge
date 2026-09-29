import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none text-muted-foreground">
          <p>
            <em>Placeholder — final privacy policy coming in Phase 8.</em>
          </p>
          <p>
            ReviewNudge helps businesses send review request emails. We store the
            minimum data needed to provide that service: business profile information,
            customer names/emails (only as entered by the business owner), email send
            and click events. We do not sell or share customer data with third parties
            except as required to send email (via Resend) and host the application (via
            Supabase and Vercel).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
