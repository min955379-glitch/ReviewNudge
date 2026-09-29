import { NextResponse } from "next/server"

/**
 * POST /api/cron/reminders
 * Protected by CRON_SECRET header. Called by Vercel Cron every hour.
 * Implemented in Phase 5.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization")
  const expected = `Bearer ${process.env.CRON_SECRET}`

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({
    ok: true,
    message: "Reminder cron is a placeholder. Implemented in Phase 5.",
    sent: 0,
  })
}
