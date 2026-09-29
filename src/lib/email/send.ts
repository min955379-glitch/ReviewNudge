/**
 * sendEmail wraps the transactional email provider (Resend).
 */
import { Resend } from "resend"
import { renderHtml, renderText, applyTemplate, type TemplateVars } from "./render"

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

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM_ADDRESS
}

function defaultFrom(): string {
  return process.env.EMAIL_FROM_ADDRESS || "ReviewNudge <reviews@example.com>"
}

function resendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  const resend = resendClient()
  if (!resend) {
    return {
      ok: false,
      error:
        "Email sending is not configured. Set RESEND_API_KEY and EMAIL_FROM_ADDRESS to enable sending.",
    }
  }
  try {
    const { data, error } = await resend.emails.send({
      from: opts.from,
      to: [opts.to],
      subject: opts.subject,
      replyTo: opts.replyTo,
      html: opts.html,
      text: opts.text,
      headers: opts.headers,
    })
    if (error) {
      return { ok: false, error: error.message }
    }
    return { ok: true, messageId: data?.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown email error" }
  }
}

export interface ReviewEmailPayload {
  to: string
  business: {
    name: string
    reply_to_email?: string | null
    contact_line?: string | null
  }
  customerName: string
  subjectTpl: string
  bodyTpl: string
  reviewLink: string
  unsubscribeLink: string
}

/**
 * Build + send a review email (request or reminder) with the proper templates,
 * variable substitution, plain-text + HTML rendering, List-Unsubscribe header,
 * and footer.
 */
export async function sendReviewEmail(p: ReviewEmailPayload): Promise<SendEmailResult> {
  const vars: TemplateVars = {
    customer_name: p.customerName,
    business_name: p.business.name,
    review_link: p.reviewLink,
    unsubscribe_link: p.unsubscribeLink,
    contact_line: p.business.contact_line ?? undefined,
  }
  const subject = applyTemplate(p.subjectTpl, vars)
  const html = renderHtml(p.subjectTpl, p.bodyTpl, vars)
  const text = renderText(p.subjectTpl, p.bodyTpl, vars)
  return sendEmail({
    to: p.to,
    from: defaultFrom(),
    subject,
    html,
    text,
    replyTo: p.business.reply_to_email ?? undefined,
    headers: {
      // https URL handles POST one-click; mailto is a fallback for older clients.
      "List-Unsubscribe": `<${p.unsubscribeLink.replace("/unsubscribe/", "/api/unsubscribe/")}>, <mailto:unsubscribe@reviewnudge.app?subject=Unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  })
}
