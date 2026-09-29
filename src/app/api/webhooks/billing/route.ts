import { NextResponse } from "next/server"

/**
 * POST /api/webhooks/billing
 * Billing provider webhook. Signature verification + plan sync implemented in Phase 7.
 */
export async function POST() {
  return NextResponse.json({
    ok: true,
    message: "Billing webhook is a placeholder. Implemented in Phase 7.",
  })
}
