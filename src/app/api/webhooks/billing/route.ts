import { NextResponse } from "next/server"
import { WebhookVerificationError, validateEvent } from "@polar-sh/sdk/webhooks"
import { createSupabaseServiceClient } from "@/lib/supabase/server"
import { isValidPlan } from "@/lib/billing/plans"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/webhooks/billing
 *
 * Polar webhook handler. Verifies the webhook signature using
 * POLAR_WEBHOOK_SECRET, then syncs subscription state into the
 * `businesses` table so our quota checks read from the local source of
 * truth.
 *
 * Events we care about:
 *   - checkout.updated (status='confirmed') — subscription paid, map plan
 *     from the product that was purchased.
 *   - subscription.active — same (belt-and-suspenders).
 *   - subscription.updated / subscription.revoked / subscription.canceled
 *     — record status / period end / cancel_at_period_end flags.
 *   - subscription.unpaid — downgrade to free (grace period handled by
 *     Polar, but we defensively cut access when explicitly revoked).
 */

// Map Polar product IDs (from env) to our plan enum.
function planFromProduct(productId: string | undefined): "pro" | "business" | null {
  if (!productId) return null
  if (productId === process.env.POLAR_PRO_PRODUCT_ID) return "pro"
  if (productId === process.env.POLAR_BUSINESS_PRODUCT_ID) return "business"
  return null
}

async function getRawBody(req: Request): Promise<string> {
  // Webhook signing is over the raw body, so read it as text.
  return await req.text()
}

export async function POST(req: Request) {
  const secret = process.env.POLAR_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ ok: false, error: "Webhook secret not configured" }, { status: 503 })
  }

  const body = await getRawBody(req)
  const headers = Object.fromEntries(req.headers.entries())

  let payload
  try {
    payload = validateEvent(body, headers, secret)
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 })
    }
    return NextResponse.json({ ok: false, error: "Malformed payload" }, { status: 400 })
  }

  const sb = await createSupabaseServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = sb as any
  const eventType = payload.type as string

  try {
    switch (eventType) {
      case "checkout.updated": {
        const checkout = payload.data as Record<string, unknown>
        const meta = (checkout.metadata ?? {}) as Record<string, string>
        const businessId = meta.businessId
        if (!businessId) break
        if (typeof checkout.customerId === "string" && checkout.customerId) {
          await db.from("businesses")
            .update({ billing_customer_id: checkout.customerId })
            .eq("id", businessId)
        }
        const status = checkout.status
        if (status === "confirmed" || status === "succeeded") {
          const products = Array.isArray(checkout.products) ? checkout.products as Array<{ id?: string }> : []
          const firstProduct = products[0]
          const productId = firstProduct?.id ?? (checkout.productId as string | undefined)
          const resolvedPlan = isValidPlan(meta.plan) ? meta.plan : planFromProduct(productId)
          if (resolvedPlan) {
            await db.from("businesses")
              .update({
                plan: resolvedPlan,
                subscription_status: String(status),
              })
              .eq("id", businessId)
          }
        }
        break
      }

      case "subscription.active":
      case "subscription.updated":
      case "subscription.canceled":
      case "subscription.revoked": {
        const sub = payload.data as Record<string, unknown>
        const customerId = sub.customerId as string | undefined
        const status = sub.status as string | undefined
        const currentPeriodEnd = sub.currentPeriodEnd as string | null ?? null
        const cancelAtPeriodEnd = !!(sub.cancelAtPeriodEnd)
        // Try to find product id
        let productId: string | undefined
        const items = sub.items as Array<{ productId?: string; price?: { productId?: string } }> | undefined
        if (items && items.length > 0) {
          productId = items[0].productId ?? items[0].price?.productId
        } else {
          productId = sub.productId as string | undefined
        }
        const plan = planFromProduct(productId)
        const subId = sub.id as string | undefined

        let query = db.from("businesses").update({
          ...(subId ? { billing_subscription_id: subId } : {}),
          ...(status ? { subscription_status: status } : {}),
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: cancelAtPeriodEnd,
          ...(plan ? { plan } : {}),
          billing_provider: "polar",
        })
        if (customerId) {
          query = query.eq("billing_customer_id", customerId)
        } else if (subId) {
          query = query.eq("billing_subscription_id", subId)
        } else {
          break
        }
        await query

        // Revoked → downgrade to free
        if (eventType === "subscription.revoked") {
          if (customerId) {
            await db.from("businesses")
              .update({ plan: "free", subscription_status: "revoked" })
              .eq("billing_customer_id", customerId)
          }
        }
        break
      }

      default:
        break
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown"
    console.error(`[billing-webhook] Error handling ${eventType}:`, msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }

  return NextResponse.json({ ok: true, received: eventType })
}

/** Vercel Cron / some providers may probe GET — respond 405. */
export async function GET() {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 })
}
