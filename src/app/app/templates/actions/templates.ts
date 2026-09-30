"use server"

import { requireBusiness } from "@/lib/supabase/require-user"
import { updateTemplateSchema } from "@/lib/validation/request"
import {
  DEFAULT_REMINDER_BODY,
  DEFAULT_REMINDER_SUBJECT,
  DEFAULT_REQUEST_BODY,
  DEFAULT_REQUEST_SUBJECT,
} from "@/lib/email/defaults"
import { sendReviewEmail } from "@/lib/email/send"
import { sendTestEmailSchema } from "@/lib/validation/business"
import { signToken } from "@/lib/utils/crypto"
import { z } from "zod"

type FieldErrors = Record<string, string | undefined>
type TemplateState = {
  success?: boolean
  errors?: FieldErrors
  values?: Record<string, string>
  message?: string
} | null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Qb = any

function flatten(err: { fieldErrors?: Record<string, string[] | undefined> }): FieldErrors {
  const out: FieldErrors = {}
  if (!err.fieldErrors) return out
  for (const [k, v] of Object.entries(err.fieldErrors)) {
    if (v && v.length) out[k] = v[0]
  }
  return out
}

function toValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {}
  formData.forEach((v, k) => { out[k] = typeof v === "string" ? v : "" })
  return out
}

function appUrl(): string { return process.env.NEXT_PUBLIC_APP_URL || "" }

/**
 * Map the UI's "kind" (request|reminder) to the new single-row-per-business
 * schema columns: request_subject/request_body and reminder_subject/reminder_body.
 */
function columnsFor(kind: "request" | "reminder") {
  if (kind === "reminder") {
    return { subject: "reminder_subject", body: "reminder_body" as const }
  }
  return { subject: "request_subject", body: "request_body" as const }
}

async function ensureTemplateRow(sb: Qb, businessId: string): Promise<void> {
  // Ensure the business has a single message_templates row; rely on defaults.
  const { data } = await sb.from("message_templates").select("id").eq("business_id", businessId).maybeSingle()
  if (!data) {
    await sb.from("message_templates").insert({ business_id: businessId })
  }
}

export async function saveTemplate(_prev: TemplateState, formData: FormData): Promise<TemplateState> {
  const { supabase, business } = await requireBusiness()
  const sb = supabase as Qb
  const raw = toValues(formData)
  const kind = raw.kind === "reminder" ? "reminder" : "request"
  const parsed = updateTemplateSchema.safeParse({
    kind,
    subject: raw.subject,
    body: raw.body,
  })
  if (!parsed.success) return { errors: flatten(parsed.error.flatten()), values: raw }

  await ensureTemplateRow(sb, business.id)
  const cols = columnsFor(kind)
  const patch: Record<string, string> = { [cols.subject]: parsed.data.subject, [cols.body]: parsed.data.body, updated_at: new Date().toISOString() }
  const res = await sb.from("message_templates").update(patch).eq("business_id", business.id)
  if (res.error) return { errors: { _form: res.error.message }, values: raw }
  return { success: true, message: "Template saved." }
}

export async function resetTemplate(_prev: TemplateState, formData: FormData): Promise<TemplateState> {
  const { supabase, business } = await requireBusiness()
  const sb = supabase as Qb
  const kind = String(formData.get("kind") ?? "request") as "request" | "reminder"
  await ensureTemplateRow(sb, business.id)
  const cols = columnsFor(kind)
  const defaults =
    kind === "reminder"
      ? { [cols.subject]: DEFAULT_REMINDER_SUBJECT, [cols.body]: DEFAULT_REMINDER_BODY }
      : { [cols.subject]: DEFAULT_REQUEST_SUBJECT, [cols.body]: DEFAULT_REQUEST_BODY }
  const res = await sb.from("message_templates").update({ ...defaults, updated_at: new Date().toISOString() }).eq("business_id", business.id)
  if (res.error) return { errors: { _form: res.error.message } }
  return { success: true, message: "Reset to default.", values: { subject: defaults[cols.subject], body: defaults[cols.body], kind } }
}

export async function sendTestTemplateEmail(_prev: TemplateState, formData: FormData): Promise<TemplateState> {
  const { business } = await requireBusiness()
  const raw = {
    to: String(formData.get("to") ?? ""),
    kind: String(formData.get("kind") ?? "request") as "request" | "reminder",
    subject: String(formData.get("subject") ?? ""),
    body: String(formData.get("body") ?? ""),
  }
  const parsed = z.object({
    to: sendTestEmailSchema.shape.to,
    kind: z.enum(["request", "reminder"]),
    subject: z.string().min(1).max(200),
    body: z.string().min(1).max(5000),
  }).safeParse(raw)
  if (!parsed.success) return { errors: flatten(parsed.error.flatten()), values: raw }

  const tpl = parsed.data
  const dummyCode = "test" + Math.random().toString(36).slice(2, 8)
  const reviewLink = `${appUrl()}/r/${dummyCode}`
  const unsubscribeLink = `${appUrl()}/unsubscribe/${signToken({ business_id: business.id, email: tpl.to })}`

  const result = await sendReviewEmail({
    to: tpl.to,
    business: {
      name: business.name,
      reply_to_email: business.reply_to_email,
      contact_line: business.contact_line,
      mailing_address: (business as { mailing_address?: string }).mailing_address,
    },
    customerName: "you",
    subjectTpl: tpl.subject,
    bodyTpl: tpl.body,
    reviewLink,
    unsubscribeLink,
  })
  if (!result.ok) return { errors: { _form: result.error ?? "Failed to send" }, values: raw }
  return { success: true, message: `Test email sent to ${tpl.to}.` }
}
