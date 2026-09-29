/**
 * sendEmail wraps the transactional email provider (Resend).
 *
 * In Phase 4 this will do the real Resend API call. Right now we expose a type-safe
 * interface so onboarding (Phase 2) and other code can call into it. The function
 * returns an { ok, error } result instead of throwing so callers can gracefully
 * surface a "email provider not configured" message.
 */

export interface SendEmailOptions {
  to: string
  from: string
  subject: string
  text: string
  html: string
  replyTo?: string
  headers?: Record<string, string>
}

export interface SendEmailResult {
  ok: boolean
  messageId?: string
  error?: string
}

export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  void opts
  // Phase 4: call Resend here. For now, return a friendly not-configured response.
  return {
    ok: false,
    error:
      "Email sending is not set up yet. Configure RESEND_API_KEY and EMAIL_FROM_ADDRESS to enable sending (Phase 4).",
  }
}

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM_ADDRESS
}
