/**
 * Render an email subject/body by replacing {{variable}} placeholders.
 * Returns both plain text and simple HTML versions.
 */

export interface TemplateVars {
  customer_name: string
  business_name: string
  review_link: string
  unsubscribe_link?: string
  contact_line?: string
  mailing_address?: string
}

export function applyTemplate(template: string, vars: TemplateVars): string {
  const lookup = vars as unknown as Record<string, string | undefined>
  return template.replace(/{{\s*(\w+)\s*}}/g, (match, key: string) => {
    const v = lookup[key]
    return v ?? match
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/**
 * Build the HTML email wrapper with a big "Leave a review" button if
 * the body contains the review_link URL on its own line.
 */
export function renderHtml(
  subject: string,
  body: string,
  vars: TemplateVars
): string {
  const renderedBody = applyTemplate(body, vars)
  const reviewUrl = vars.review_link

  // Replace a bare review URL (on its own line or in its own paragraph) with a button
  const buttonHtml = `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:1.5em 0;">
  <tr>
    <td align="center" bgcolor="#0d9488" style="border-radius:6px;">
      <a href="${escapeHtml(reviewUrl)}" target="_blank" style="display:inline-block;padding:12px 28px;border-radius:6px;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;font-weight:600;text-decoration:none;">Leave a review</a>
    </td>
  </tr>
</table>`

  // Split body so we can inject a button at the first appearance of the bare review link
  const lines = renderedBody.split(/\n/)
  const processedLines = lines.map((line) => {
    if (line.trim() === reviewUrl) {
      return `__BUTTON_PLACEHOLDER__`
    }
    return escapeHtml(line)
  })
  const rejoined = processedLines.join("\n")
  const bodyHtml = rejoined
    .split(/\n{2,}/)
    .map((chunk) => {
      if (chunk.includes("__BUTTON_PLACEHOLDER__")) {
        return chunk
          .replace("__BUTTON_PLACEHOLDER__", buttonHtml)
          .split("__BUTTON_PLACEHOLDER__")
          .map((c) => `<p style="margin:0 0 1em 0;line-height:1.6;">${c.replace(/\n/g, "<br/>")}</p>`)
          .join("")
      }
      return `<p style="margin:0 0 1em 0;line-height:1.6;">${chunk.replace(/\n/g, "<br/>")}</p>`
    })
    .join("")

  const footerParts: string[] = []
  footerParts.push(escapeHtml(vars.business_name))
  if (vars.contact_line) footerParts.push(escapeHtml(vars.contact_line))
  if (vars.unsubscribe_link) {
    footerParts.push(
      `<a href="${escapeHtml(vars.unsubscribe_link)}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>`
    )
  }
  const footerTop = footerParts.join(" &nbsp;•&nbsp; ")
  const addressHtml = vars.mailing_address
    ? `<div style="margin-top:6px;white-space:pre-line;">${escapeHtml(vars.mailing_address)}</div>`
    : ""
  const footerHtml = footerTop + addressHtml

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(applyTemplate(subject, vars))}</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#111827;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:24px 0;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="padding:32px 32px 16px 32px;">
            <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#111827;">${escapeHtml(applyTemplate(subject, vars))}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 16px 32px;font-size:16px;line-height:1.6;color:#374151;">
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px 32px 32px;font-size:12px;line-height:1.5;color:#6b7280;border-top:1px solid #f3f4f6;">
            ${footerHtml}
            <div style="margin-top:8px;color:#9ca3af;">Sent by ReviewNudge.</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

export function renderText(subject: string, body: string, vars: TemplateVars): string {
  const renderedSubject = applyTemplate(subject, vars)
  const renderedBody = applyTemplate(body, vars)
  const parts = [renderedSubject, "", renderedBody]
  if (vars.contact_line) parts.push("", `— ${vars.business_name}, ${vars.contact_line}`)
  else parts.push("", `— ${vars.business_name}`)
  if (vars.mailing_address) parts.push(vars.mailing_address)
  if (vars.unsubscribe_link) parts.push("", `Unsubscribe: ${vars.unsubscribe_link}`)
  return parts.join("\n")
}
