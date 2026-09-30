/**
 * Polar billing integration.
 *
 * Polar is our Merchant-of-Record provider. This module wraps the Polar SDK
 * to expose the small set of operations ReviewNudge needs:
 *   - isPolarConfigured() — gate checkout/portal actions
 *   - getPolarClient()    — lazily-initialized SDK client
 *   - createCheckout()    — create a checkout session for a plan change
 *   - createPortalLink()  — generate a customer-portal URL for self-service
 *
 * Environment variables required (see .env.example):
 *   POLAR_ACCESS_TOKEN       — Personal/organization access token (server only)
 *   POLAR_WEBHOOK_SECRET     — Webhook signing secret (server only)
 *   POLAR_PRO_PRODUCT_ID     — Polar product ID for the Pro monthly plan
 *   POLAR_BUSINESS_PRODUCT_ID— Polar product ID for the Business monthly plan
 *   NEXT_PUBLIC_APP_URL      — Base URL, used to build success/cancel URLs
 */
import { Polar } from "@polar-sh/sdk"
import type { PlanId } from "./plans"

let _polar: Polar | null = null

export function isPolarConfigured(): boolean {
  return !!(
    process.env.POLAR_ACCESS_TOKEN &&
    process.env.POLAR_PRO_PRODUCT_ID &&
    process.env.POLAR_BUSINESS_PRODUCT_ID &&
    process.env.POLAR_WEBHOOK_SECRET
  )
}

export function getPolarClient(): Polar {
  if (_polar) return _polar
  if (!process.env.POLAR_ACCESS_TOKEN) {
    throw new Error("POLAR_ACCESS_TOKEN is not configured.")
  }
  _polar = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN,
    // Default: sandbox for development, production for deployed builds.
    // Set POLAR_SERVER=sandbox explicitly on Vercel if you want to point a
    // production deploy at the Polar sandbox for end-to-end testing.
    server:
      (process.env.POLAR_SERVER as "sandbox" | "production" | undefined) ??
      (process.env.NODE_ENV === "production" ? "production" : "sandbox"),
  })
  return _polar
}

function productIdFor(plan: PlanId): string {
  switch (plan) {
    case "pro":
      if (!process.env.POLAR_PRO_PRODUCT_ID) throw new Error("POLAR_PRO_PRODUCT_ID not set")
      return process.env.POLAR_PRO_PRODUCT_ID
    case "business":
      if (!process.env.POLAR_BUSINESS_PRODUCT_ID) throw new Error("POLAR_BUSINESS_PRODUCT_ID not set")
      return process.env.POLAR_BUSINESS_PRODUCT_ID
    default:
      throw new Error(`No Polar product for plan: ${plan}`)
  }
}

function appBase(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "")
}

export interface CreateCheckoutParams {
  plan: PlanId
  userId: string
  businessId: string
  customerEmail: string | null
  existingCustomerId?: string | null
}

/**
 * Create a Polar checkout session and return its URL.
 *
 * We embed userId + businessId in metadata so the webhook handler can
 * look up the business when checkout.updated / subscription.active fires.
 */
export async function createCheckout({
  plan,
  userId,
  businessId,
  customerEmail,
  existingCustomerId,
}: CreateCheckoutParams): Promise<string> {
  const polar = getPolarClient()
  const productId = productIdFor(plan)
  const successUrl = `${appBase()}/app/settings/billing?upgrade=success`
  const cancelUrl = `${appBase()}/app/settings/billing?upgrade=canceled`

  const checkout = await polar.checkouts.create({
    products: [productId],
    paymentProcessor: "stripe",
    successUrl,
    returnUrl: cancelUrl,
    customerEmail: customerEmail ?? undefined,
    externalCustomerId: userId,
    metadata: {
      userId,
      businessId,
      plan,
      reviewnudge_version: 1,
    },
    ...(existingCustomerId ? { customerId: existingCustomerId } : {}),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)

  return checkout.url
}

/**
 * Generate a customer-portal URL where a subscriber can manage their plan,
 * update payment, or cancel. Returns null when the business has no billing
 * customer on file (no active subscription).
 */
export async function createPortalLink(businessCustomerId: string): Promise<string | null> {
  if (!businessCustomerId) return null
  // Polar's hosted customer portal is at /purchases/:customerId on the
  // Polar host for the environment. If Polar later ships a dedicated
  // SDK method for generating short-lived portal URLs, swap that in here.
  const host =
    process.env.NODE_ENV === "production" ? "https://polar.sh" : "https://sandbox.polar.sh"
  return `${host}/purchases/${encodeURIComponent(businessCustomerId)}`
}
