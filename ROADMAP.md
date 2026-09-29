# ROADMAP.md — ReviewNudge Development Roadmap

Last updated: 2026-09-29

---

## Completed

### Phase 0: Project context files ✓
- All six project context files (`PRD.md`, `RULES.md`, `ARCHITECTURE.md`, `DESIGN.md`, `PHASES.md`, `MEMORY.md`)
- `README.md` and `ROADMAP.md`
- Product name: **ReviewNudge**

### Phase 1: Foundation ✓
- Next.js 16 + TypeScript + Tailwind CSS v4 + ESLint
- shadcn/ui-style components (Button, Card, Input, Label, Textarea, Checkbox, Badge, Skeleton, Alert, Dialog, Table)
- Supabase client/server/service-role helpers with TypeScript types
- Middleware for session refresh and route protection
- Auth pages (login/signup/forgot-password) with email/password + Google OAuth
- `/auth/callback` route; protected app shell with sidebar nav
- Dashboard placeholder; placeholder pages for all routes
- Placeholder API routes; full initial SQL migration with RLS + indexes
- `.env.example`; graceful setup screen when Supabase not configured

### Phase 2: Business setup (Onboarding + Settings) ✓
- 3-step onboarding wizard (business info → Google review link validation → email template editor with live preview/reset/test-send stub)
- Default request + reminder templates auto-seeded on business creation
- Settings page for editing business profile
- Google review URL validator (g.page, google.com/maps, search.google.com/local/writereview, maps.app.goo.gl, goo.gl/maps)
- Email rendering engine (variable substitution, HTML with CTA button, plain-text fallback, footer)
- Compliance callout about no review gating/incentives
- Dashboard requires onboarding completion and redirects to the correct step

### Phase 3: Customers ✓
- Customers page at `/app/customers` with server-fetched list, empty state, search and sortable table
- Add Customer dialog (name, email, optional phone, required consent checkbox, wired "Add and send")
- Bulk-select checkboxes + sticky "Send review requests" action bar
- Per-row delete with confirm, ownership-guarded server-side
- CSV import via Papaparse: auto column detection, duplicate detection by email, per-row error report, bulk consent checkbox, 5 MB cap
- Unsubscribed customers marked with red badge and blocked from re-add (server enforced)
- Server actions: `addCustomer`, `addAndSendCustomer`, `deleteCustomer`, `importCustomers`, `sendBulk` with Zod validation

### Phase 4: Sending emails ✓
- Resend wrapped in `lib/email/send.ts` (`sendEmail`, `sendReviewEmail`) with HTML + plain text, List-Unsubscribe + List-Unsubscribe-Post headers, Reply-To
- `lib/email/defaults.ts` and `lib/email/render.ts` for variable substitution, CTA button, footer
- `lib/utils/crypto.ts` — `generateShortCode` (8-char crypto-random, collision retry), HMAC-signed unsubscribe tokens (30-day TTL)
- Templates page (`/app/templates`) with tabs for request/reminder, live iframe preview (sample data: "Sam"), Reset-to-default, and test-send (warns when Resend is missing)
- Single-send flow (`sendToOne`) creates `review_requests`, generates short code, sends email, records `sent`/`failed` with error message
- Bulk send: 100/hour rate-limit guard, 150 ms spacing, eligibility checks (consent, email, not unsubscribed, ownership)
- Requests page (`/app/requests`) with server-joined customer data, status badges (Queued/Sent/Failed/Link clicked/Reviewed), filters, search, resend for failures, mark-reviewed action
- Public `/r/[code]` click-tracking redirect (marks clicked, increments click_count) with a friendly CTA page pointing to the business's Google review URL
- Public `/unsubscribe/[token]` confirmation page + `POST /api/unsubscribe/[token]` RFC 8058 one-click endpoint
- Supabase migration `00002_public_tracking.sql` opens anon RLS on review_requests/businesses/customers needed by the public routes
- Dashboard updated with real 30-day stats (sent, click rate, clicks, marked reviewed), recent-activity list, email-setup warning when Resend env vars are missing
- Dashboard "Send a request" CTA links to Customers; Templates quick-link added
- `.env.example` lists `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `UNSUBSCRIBE_SIGNING_SECRET`

### Phase 5: Tracking and reminders ✓
- Bot/scanner detection on `/r/[code]`: UA regex matching for known bots, crawlers, link previews (WhatsApp/Slack/Teams/Telegram/Facebook/Twitter/LinkedIn), HTTP libraries (curl/wget/python-requests), monitoring/uptime agents, headless browsers. Bots see the CTA page but clicks are not counted; a small "Automated preview" notice is shown.
- `POST /api/cron/reminders` protected by `Authorization: Bearer <CRON_SECRET>` (401 on missing/bad token; structured JSON result on success; graceful error when credentials are missing).
- Reminder engine in `src/lib/cron/send-reminders.ts` (`runReminderCron`): finds `review_requests` with `status='sent'`, not clicked, no reminder yet, not manually reviewed, `sent_at` ≥ 3 days old (500-row cap per run). Re-checks customer eligibility right before send, groups by business to fetch templates once, uses the reminder template (falling back to request), throttles sends at 200ms intervals, and stamps `reminder_sent_at` on success so the row isn't picked up again.
- Reminders reuse the original short_code tracking link so the same link keeps working; exactly one reminder is ever sent per request.
- `vercel.json` schedules `/api/cron/reminders` hourly (`0 * * * *`).
- Graceful no-op (returns structured error, no crash) when Supabase service-role or Resend credentials are missing.

---

## In Progress

(None — Phase 5 just wrapped.)

---

## Next

### Phase 6: Dashboard polish
- 30-day requests chart (line chart of sends per day)
- Faster quick-add customer flow (target <10 seconds from dashboard)
- Quota meter showing free-plan usage (e.g. 7/10) with upgrade prompt
- Optional reminder-sent stat card

---

## Planned

### Phase 7: Billing
- Plan constants and server-side limit enforcement (already enforced at 10/month on Free; needs to be tightened per-plan after billing integration)
- Usage meter and upgrade prompts
- Billing provider integration (Polar or Lemon Squeezy)
- Checkout, webhook handling, customer portal link

### Phase 8: Landing page and polish
- Final marketing landing page (hero, how-it-works, pricing, FAQ with honest Google/Compliance answers)
- SEO metadata and PWA manifest
- Empty states, error pages, loading skeletons, toasts
- Final Privacy & Terms pages; mobile polish pass at 375px

### Phase 9: Hardening and launch
- Rate limiting (per-business sends, per-IP on auth and /r/[code])
- Security headers (CSP, X-Frame-Options, Referrer-Policy)
- Final README and Vercel deployment guide (SPF/DKIM/DMARC)
- Full acceptance criteria verification

---

## Known Issues

- **End-to-end flows require configured Supabase + Resend projects** — code for Phases 1–5 is built but can only be smoke-tested in this sandbox without real credentials and the three migrations applied.
- **Two-account RLS isolation test not yet run** — must be verified against a live Supabase project before launch (separate test: create two accounts, add a customer/request as account A, confirm account B cannot read/write it via the API or UI). Moved forward from Phase 9 so it's visible now.
- **Billing not integrated yet** (Phase 7). The Free-plan 10-emails/month quota is already enforced server-side on initial sends, resends, bulk sends, and reminders; Pro/Business plan limits will be enforced once billing is wired up.
- **No logo/branding assets** — using simple lucide icon marks.
- **Next.js 16 middleware deprecation warning** — works now; codemod available (`npx @next/codemod@canary middleware-to-proxy .`).
- **CSV column mapping is auto-detected**, not user-facing — covers common headers; can add manual mapping later if needed.
- **Resend account + verified sending domain** required for real email delivery in production.
