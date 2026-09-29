/**
 * Plan and quota enforcement.
 *
 * Free plan: 10 emails per rolling month (both initial requests and reminders
 * count — every delivery to a customer consumes one).
 * Pro: 300/month. Business: 1500/month.
 *
 * Quota enforcement is updated in Phase 7: when billing is configured, a
 * subscriber's quota comes from their actual plan (synced via webhook).
 * When billing is NOT configured (dev / before going live), everything
 * falls back to the free-plan limit so the app remains usable.
 */

export type PlanId = "free" | "pro" | "business"

export const PLAN_LIMITS: Record<PlanId, { monthlyEmails: number | null; label: string; price: string }> = {
  free: { monthlyEmails: 10, label: "Free", price: "$0" },
  pro: { monthlyEmails: 300, label: "Pro", price: "$12/mo" },
  business: { monthlyEmails: 1500, label: "Business", price: "$29/mo" },
}

export function planLimit(plan: string | null | undefined): number | null {
  const p = PLAN_LIMITS[(plan ?? "free") as PlanId] ?? PLAN_LIMITS.free
  return p.monthlyEmails
}

export function isValidPlan(plan: string | null | undefined): plan is PlanId {
  return !!plan && plan in PLAN_LIMITS
}

/** Reminders count toward the monthly quota, same as initial sends. */
export const REMINDERS_COUNT_TOWARD_QUOTA = true

/** Supported upgrade targets (for checkout routing). */
export const UPGRADE_PLANS: PlanId[] = ["pro", "business"]
