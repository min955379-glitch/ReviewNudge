"use server"

import { redirect } from "next/navigation"
import { requireBusiness } from "@/lib/supabase/require-user"
import { isPolarConfigured, createCheckout } from "@/lib/billing/polar"
import { isValidPlan, UPGRADE_PLANS } from "@/lib/billing/plans"

/**
 * Server action: begin a Polar checkout for the given plan.
 * Returns { ok:false, error } on failure (shown on the billing page),
 * or redirects the browser to the Polar-hosted checkout on success.
 */
export async function startCheckout(_prev: { error?: string } | null, formData: FormData) {
  const { business, user } = await requireBusiness()
  const plan = String(formData.get("plan") ?? "")

  if (!isValidPlan(plan) || !UPGRADE_PLANS.includes(plan)) {
    return { error: "Please choose a valid plan." }
  }
  if (!isPolarConfigured()) {
    return { error: "Billing is not configured yet. Check back soon or contact support." }
  }

  try {
    const url = await createCheckout({
      plan,
      userId: user.id,
      businessId: business.id,
      customerEmail: user.email ?? business.reply_to_email ?? null,
      existingCustomerId: (business as { billing_customer_id?: string | null }).billing_customer_id ?? null,
    })
    redirect(url)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to start checkout."
    return { error: msg }
  }
}
