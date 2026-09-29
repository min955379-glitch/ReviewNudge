"use server"

/**
 * Reminder-sending cron logic.
 *
 * Rules for who gets a reminder:
 *  - status = 'sent'
 *  - first_clicked_at IS NULL
 *  - reminder_sent_at IS NULL
 *  - manually_marked_reviewed = false
 *  - sent_at is at least REMINDER_DELAY_MS in the past (default 3 days)
 *  - Customer still has an email, consent, and hasn't unsubscribed
 *  - Business still has a Google review URL configured
 *
 * A reminder reuses the SAME tracking short_code (the link continues to work)
 * but gets the reminder subject/body template. After send, we set
 * reminder_sent_at on the original row so the cron won't pick it up again.
 */
import { createSupabaseServiceClient } from "@/lib/supabase/server"
import { signToken } from "@/lib/utils/crypto"
import { sendReviewEmail } from "@/lib/email/send"
import type { Database } from "@/lib/supabase/database.types"

type Biz = Database["public"]["Tables"]["businesses"]["Row"]
type Cust = Database["public"]["Tables"]["customers"]["Row"]
type Req = Database["public"]["Tables"]["review_requests"]["Row"]
type Tpl = Database["public"]["Tables"]["message_templates"]["Row"]

const REMINDER_DELAY_MS = 1000 * 60 * 60 * 24 * 3 // 3 days
const SEND_GAP_MS = 200
const BATCH_LIMIT = 500

export interface ReminderRunResult {
  ok: boolean
  considered: number
  sent: number
  failed: number
  skipped: number
  errors: string[]
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || ""
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sb = any

async function getTemplates(sb: Sb, businessId: string): Promise<Record<string, Tpl>> {
  const res = await sb.from("message_templates").select("*").eq("business_id", businessId)
  const tpls = (res.data as Tpl[] | null) ?? []
  const byKind: Record<string, Tpl> = {}
  for (const t of tpls) byKind[t.kind] = t
  return byKind
}

async function sendReminderForRow(
  sb: Sb,
  business: Biz,
  customer: Cust,
  request: Req,
  templates: Record<string, Tpl>,
): Promise<{ ok: boolean; error?: string }> {
  const tpl = templates.reminder || templates.request
  if (!tpl) return { ok: false, error: "No reminder template configured." }

  const reviewLink = `${appUrl()}/r/${request.short_code}`
  const unsubscribeLink = `${appUrl()}/unsubscribe/${signToken({
    business_id: business.id,
    email: customer.email!,
  })}`

  const result = await sendReviewEmail({
    to: customer.email!,
    business: {
      name: business.name,
      reply_to_email: business.reply_to_email,
      contact_line: business.contact_line,
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
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", request.id)
    return { ok: true }
  }
  return { ok: false, error: result.error ?? "Unknown error" }
}

export async function runReminderCron(): Promise<ReminderRunResult> {
  const result: ReminderRunResult = {
    ok: true,
    considered: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ...result, ok: false, errors: ["Supabase service credentials not configured."] }
  }
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM_ADDRESS) {
    return { ...result, ok: false, errors: ["Resend not configured; skipping reminders."] }
  }

  const supabase = await createSupabaseServiceClient()
  const sb = supabase as Sb

  const cutoff = new Date(Date.now() - REMINDER_DELAY_MS).toISOString()

  const { data: eligible, error: listErr } = await sb
    .from("review_requests")
    .select("*, customer:customers(*), business:businesses(*)")
    .eq("status", "sent")
    .is("first_clicked_at", null)
    .is("reminder_sent_at", null)
    .eq("manually_marked_reviewed", false)
    .lt("sent_at", cutoff)
    .limit(BATCH_LIMIT)

  if (listErr) {
    return { ...result, ok: false, errors: [`Failed to list eligible requests: ${listErr.message}`] }
  }

  const rows = (eligible ?? []) as Array<Req & { customer: Cust | null; business: Biz | null }>
  result.considered = rows.length

  // Group by business to fetch templates once per business.
  const byBusiness = new Map<string, { business: Biz; rows: typeof rows }>()
  for (const r of rows) {
    if (!r.business || !r.customer) { result.skipped++; continue }
    if (!r.customer.email || r.customer.unsubscribed || !r.customer.consent_confirmed) { result.skipped++; continue }
    if (!r.business.google_review_url) { result.skipped++; continue }
    const key = r.business.id
    if (!byBusiness.has(key)) byBusiness.set(key, { business: r.business, rows: [] })
    byBusiness.get(key)!.rows.push(r)
  }

  for (const { business, rows: bizRows } of byBusiness.values()) {
    const templates = await getTemplates(sb, business.id)
    for (const r of bizRows) {
      if (!r.customer) { result.skipped++; continue }
      // Fresh eligibility check right before send (handles race conditions).
      const { data: fresh } = await sb.from("customers").select("*").eq("id", r.customer.id).maybeSingle()
      const c = fresh as Cust | null
      if (!c || c.unsubscribed || !c.email || !c.consent_confirmed) { result.skipped++; continue }

      const sentRes = await sendReminderForRow(sb, business, c, r, templates)
      if (sentRes.ok) {
        result.sent++
      } else {
        result.failed++
        if (result.errors.length < 10) {
          result.errors.push(`${c.name} <${c.email}>: ${sentRes.error}`)
        } else if (result.errors.length === 10) {
          result.errors.push("... (truncated)")
        }
      }
      await new Promise((res) => setTimeout(res, SEND_GAP_MS))
    }
  }

  return result
}
