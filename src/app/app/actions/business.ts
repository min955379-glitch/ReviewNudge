"use server"

import { redirect } from "next/navigation"
import { requireUser } from "@/lib/supabase/require-user"
import type { Database } from "@/lib/supabase/database.types"
import {
  businessProfileSchema,
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
} from "@/lib/validation/business"
import {
  DEFAULT_REMINDER_BODY,
  DEFAULT_REMINDER_SUBJECT,
  DEFAULT_REQUEST_BODY,
  DEFAULT_REQUEST_SUBJECT,
} from "@/lib/email/defaults"

type Business = Database["public"]["Tables"]["businesses"]["Row"]
type FieldErrors = Record<string, string | undefined>
type StepState = { errors: FieldErrors; values: Record<string, string> } | null
type SettingsState = {
  success?: boolean
  errors?: FieldErrors
  values?: Record<string, string>
} | null

type BizInsert = Database["public"]["Tables"]["businesses"]["Insert"]
type BizUpdate = Database["public"]["Tables"]["businesses"]["Update"]
type TplInsert = Database["public"]["Tables"]["message_templates"]["Insert"]
type TplUpdate = Database["public"]["Tables"]["message_templates"]["Update"]

type QueryRes<T = unknown> = { data: T; error: { message: string; code?: string } | null }
interface Chainable {
  select: (cols?: string) => Chainable
  insert: (values: unknown) => Chainable
  update: (values: unknown) => Chainable
  delete: () => Chainable
  eq: (col: string, value: unknown) => Chainable
  order: (col: string, opts: { ascending: boolean }) => Chainable
  maybeSingle: () => Promise<QueryRes>
  single: () => Promise<QueryRes>
  then: Promise<QueryRes>["then"]
}
type Sb = { from: (table: string) => Chainable }

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
  formData.forEach((v, k) => {
    out[k] = typeof v === "string" ? v : ""
  })
  return out
}

async function getCurrentBusiness(sb: Sb, userId: string): Promise<Business> {
  const res = await sb.from("businesses").select("*").eq("owner_id", userId).maybeSingle()
  const business = res.data as Business | null
  if (!business) redirect("/app/onboarding")
  return business
}

export async function createBusiness(_prev: StepState, formData: FormData): Promise<StepState> {
  const { supabase, user } = await requireUser()
  const sb = supabase as unknown as Sb

  const existingRes = await sb.from("businesses").select("id").eq("owner_id", user.id).maybeSingle()
  if (existingRes.data) redirect("/app")

  const raw = toValues(formData)
  const parsed = onboardingStep1Schema.safeParse(raw)
  if (!parsed.success) return { errors: flatten(parsed.error.flatten()), values: raw }

  const insertRes = await sb
    .from("businesses")
    .insert({
      owner_id: user.id,
      name: parsed.data.name,
      google_review_url: "",
      contact_line: parsed.data.contact_line || null,
      mailing_address: parsed.data.mailing_address,
      timezone: parsed.data.timezone,
      plan: "free",
    } as BizInsert)
    .select("id")
    .single()
  const created = insertRes.data as { id: string } | null

  if (insertRes.error || !created) {
    return { errors: { _form: insertRes.error?.message ?? "Could not create business." }, values: raw }
  }

  const tplRes = (await sb
    .from("message_templates")
    .insert([
      { business_id: created.id, kind: "request", subject: DEFAULT_REQUEST_SUBJECT, body: DEFAULT_REQUEST_BODY },
      { business_id: created.id, kind: "reminder", subject: DEFAULT_REMINDER_SUBJECT, body: DEFAULT_REMINDER_BODY },
    ] as TplInsert[])
    .select()) as unknown as QueryRes
  if (tplRes.error) console.error("Failed to seed default templates:", tplRes.error)

  redirect("/app/onboarding?step=2")
}

export async function saveOnboardingStep2(_prev: StepState, formData: FormData): Promise<StepState> {
  const { supabase, user } = await requireUser()
  const sb = supabase as unknown as Sb
  const business = await getCurrentBusiness(sb, user.id)

  const raw = toValues(formData)
  const parsed = onboardingStep2Schema.safeParse(raw)
  if (!parsed.success) return { errors: flatten(parsed.error.flatten()), values: raw }

  const res = await sb
    .from("businesses")
    .update({
      google_review_url: parsed.data.google_review_url,
      reply_to_email: parsed.data.reply_to_email || null,
    } as BizUpdate)
    .eq("id", business.id)

  if (res.error) return { errors: { _form: res.error.message }, values: raw }
  redirect("/app/onboarding?step=3")
}

export async function saveOnboardingStep3(_prev: StepState, formData: FormData): Promise<StepState> {
  const { supabase, user } = await requireUser()
  const sb = supabase as unknown as Sb
  const business = await getCurrentBusiness(sb, user.id)

  const raw = toValues(formData)
  const parsed = onboardingStep3Schema.safeParse(raw)
  if (!parsed.success) return { errors: flatten(parsed.error.flatten()), values: raw }

  const res = await sb
    .from("message_templates")
    .update({ subject: parsed.data.request_subject, body: parsed.data.request_body } as TplUpdate)
    .eq("business_id", business.id)
    .eq("kind", "request")

  if (res.error) return { errors: { _form: res.error.message }, values: raw }
  redirect("/app")
}

export async function updateBusinessProfile(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const { supabase, user } = await requireUser()
  const sb = supabase as unknown as Sb
  const business = await getCurrentBusiness(sb, user.id)

  const raw = toValues(formData)
  const parsed = businessProfileSchema.safeParse(raw)
  if (!parsed.success) return { errors: flatten(parsed.error.flatten()), values: raw }

  const res = await sb
    .from("businesses")
    .update({
      name: parsed.data.name,
      google_review_url: parsed.data.google_review_url,
      reply_to_email: parsed.data.reply_to_email || null,
      contact_line: parsed.data.contact_line || null,
      mailing_address: parsed.data.mailing_address,
      timezone: parsed.data.timezone,
    } as BizUpdate)
    .eq("id", business.id)

  if (res.error) return { errors: { _form: res.error.message }, values: raw }
  return { success: true, errors: {}, values: {} }
}

export async function resetRequestTemplate() {
  "use server"
  const { supabase, user } = await requireUser()
  const sb = supabase as unknown as Sb
  const business = await getCurrentBusiness(sb, user.id)
  const { error } = await sb
    .from("message_templates")
    .update({ subject: DEFAULT_REQUEST_SUBJECT, body: DEFAULT_REQUEST_BODY } as TplUpdate)
    .eq("business_id", business.id)
    .eq("kind", "request")
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function resetReminderTemplate() {
  "use server"
  const { supabase, user } = await requireUser()
  const sb = supabase as unknown as Sb
  const business = await getCurrentBusiness(sb, user.id)
  const { error } = await sb
    .from("message_templates")
    .update({ subject: DEFAULT_REMINDER_SUBJECT, body: DEFAULT_REMINDER_BODY } as TplUpdate)
    .eq("business_id", business.id)
    .eq("kind", "reminder")
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
