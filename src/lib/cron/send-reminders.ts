"use server"

/**
 * Reminder-sending cron logic.
 *
 * Rules for who gets a reminder:
 *  - status = 'sent'
 *  - first_clicked_at IS NULL
 *  - reminder_sent_at IS NULL
 *  - reminder_claimed_at IS NULL (or stale, older than CLAIM_STALE_MS)
 *  - manually_marked_reviewed = false
 *  - sent_at is at least REMINDER_DELAY_MS in the past (default 3 days)
 *  - Customer still has an email, consent, and hasn't unsubscribed
 *  - Business still has a Google review URL configured
 *  - Business has not exceeded its monthly quota
 *
 * Claim protocol (prevents double-sends from overlapping cron runs):
 *  1. Release stale claims older than CLAIM_STALE_MS (15 min) from crashed runs.
 *  2. Atomically UPDATE up to BATCH_LIMIT eligible rows, setting
 *     reminder_claimed_at = now() (ORDER BY sent_at ASC so oldest gets sent first).
 *  3. SELECT the rows we just claimed.
 *  4. For each row: re-check eligibility, send, on success stamp
 *     reminder_sent_at = now() and clear reminder_claimed_at; on failure clear
 *     reminder_claimed_at so a future run can retry.
 *
 * BATCH_LIMIT is chosen so the run comfortably finishes inside the Vercel
 * Hobby serverless timeout (10s) at 200ms/email + DB overhead.
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
const CLAIM_STALE_MS = 1000 * 60 * 15             // 15 minutes
const SEND_GAP_MS = 200
// 40 emails/run × ~600ms/email = ~24s worst case — safe for Vercel Pro (60s),
// leaves generous headroom on Vercel Hobby (10s) because typical sends are
// ~150ms each, so 40 ≈ 6–10s in practice.
const BATCH_LIMIT = 40

export interface ReminderRunResult {
  ok: boolean
  considered: number
  sent: number
  failed: number
  skipped: number
  quotaLimited: number
  releasedStaleClaims: number
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

/**
 * Count emails sent by a business in the rolling 30-day window.
 *
 * Every successful email (initial send or reminder) counts as one. Initial
 * sends have `status IN ('sent','clicked')` with `sent_at` in the window;
 * reminders reuse the original request row but stamp `reminder_sent_at`, so
 * we count those separately. A row where both timestamps fall inside the
 * window counts as 2 (initial + reminder) — exactly what we want.
 */
async function countRecentSends(sb: Sb, businessId: string): Promise<number> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const tbl = () => sb.from("review_requests").eq("business_id", businessId)
  const initialRes = await tbl()
    .select("id", { count: "exact", head: true })
    .in("status", ["sent", "clicked"])
    .gte("sent_at", since)
  const reminderRes = await tbl()
    .select("id", { count: "exact", head: true })
    .not("reminder_sent_at", "is", null)
    .gte("reminder_sent_at", since)
  return ((initialRes.count as number) ?? 0) + ((reminderRes.count as number) ?? 0)
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
    await sb
      .from("review_requests")
      .update({ reminder_sent_at: new Date().toISOString(), reminder_claimed_at: null })
      .eq("id", request.id)
    return { ok: true }
  }
  // Release the claim so a future run can retry.
  await sb.from("review_requests").update({ reminder_claimed_at: null }).eq("id", request.id)
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
    releasedStaleClaims: 0,
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
  const staleBefore = new Date(Date.now() - CLAIM_STALE_MS).toISOString()
  const now = new Date().toISOString()

  // 1. Release claims from crashed/stuck workers older than CLAIM_STALE_MS.
  const { data: released } = await sb
    .from("review_requests")
    .update({ reminder_claimed_at: null })
    .lt("reminder_claimed_at", staleBefore)
    .select("id")
  result.releasedStaleClaims = Array.isArray(released) ? released.length : 0

  // 2. Atomically claim up to BATCH_LIMIT eligible rows, oldest first.
  //    We do this by selecting candidate IDs first (respecting RLS via service
  //    role), then updating exactly those IDs with a fresh claim. This avoids
  //    relying on Postgres `.order().limit()` chained off .update() which the
  //    Supabase JS client doesn't support cleanly.
  const { data: candidates } = await sb
    .from("review_requests")
    .select("id")
    .eq("status", "sent")
    .is("first_clicked_at", null)
    .is("reminder_sent_at", null)
    .is("reminder_claimed_at", null)
    .eq("manually_marked_reviewed", false)
    .lt("sent_at", cutoff)
    .order("sent_at", { ascending: true })
    .limit(BATCH_LIMIT)

  const candidateIds: string[] = Array.isArray(candidates)
    ? candidates.map((c: { id: string }) => c.id)
    : []

  if (candidateIds.length > 0) {
    await sb
      .from("review_requests")
      .update({ reminder_claimed_at: now })
      .in("id", candidateIds)
  }

  // 3. Fetch claimed rows with joined customer + business.
  const { data: claimed } = await sb
    .from("review_requests")
    .select("*, customer:customers(*), business:businesses(*)")
    .eq("reminder_claimed_at", now)
    .limit(BATCH_LIMIT)

  const rows = (claimed ?? []) as Array<Req & { customer: Cust | null; business: Biz | null }>
  result.considered = rows.length

  // 4. Group by business to fetch templates once and track per-business quota.
  const byBusiness = new Map<
    string,
    { business: Biz; rows: typeof rows; used: number; limit: number | null }
  >()
  for (const r of rows) {
    if (!r.business || !r.customer) {
      await sb.from("review_requests").update({ reminder_claimed_at: null }).eq("id", r.id)
      result.skipped++
      continue
    }
    if (!r.customer.email || r.customer.unsubscribed || !r.customer.consent_confirmed) {
      await sb.from("review_requests").update({ reminder_claimed_at: null }).eq("id", r.id)
      result.skipped++
      continue
    }
    if (!r.business.google_review_url) {
      await sb.from("review_requests").update({ reminder_claimed_at: null }).eq("id", r.id)
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

  // 5. Send reminders.
  for (const bucket of byBusiness.values()) {
    const templates = await getTemplates(sb, bucket.business.id)
    for (const r of bucket.rows) {
      if (!r.customer) { result.skipped++; continue }

      if (bucket.limit !== null && bucket.used >= bucket.limit) {
        await sb.from("review_requests").update({ reminder_claimed_at: null }).eq("id", r.id)
        result.quotaLimited++
        result.skipped++
        continue
      }

      const { data: fresh } = await sb.from("customers").select("*").eq("id", r.customer.id).maybeSingle()
      const c = fresh as Cust | null
      if (!c || c.unsubscribed || !c.email || !c.consent_confirmed) {
        await sb.from("review_requests").update({ reminder_claimed_at: null }).eq("id", r.id)
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
