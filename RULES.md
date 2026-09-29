# RULES.md — Hard Rules, Security & Compliance

## 1. Hard Rules (DO NOT BREAK)

1. **No review gating.** Every customer must be sent to the same Google review link. Never ask "how was your experience?" first and route unhappy customers elsewhere. This violates Google policy and can get the business's reviews removed.
2. **Never claim to detect whether a review was posted.** Google does not provide this. Only track: sent, delivered/failed, clicked, reminded. Optionally let the owner manually mark "Review received".
3. **No fake or incentivized reviews.** Do not add rewards, discounts or anything that pays for reviews. Show a short note about this in the templates help text.
4. **Consent and compliance.** Only email customers the business has a real relationship with. Every email includes the business name, a physical/contact line, and an unsubscribe link. Respect unsubscribes permanently (per business and per email address). Add a checkbox on the customer form: "This customer has done business with me and I have permission to contact them."
5. **Security first.** Row Level Security on every table, no secrets in client code, validate all input on the server, rate limit sending.
6. **Keep it simple.** Build only what is listed in the PRD. No extra features.
7. **No AI APIs.** Do not integrate any LLM or AI service anywhere in the codebase.

---

## 2. Security Checklist

- [ ] RLS enabled and policies on all tables; tested with two different users to confirm no cross-account access
- [ ] Supabase service role key used only in server code (never exposed to client or logged)
- [ ] Zod validation on every server action and API route
- [ ] Rate limit: max 100 sends/hour per business, and per-IP limits on auth and the `/r/[code]` route
- [ ] Signed, expiring tokens for unsubscribe links
- [ ] Verify webhook signatures (billing and Resend)
- [ ] `CRON_SECRET` required on cron routes
- [ ] Security headers (CSP, X-Frame-Options, Referrer-Policy)
- [ ] Never log personal data unnecessarily (email addresses, customer names beyond debug needs)
- [ ] All environment variables accessed only server-side except clearly `NEXT_PUBLIC_` ones

---

## 3. Email Deliverability & Compliance

- Send from a verified domain via Resend. Sender: `"{Business Name}" <reviews@yourdomain.com>`, with the business's `reply_to_email` as Reply-To.
- Add the `List-Unsubscribe` header and a visible unsubscribe link in every email.
- Every email footer must include: business name, contact line (physical address or phone), and an unsubscribe link.
- Handle bounces/complaints: mark the customer's email as undeliverable and stop sending.
- Respect unsubscribes permanently: an unsubscribed email at a business can never be emailed again from that business.
- Document the SPF, DKIM and DMARC setup steps in the README.
- Plain-text fallback for every HTML email.
- One-click unsubscribe link using signed, expiring tokens.
