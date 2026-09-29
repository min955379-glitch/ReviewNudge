import { redirect } from "next/navigation"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireBusiness } from "@/lib/supabase/require-user"
import type { Database } from "@/lib/supabase/database.types"
import { TemplatesClient } from "./templates-client"

type Template = Database["public"]["Tables"]["message_templates"]["Row"]

export default async function TemplatesPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email templates</CardTitle>
          <CardDescription>Configure Supabase to edit templates.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const { supabase, business } = await requireBusiness()
  if (!business.google_review_url) redirect(`/app/onboarding?step=${business.name ? 2 : 1}`)

  const res = await supabase.from("message_templates").select("*").eq("business_id", business.id)
  const templates = (res.data as Template[] | null) ?? []
  const requestTpl = templates.find((t) => t.kind === "request")
  const reminderTpl = templates.find((t) => t.kind === "reminder")

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Email templates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize the emails your customers receive. Use{" "}
          <code className="rounded bg-muted px-1">{`{{customer_name}}`}</code>,{" "}
          <code className="rounded bg-muted px-1">{`{{business_name}}`}</code>,{" "}
          <code className="rounded bg-muted px-1">{`{{review_link}}`}</code> as placeholders.
        </p>
      </div>
      <TemplatesClient
        businessName={business.name}
        contactLine={business.contact_line ?? undefined}
        mailingAddress={(business as { mailing_address?: string }).mailing_address ?? undefined}
        reviewUrl={business.google_review_url}
        initialRequest={{
          subject: requestTpl?.subject ?? "",
          body: requestTpl?.body ?? "",
        }}
        initialReminder={{
          subject: reminderTpl?.subject ?? "",
          body: reminderTpl?.body ?? "",
        }}
        emailConfigured={!!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM_ADDRESS}
      />
    </div>
  )
}
