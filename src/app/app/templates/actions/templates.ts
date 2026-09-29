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

type TermRes = Promise<{ data: unknown; error: { message: string } | null }>
interface Chain {
  select: (...a: unknown[]) => Chain
  insert: (...a: unknown[]) => Chain & TermRes
  update: (...a: unknown[]) => Chain & TermRes
  delete: () => Chain & TermRes
  eq: (...a: unknown[]) => Chain & TermRes
  maybeSingle: () => Promise<{ data: unknown; error: { message: string } | null }>
}
type Qb = { from: (t: string) => Chain }

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

export async function saveTemplate(_prev: TemplateState, formData: FormData): Promise<TemplateState> {
  const { supabase, business } = await requireBusiness()
  const sb = supabase as unknown as Qb
  const raw = toValues(formData)
  const kind = raw.kind === "reminder" ? "reminder" : "request"
  const parsed = updateTemplateSchema.safeParse({
    kind,
    subject: raw.subject,
    body: raw.body,
  })
  if (!parsed.success) return { errors: flatten(parsed.error.flatten()), values: raw }

  // Upsert: update if exists, insert if not
  const existing = await sb
    .from("message_templates")
    .select("id")
    .eq("business_id", business.id)
    .eq("kind", kind)
    .maybeSingle()
  let res
  if (existing.data) {
    res = await sb.from("message_templates").update({ subject: parsed.data.subject, body: parsed.data.body }).eq("business_id", business.id).eq("kind", kind)
  } else {
    res = await sb.from("message_templates").insert({ business_id: business.id, kind, subject: parsed.data.subject, body: parsed.data.body })
  }
  if (res.error) return { errors: { _form: res.error.message }, values: raw }
  return { success: true, message: "Template saved." }
}

export async function resetTemplate(_prev: TemplateState, formData: FormData): Promise<TemplateState> {
  const { supabase, business } = await requireBusiness()
  const sb = supabase as unknown as Qb
  const kind = String(formData.get("kind") ?? "request") as "request" | "reminder"
  const defaults = kind === "reminder"
    ? { subject: DEFAULT_REMINDER_SUBJECT, body: DEFAULT_REMINDER_BODY }
    : { subject: DEFAULT_REQUEST_SUBJECT, body: DEFAULT_REQUEST_BODY }
  const res = await sb.from("message_templates").update(defaults).eq("business_id", business.id).eq("kind", kind)
  if (res.error) return { errors: { _form: res.error.message } }
  return { success: true, message: "Reset to default.", values: { ...defaults, kind } }
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
