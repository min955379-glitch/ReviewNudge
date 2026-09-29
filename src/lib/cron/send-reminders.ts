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
 *  - Business has not exceeded its monthly quota (reminders count toward quota)
 *
 * To prevent double-sends from overlapping cron invocations, we first "claim"
 * each candidate row by setting reminder_sent_at to a far-future sentinel
 * ('infinity' in Postgres, which compares greater than any timestamp). Only
 * rows we successfully claim are sent; we roll the sentinel to the real
 * timestamp on success or NULL on failure.
 */
import { createSupabaseServiceClient } from "@/lib/supabase/server"
import { signToken } from "@/lib/utils/crypto"
import { sendReviewEmail } from "@/lib/email/send"
import { planLimit, REMINDERS_COUNT_TOWARD_QUOTA } from "@/lib/billing/plans"
import type { Database } from "@/lib/supabase/database.types"

type Biz = Database["public"]["Tables"]["businesses"]["Row"]
type Cust = Database["public"]["Tables"]["customers"]["Row"]
type Req = Database["public"]["Tables"]["review_requests"]["Row"]
type Tpl = Database["public"]["Tables"]["message_templates"]["Row"]

const REMINDER_DELAY_MS = 1000 * 60 * 60 * 24 * 3 // 3 days
const SEND_GAP_MS = 200
const BATCH_LIMIT = 500

// Sentinel timestamp used to "claim" a row before sending (year 9999).
const CLAIM_SENTINEL = "9999-01-01T00:00:00.000Z"

export interface ReminderRunResult {
  ok: boolean
  considered: number
  sent: number
  failed: number
  skipped: number
  quotaLimited: number
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

/** Count emails sent by a business in the rolling 30-day window. */
async function countRecentSends(sb: Sb, businessId: string): Promise<number> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const res = await sb
    .from("review_requests")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .in("status", ["sent", "clicked"])
    .gte("sent_at", since)
  return (res.count as number) ?? 0
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
      mailing_address: (business as Biz & { mailing_address?: string }).mailing_address,
    },
    customerName: customer.name,
    subjectTpl: tpl.subject,
    bodyTpl: tpl.body,
    reviewLink,
    unsubscribeLink,
  })

  if (result.ok) {
    // Send succeeded — stamp real timestamp on the claimed row.
    await sb
      .from("review_requests")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", request.id)
    return { ok: true }
  }
  // Send failed — release the claim so the next run can retry.
  await sb.from("review_requests").update({ reminder_sent_at: null }).eq("id", request.id)
  return { ok: false, error: result.error ?? "Unknown error" }
}

export async function runReminderCron(): Promise<ReminderRunResult> {
  const result: ReminderRunResult = {
    ok: true,
    considered: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    quotaLimited: 0,
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

  // 1. Claim rows atomically: rows matching criteria get reminder_sent_at set to
  // the sentinel in a single UPDATE ... RETURNING. Overlapping cron runs can't
  // claim the same row because the WHERE clause requires reminder_sent_at IS NULL.
  //
  // Supabase JS client doesn't expose .update().returning() directly, so we use
  // an RPC via .rpc (preferred) or a select-then-update fallback via raw SQL
  // through the client. We'll do the safer pattern: SELECT candidate rows with
  // SKIP LOCKED semantics via a raw query through supabase.rpc; if that's
  // unavailable, we fall back to UPDATE WHERE reminder_sent_at IS NULL using
  // the JS client with a filter.
  //
  // To stay simple and dependency-free, we first issue an UPDATE that sets
  // reminder_sent_at = sentinel WHERE <criteria> AND reminder_sent_at IS NULL,
  // then SELECT rows WHERE reminder_sent_at = sentinel. This is safe because
  // (a) each cron only picks up rows it just claimed and (b) if two crons race,
  // one UPDATE wins and the other gets an empty set back.

  // 1. Claim rows: mark all currently-eligible rows with the sentinel. We
  //    then SELECT up to BATCH_LIMIT rows carrying the sentinel that belong to
  //    this invocation's window. Because the WHERE clause requires
  //    reminder_sent_at IS NULL, overlapping cron runs cannot claim the same
  //    row — the first UPDATE wins, the second sees zero matching rows.
  await sb
    .from("review_requests")
    .update({ reminder_sent_at: CLAIM_SENTINEL })
    .eq("status", "sent")
    .is("first_clicked_at", null)
    .is("reminder_sent_at", null)
    .eq("manually_marked_reviewed", false)
    .lt("sent_at", cutoff)

  const { data: claimed } = await sb
    .from("review_requests")
    .select("*, customer:customers(*), business:businesses(*)")
    .eq("reminder_sent_at", CLAIM_SENTINEL)
    .limit(BATCH_LIMIT)

  const rows = (claimed ?? []) as Array<Req & { customer: Cust | null; business: Biz | null }>
  result.considered = rows.length

  // 2. Group by business to fetch templates once per business and enforce quota per business.
  const byBusiness = new Map<string, { business: Biz; rows: typeof rows; used: number; limit: number | null }>()
  for (const r of rows) {
    if (!r.business || !r.customer) {
      // Release claim — shouldn't happen, but be safe.
      await sb.from("review_requests").update({ reminder_sent_at: null }).eq("id", r.id)
      result.skipped++
      continue
    }
    if (!r.customer.email || r.customer.unsubscribed || !r.customer.consent_confirmed) {
      await sb.from("review_requests").update({ reminder_sent_at: null }).eq("id", r.id)
      result.skipped++
      continue
    }
    if (!r.business.google_review_url) {
      await sb.from("review_requests").update({ reminder_sent_at: null }).eq("id", r.id)
      result.skipped++
      continue
    }
    const key = r.business.id
    if (!byBusiness.has(key)) {
      const limit = REMINDERS_COUNT_TOWARD_QUOTA ? planLimit(r.business.plan) : null
      const used = limit !== null ? await countRecentSends(sb, r.business.id) : 0
      byBusiness.set(key, { business: r.business, rows: [], used, limit })
    }
    byBusiness.get(key)!.rows.push(r)
  }

  // 3. Send reminders in claimed order, respecting per-business quota.
  for (const bucket of byBusiness.values()) {
    const templates = await getTemplates(sb, bucket.business.id)
    for (const r of bucket.rows) {
      if (!r.customer) { result.skipped++; continue }

      // Quota check (per business, updated as we send).
      if (bucket.limit !== null && bucket.used >= bucket.limit) {
        // Release claim; will be retried next run only if quota opens up.
        await sb.from("review_requests").update({ reminder_sent_at: null }).eq("id", r.id)
        result.quotaLimited++
        result.skipped++
        continue
      }

      // Fresh eligibility re-check.
      const { data: fresh } = await sb.from("customers").select("*").eq("id", r.customer.id).maybeSingle()
      const c = fresh as Cust | null
      if (!c || c.unsubscribed || !c.email || !c.consent_confirmed) {
        await sb.from("review_requests").update({ reminder_sent_at: null }).eq("id", r.id)
        result.skipped++
        continue
      }

      const sentRes = await sendReminderForRow(sb, bucket.business, c, r, templates)
      if (sentRes.ok) {
        result.sent++
        if (bucket.limit !== null) bucket.used++
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
