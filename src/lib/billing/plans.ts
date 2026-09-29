/**
 * Plan and quota enforcement.
 *
 * Free plan: 10 emails per rolling month (both initial requests and reminders
 * count — every delivery to a customer consumes one). Pro and Business plans
 * are unlimited for MVP; limit enforcement is added in Phase 7 along with
 * billing provider integration.
 */

export const PLAN_LIMITS: Record<string, { monthlyEmails: number | null; label: string }> = {
  free: { monthlyEmails: 10, label: "Free" },
  pro: { monthlyEmails: null, label: "Pro" },
  business: { monthlyEmails: null, label: "Business" },
}

export function planLimit(plan: string | null | undefined): number | null {
  const p = PLAN_LIMITS[plan ?? "free"] ?? PLAN_LIMITS.free
  return p.monthlyEmails
}

/** Reminders count toward the monthly quota, same as initial sends. */
export const REMINDERS_COUNT_TOWARD_QUOTA = true
