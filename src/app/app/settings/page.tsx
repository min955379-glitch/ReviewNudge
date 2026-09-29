import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function EnvGuard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Configure your Supabase project to access settings.</CardDescription>
      </CardHeader>
    </Card>
  )
}

export default async function SettingsPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return <EnvGuard />
  }

  const { requireBusiness } = await import("@/lib/supabase/require-user")
  const { SettingsForm } = await import("./settings-form")
  const { business, user } = await requireBusiness()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your business profile, review link, and account.
        </p>
      </div>

      <SettingsForm
        business={{
          name: business.name,
          google_review_url: business.google_review_url,
          reply_to_email: business.reply_to_email ?? "",
          contact_line: business.contact_line ?? "",
          mailing_address: (business as { mailing_address?: string }).mailing_address ?? "",
          timezone: business.timezone,
          plan: business.plan,
        }}
        userEmail={user.email ?? ""}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            Billing <Badge variant="secondary">Coming in Phase 7</Badge>
          </CardTitle>
          <CardDescription>
            Plan management, customer portal, and invoices will be added when billing
            is integrated.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Danger zone</CardTitle>
          <CardDescription>
            Account deletion is coming in a future phase. For now, contact support to
            delete your account and all associated data.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
