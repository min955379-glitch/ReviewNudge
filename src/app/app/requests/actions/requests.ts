"use server"

import { requireBusiness } from "@/lib/supabase/require-user"
import { generateShortCode, signToken } from "@/lib/utils/crypto"
import { sendReviewEmail } from "@/lib/email/send"
import { sendRequestSchema, bulkSendSchema, markReviewedSchema } from "@/lib/validation/request"
import { planLimit } from "@/lib/billing/plans"
import type { Database } from "@/lib/supabase/database.types"

type Biz = Database["public"]["Tables"]["businesses"]["Row"]
type Cust = Database["public"]["Tables"]["customers"]["Row"]
type Req = Database["public"]["Tables"]["review_requests"]["Row"]
type Tpl = Database["public"]["Tables"]["message_templates"]["Row"]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Qb = any

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || ""
}

/** Count emails sent by this business in the current 30-day rolling window. */
async function countRecentSends(sb: Qb, businessId: string): Promise<number> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const res = await sb
    .from("review_requests")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .in("status", ["sent", "clicked"])
    .gte("sent_at", since)
  return (res.count as number) ?? 0
}

function quotaError(biz: Biz, used: number, limit: number): string {
  return `You've reached your monthly limit of ${limit} emails on the Free plan (${used} sent). Upgrade to Pro to send more.`
}

async function getTemplates(sb: Qb, businessId: string): Promise<Record<string, Tpl>> {
  const res = await sb.from("message_templates").select("*").eq("business_id", businessId)
  const tpls = (res.data as Tpl[] | null) ?? []
  const byKind: Record<string, Tpl> = {}
  for (const t of tpls) byKind[t.kind] = t
  return byKind
}

async function getEligibleCustomer(
  sb: Qb,
  business: Biz,
  customerId: string
): Promise<Cust | null> {
  const res = await sb
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .eq("business_id", business.id)
    .maybeSingle()
  const c = res.data as Cust | null
  if (!c) return null
  if (c.unsubscribed) return null
  if (!c.email) return null
  if (!c.consent_confirmed) return null
  return c
}

async function createAndSendOne(
  sb: Qb,
  business: Biz,
  customer: Cust,
  templates: Record<string, Tpl>,
  isReminder = false
): Promise<{ request: Req | null; error?: string }> {
  // Generate unique short code
  let shortCode = generateShortCode()
  for (let i = 0; i < 5; i++) {
    const existing = await sb.from("review_requests").select("id").eq("short_code", shortCode).maybeSingle()
    if (!existing.data) break
    shortCode = generateShortCode()
  }

  const kind: "request" | "reminder" = isReminder ? "reminder" : "request"
  const tpl = templates[kind] || templates.request
  if (!tpl) return { request: null, error: `No ${kind} template configured.` }

  const reviewLink = `${appUrl()}/r/${shortCode}`
  const unsubscribeLink = `${appUrl()}/unsubscribe/${signToken({
    business_id: business.id,
    email: customer.email!,
  })}`

  const insertRes = await sb
    .from("review_requests")
    .insert({
      business_id: business.id,
      customer_id: customer.id,
      short_code: shortCode,
      status: "queued",
    })
    .select()
    .single()
  const req = insertRes.data as Req | null
  if (insertRes.error || !req) {
    return { request: null, error: insertRes.error?.message ?? "Failed to create request" }
  }

  const result = await sendReviewEmail({
    to: customer.email!,
    business: {
      name: business.name,
      reply_to_email: business.reply_to_email,
      contact_line: business.contact_line,
      mailing_address: (business as Biz & { mailing_address?: string }).mailing_address,
    },
    customerName: customer.name,
    subjectTpl: tpl.subject,
    bodyTpl: tpl.body,
    reviewLink,
    unsubscribeLink,
  })

  if (result.ok) {
    await sb
      .from("review_requests")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", req.id)
    return { request: { ...req, status: "sent", sent_at: new Date().toISOString() } }
  } else {
    await sb
      .from("review_requests")
      .update({ status: "failed", error_message: result.error ?? "Unknown error" })
      .eq("id", req.id)
    return { request: null, error: result.error }
  }
}

export type SendResult = {
  success?: boolean
  error?: string
  errors?: Record<string, string>
  sent?: number
  failed?: number
  skipped?: number
}

export async function sendToOne(_prev: unknown, formData: FormData): Promise<SendResult> {
  const { supabase, business } = await requireBusiness()
  const sb = supabase as unknown as Qb

  const raw = { customer_id: String(formData.get("customer_id") ?? "") }
  const parsed = sendRequestSchema.safeParse(raw)
  if (!parsed.success) return { errors: { customer_id: parsed.error.flatten().fieldErrors.customer_id?.[0] ?? "Invalid customer" } }

  const customer = await getEligibleCustomer(sb, business, parsed.data.customer_id)
  if (!customer) return { error: "Customer is not eligible (missing email, unsubscribed, or no consent)." }

  // Monthly quota check (Free plan: 10 emails / 30 days)
  const limit = planLimit(business.plan)
  if (limit !== null) {
    const used = await countRecentSends(sb, business.id)
    if (used >= limit) return { error: quotaError(business, used, limit) }
  }

  const templates = await getTemplates(sb, business.id)
  const { error } = await createAndSendOne(sb, business, customer, templates)
  if (error) return { error }
  return { success: true, sent: 1, failed: 0, skipped: 0 }
}

export async function sendBulk(_prev: unknown, formData: FormData): Promise<SendResult> {
  const { supabase, business } = await requireBusiness()
  const sb = supabase as unknown as Qb

  let ids: string[] = []
  try {
    const parsed = JSON.parse(String(formData.get("customer_ids_json") ?? "[]"))
    if (Array.isArray(parsed)) ids = parsed.map((v) => String(v))
  } catch {
    return { error: "Invalid customer selection." }
  }
  const validated = bulkSendSchema.safeParse({ customer_ids: ids })
  if (!validated.success) {
    return { errors: { customer_ids: validated.error.flatten().fieldErrors.customer_ids?.[0] ?? "Invalid selection" } }
  }

  // Simple rate limit guard (100/hour per business)
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const recentRes = await sb
    .from("review_requests")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .gte("sent_at", hourAgo)
  const recentCount = (recentRes.count as number) ?? 0
  const hourlyLimit = 100
  if (recentCount + ids.length > hourlyLimit) {
    return {
      error: `Rate limit: you can send at most ${hourlyLimit} emails per hour. You've sent ${recentCount} in the last hour.`,
    }
  }

  // Monthly quota (Free plan)
  const limit = planLimit(business.plan)
  let used = limit !== null ? await countRecentSends(sb, business.id) : 0

  const templates = await getTemplates(sb, business.id)
  let sent = 0
  let failed = 0
  let skipped = 0
  const errors: string[] = []
  let quotaHit = false

  for (const id of ids) {
    if (limit !== null && used >= limit) { quotaHit = true; skipped++; continue }
    const c = await getEligibleCustomer(sb, business, id)
    if (!c) { skipped++; continue }
    const { error } = await createAndSendOne(sb, business, c, templates)
    if (error) { failed++; errors.push(`${c.name}: ${error}`) } else { sent++; if (limit !== null) used++ }
    await new Promise((r) => setTimeout(r, 150))
  }

  if (quotaHit && limit !== null) {
    errors.push(
      `Monthly limit of ${limit} emails reached on the Free plan (${used} sent). Upgrade to Pro to send more.`,
    )
  }

  return {
    success: true,
    sent,
    failed,
    skipped,
    error: errors.length ? errors.slice(0, 3).join("; ") : undefined,
  }
}

export async function resendRequest(_prev: unknown, formData: FormData): Promise<SendResult> {
  const { supabase, business } = await requireBusiness()
  const sb = supabase as unknown as Qb
  const requestId = String(formData.get("request_id") ?? "")
  if (!requestId) return { error: "Missing request id" }

  const reqRes = await sb.from("review_requests").select("*, customer:customers(*)").eq("id", requestId).eq("business_id", business.id).maybeSingle()
  const row = reqRes.data as (Req & { customer: Cust | null }) | null
  if (!row || !row.customer) return { error: "Request not found" }

  const limit = planLimit(business.plan)
  if (limit !== null) {
    const used = await countRecentSends(sb, business.id)
    if (used >= limit) return { error: quotaError(business, used, limit) }
  }

  const templates = await getTemplates(sb, business.id)
  const { error } = await createAndSendOne(sb, business, row.customer, templates)
  if (error) return { error }
  return { success: true, sent: 1 }
}

export async function markReviewed(_prev: unknown, formData: FormData): Promise<SendResult> {
  const { supabase, business } = await requireBusiness()
  const sb = supabase as unknown as Qb
  const raw = { request_id: String(formData.get("request_id") ?? "") }
  const parsed = markReviewedSchema.safeParse(raw)
  if (!parsed.success) return { error: "Invalid request" }
  const { error } = await sb
    .from("review_requests")
    .update({ manually_marked_reviewed: true })
    .eq("id", parsed.data.request_id)
    .eq("business_id", business.id)
  if (error) return { error: error.message }
  return { success: true }
}
