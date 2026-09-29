import { NextResponse } from "next/server"
import { runReminderCron } from "@/lib/cron/send-reminders"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * /api/cron/reminders
 * Protected by CRON_SECRET (Authorization: Bearer <secret>).
 * Accepts both GET and POST so it can be triggered manually in a browser
 * or by Vercel Cron (which uses GET).
 *
 * Sends at most one reminder per eligible request: status='sent', no click,
 * no prior reminder, sent_at >= 3 days ago.
 */
async function handle(request: Request) {
  const authHeader = request.headers.get("authorization")
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null

  if (!expected || authHeader !== expected) {
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

export async function GET(request: Request) { return handle(request) }
export async function POST(request: Request) { return handle(request) }
