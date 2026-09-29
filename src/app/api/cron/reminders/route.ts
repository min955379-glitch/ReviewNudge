import { NextResponse } from "next/server"
import { runReminderCron } from "@/lib/cron/send-reminders"

/**
 * POST /api/cron/reminders
 * Protected by CRON_SECRET (Authorization: Bearer <secret>).
 * Called by Vercel Cron every hour; sends at most one reminder per request,
 * only for emails delivered >= 3 days ago with no click and no prior reminder.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization")
  const expected = `Bearer ${process.env.CRON_SECRET}`

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await runReminderCron()
    return NextResponse.json(result, { status: result.ok ? 200 : 500 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
