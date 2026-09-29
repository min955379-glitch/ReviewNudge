import { redirect } from "next/navigation"
import type { Database } from "@/lib/supabase/database.types"
import { Step1Form } from "./step-1-form"
import { Step2Form } from "./step-2-form"
import { Step3Form } from "./step-3-form"

type Business = Database["public"]["Tables"]["businesses"]["Row"]
type Template = { subject: string; body: string }

function Guard({ step }: { step: number }) {
  return (
    <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
      <p>Configure Supabase to start onboarding.</p>
      <p className="mt-1 text-xs">Step {step} will be available after setup.</p>
    </div>
  )
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>
}) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const sp = await searchParams
    return <Guard step={Number(sp.step) || 1} />
  }

  const { createSupabaseServerClient } = await import("@/lib/supabase")
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const bizResult = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle()
  const business = bizResult.data as Business | null

  let requestTemplate: Template | null = null
  if (business) {
    const tplResult = await supabase
      .from("message_templates")
      .select("subject, body")
      .eq("business_id", business.id)
      .eq("kind", "request")
      .maybeSingle()
    if (tplResult.data) requestTemplate = tplResult.data as Template
  }

  const sp = await searchParams

  const hasMailingAddress =
    !!business && !!((business as unknown as { mailing_address?: string }).mailing_address ?? "").trim()
  let maxReachable = 1
  if (business && business.name && hasMailingAddress) maxReachable = 2
  if (business && business.google_review_url && hasMailingAddress) maxReachable = 3

  const urlStep = Number(sp.step)
  const current =
    !Number.isNaN(urlStep) && urlStep >= 1 && urlStep <= maxReachable ? urlStep : maxReachable

  if (!sp.step || Number.isNaN(urlStep) || urlStep !== current) {
    redirect(`/app/onboarding?step=${current}`)
  }

  if (current === 1) {
    return (
      <Step1Form
        defaultName={business?.name ?? ""}
        defaultContactLine={business?.contact_line ?? ""}
        defaultMailingAddress={(business as (Business & { mailing_address?: string }) | null)?.mailing_address ?? ""}
        defaultTimezone={business?.timezone ?? "Europe/London"}
      />
    )
  }
  if (current === 2) {
    return (
      <Step2Form
        defaultGoogleReviewUrl={business?.google_review_url ?? ""}
        defaultReplyToEmail={business?.reply_to_email ?? (user.email ?? "")}
      />
    )
  }
  return (
    <Step3Form
      businessName={business!.name}
      defaultSubject={requestTemplate?.subject ?? ""}
      defaultBody={requestTemplate?.body ?? ""}
      googleReviewUrl={business!.google_review_url}
      ownerEmail={user.email ?? ""}
    />
  )
}
