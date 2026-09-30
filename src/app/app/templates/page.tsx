import { redirect } from "next/navigation"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireBusiness } from "@/lib/supabase/require-user"
import { TemplatesClient } from "./templates-client"

type TemplateRow = {
  id: string
  business_id: string
  request_subject: string | null
  request_body: string | null
  reminder_subject: string | null
  reminder_body: string | null
  updated_at: string | null
} | null

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

  const res = await supabase.from("message_templates").select("*").eq("business_id", business.id).maybeSingle()
  const row = (res.data as TemplateRow) ?? null

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
          subject: row?.request_subject ?? "",
          body: row?.request_body ?? "",
        }}
        initialReminder={{
          subject: row?.reminder_subject ?? "",
          body: row?.reminder_body ?? "",
        }}
        emailConfigured={!!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM_ADDRESS}
      />
    </div>
  )
}
