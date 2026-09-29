/**
 * Quota counting helpers shared between send paths (initial + bulk + resend)
 * and the dashboard/cron.
 *
 * Reminders count toward the monthly quota when
 * `REMINDERS_COUNT_TOWARD_QUOTA` is true (the default — configurable in
 * plans.ts for quick toggling).
 */
import { REMINDERS_COUNT_TOWARD_QUOTA } from "./plans"

/**
 * Count sends within a rolling window. Sums:
 *   - Initial sends: rows with status in ('sent','clicked') and sent_at >= since
 *   - Reminders:     rows with reminder_sent_at >= since (if enabled)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function countRecentSends(sb: any, businessId: string, sinceIso: string): Promise<number> {
  const initialRes = await sb
    .from("review_requests")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .gte("sent_at", sinceIso)
    .in("status", ["sent", "clicked"])

  let reminderCount = 0
  if (REMINDERS_COUNT_TOWARD_QUOTA) {
    const reminderRes = await sb
      .from("review_requests")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .gte("reminder_sent_at", sinceIso)
    reminderCount = reminderRes.count ?? 0
  }

  return (initialRes.count ?? 0) + reminderCount
}
