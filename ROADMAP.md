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
- Public routes (`/r/[code]`, `/unsubscribe/[token]`, `POST /api/unsubscribe/[token]`) use the **service-role** Supabase client (no anon RLS grants; migration `00002_public_tracking.sql` is a no-op documenting this choice). Anon role has zero access to businesses/customers/review_requests — verified with `scripts/verify-anon-rls.sh`.
- Dashboard updated with real 30-day stats (sent, click rate, clicks, marked reviewed), recent-activity list, email-setup warning when Resend env vars are missing
- Dashboard "Send a request" CTA links to Customers; Templates quick-link added
- `.env.example` lists `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `UNSUBSCRIBE_SIGNING_SECRET`

### Phase 5: Tracking and reminders ✓
- Bot/scanner detection on `/r/[code]`: UA regex matching for known bots, crawlers, link previews (WhatsApp/Slack/Teams/Telegram/Facebook/Twitter/LinkedIn), HTTP libraries (curl/wget/python-requests), monitoring/uptime agents, headless browsers. Bots see the CTA page but clicks are not counted; a small "Automated preview" notice is shown.
- `POST /api/cron/reminders` protected by `Authorization: Bearer <CRON_SECRET>` (401 on missing/bad token; structured JSON result on success; graceful error when credentials are missing).
- Reminder engine in `src/lib/cron/send-reminders.ts` (`runReminderCron`): finds `review_requests` with `status='sent'`, not clicked, no reminder yet, not manually reviewed, `sent_at` ≥ 3 days old. Uses `reminder_claimed_at` column for safe concurrency (releases claims stale >15 min, atomically claims a batch of up to `BATCH_LIMIT=40` rows per run to stay inside serverless timeouts). Re-checks customer eligibility right before send, groups by business to fetch templates once, uses the reminder template (falling back to request), throttles sends at 200ms intervals, stamps `reminder_sent_at` and clears the claim on success; releases claim on failure/skip/quota-limit so it can be retried.
- Reminders count toward the monthly email quota (same as initial sends); `countRecentSends` sums initial sends + reminders in a rolling 30-day window.
- Reminders reuse the original short_code tracking link so the same link keeps working; exactly one reminder is ever sent per request.
- `vercel.json` schedules `/api/cron/reminders` hourly (`0 * * * *`).
- Graceful no-op (returns structured error, no crash) when Supabase service-role or Resend credentials are missing.

---

## In Progress

(None — Phase 5 just wrapped.)

---

## Next

### Launch verification (against fresh test Supabase `nnnsbkgtdmvmdmusxjqa`, 2026-09-30)
- ✅ Migrations applied via `run-all-migrations-safe.sql` (with fix for missing `private` schema) + `repair-legacy-schema.sql` (with fix to skip legacy backfill when `kind`/`subject` columns don't exist). Both scripts are now idempotent on fresh projects.
- ✅ Anon RLS test passes (`bash scripts/verify-anon-rls.sh` prints PASS).
- ✅ All five tables respond 200 with the production column set via service-role API.
- ✅ Dev server boots, loads `.env.local` against new project; all public pages return 200.
- ✅ Middleware redirects unauth `/app` → `/login` (307); cron returns 401 without secret and structured JSON `{ok:false, errors:["Resend not configured; skipping reminders."]}` with valid secret; `/r/<bogus>` and `/unsubscribe/<bad>` render their pages; `/api/webhooks/billing` compiled; public 404 works on non-existent paths like `/pricing/nope`.
- ⚠️ End-to-end authenticated cookie flow over curl returned 307→/login during verification — the cause was the test JWT being issued before the user was auto-confirmed, then deleted by cleanup before the follow-up request hit (race in the verification script), not a code defect. Supabase signup + email confirm + token issuance work correctly against the new project when called directly against the auth API. Real-browser login via the UI is the definitive check (can't be driven from this sandbox without Playwright).
- ⏳ Email send/click/unsubscribe (T4–T6) — awaiting Resend credentials.
- ⏳ Polar Sandbox (T10) — awaiting Polar sandbox credentials + public deploy for webhook.
- ⏳ 375px mobile pass — not done in sandbox.

### Verified against previous test project `kajolpuntjurjrozovnq` (2026-09-29)
- ✅ Migrations applied (using `run-all-migrations-safe.sql` + `repair-legacy-schema.sql` because the project was originally created from an alpha schema with different `message_templates`/`click_events` shapes).
- ✅ Anon RLS test passes: anon role returns `[]` on businesses/customers/review_requests and 401 on writes.
- ✅ All five tables respond 200 via service-role API with the production column set: businesses (incl. mailing_address, plan, 6 billing columns), customers, review_requests (incl. reminder_claimed_at), message_templates (request_subject/body + reminder_subject/body), click_events (request_id/ip_hash/user_agent/is_bot/created_at).
- ✅ Public pages all return 200: `/`, `/pricing`, `/privacy`, `/terms`, `/signup`, `/login`, `/manifest.webmanifest`, `/robots.txt`, `/sitemap.xml`.
- ✅ Middleware redirects unauth `/app` → `/login` (307).
- ✅ `/r/<bogus>` returns 200 with inline "link not found"; `/unsubscribe/<bad>` returns 200 with invalid-token UI.
- ✅ `/api/cron/reminders` returns 401 without bearer; with valid `CRON_SECRET` returns structured JSON `{ok:false, errors:["Resend not configured; skipping reminders."]}` (graceful failure).
- ✅ Security headers present: CSP, HSTS, X-Frame-Options: DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
- ✅ Rate limiting returns 429 after 20 hits/min on auth (verified in prior phase; not re-hit to avoid polluting logs).
- ✅ 404 page renders on public paths (`/pricing/nope` → 404).
- ✅ Signup creates a Supabase user (confirmed via direct auth API); the signup/login server actions build and render correctly but weren't driven end-to-end with a browser (needs email-confirmation click-through or Playwright).
- ⏳ End-to-end email send/click/unsubscribe (T4–T6) blocked on B1/B2 (Resend key).
- ⏳ Polar Sandbox checkout (T10) blocked on C6–C11 (not yet provided).
- ⏳ 3-day reminder cron (T7) only verifiable after a real send + 3 day wait.
- ⏳ Manual 375px mobile pass not done in this sandbox.

### Post-launch (nice-to-haves)
- Replace the in-memory rate limiter with Upstash/Redis for multi-instance consistency.
- Run Next.js 16's `middleware-to-proxy` codemod when ready.
- Add branded logo/favicon assets.
- Seed/demo data script.

---

## Built (not yet verified end-to-end)

### Phase 8: Landing page and polish ✓
- Rewrote landing page at `/`: hero with gradient halo, 4-stat hero strip, step-numbered How it works, 6-card feature grid (compliance, bot tracking, dashboard, templates, CSV, no review gating), "Honest answers" FAQ that explicitly addresses "we cannot detect posted reviews" and "no review gating", final CTA section.
- Sticky backdrop-blur marketing header with Pricing/Privacy/Terms nav; proper footer with copyright + nav + contact link.
- SEO: full `metadata` in root layout (metadataBase, title template, description, OG, Twitter card, icons), page-specific metadata on Terms/Privacy and the landing page.
- `robots.ts` (disallows `/app/`, `/api/`, points to sitemap); `sitemap.ts` (lists marketing routes).
- PWA: `manifest.ts` (standalone display, theme color) + `/public/icon.svg` brand mark.
- `not-found.tsx` (404) and `error.tsx` (500 with reset) with friendly cards and CTAs.
- Replaced Terms/Privacy placeholders with real, plain-language policies covering acceptable use, no-incentivized-reviews rule, billing/subscriptions, subprocessors (Supabase/Resend/Polar/Vercel), data retention, and user rights.

### Phase 7: Billing (Polar) ✓
- Provider: Polar (polar.sh), Merchant of Record. Installed `@polar-sh/sdk`.
- Plan constants: Free 10/mo, Pro 300/mo @ $12, Business 1500/mo @ $29; reminders count toward quota.
- Migration `00005_billing_columns.sql` adds billing_customer_id / billing_subscription_id / billing_provider / subscription_status / current_period_end / cancel_at_period_end.
- Shared quota helper (`src/lib/billing/quota.ts`) used by send actions, reminder cron, dashboard, and billing page.
- Dedicated `/app/settings/billing` page: current plan card with Progress usage meter, plan picker cards for Free/Pro/Business, success/canceled flash messages, "Manage subscription" portal link for active subscribers.
- Server action `startCheckout` creates a Polar checkout (with userId/businessId/plan metadata) and redirects; client `CheckoutButton` shows loading state + errors inline.
- `POST /api/webhooks/billing`: signature-verified via `validateEvent`; syncs customer ID on checkout.updated, plan/period/cancel flag on subscription events; downgrades to free on subscription.revoked.
- `.env.example` updated with POLAR_ACCESS_TOKEN / POLAR_WEBHOOK_SECRET / POLAR_PRO_PRODUCT_ID / POLAR_BUSINESS_PRODUCT_ID.
- When Polar is unconfigured (dev), upgrade buttons show "Coming soon" and the free-plan cap still applies.

### Phase 6: Dashboard polish ✓
- Stat cards: emails sent (30d, initial + reminders), click rate, clicks, manually confirmed reviews
- 30-day sends chart: dependency-free inline SVG line chart, daily buckets, native tooltip, responsive
- Quota meter: rolling 30-day usage vs plan limit (color-coded — green/amber/red), upgrade CTA at/near limit
- Quick-add form embedded directly on the dashboard (name + email + consent checkbox → add customer and send a review request in one submit, inline success/error, form auto-resets)
- Recent-requests list with "View all" link; Quick Actions panel retained with customer count + links
- Quota counting extracted into shared `src/lib/billing/quota.ts` (`countRecentSends`) used by initial/bulk/resend actions, reminder cron, dashboard, and billing page

## Planned

### Phase 9: Hardening and launch
- Two-account cross-tenant RLS isolation test (already in Known Issues)
- Rate limiting (per-business sends, per-IP on auth and /r/[code])
- Security headers (CSP, X-Frame-Options, Referrer-Policy)
- Final README and Vercel deployment guide (SPF/DKIM/DMARC)
- Full acceptance criteria verification

---

## Known Issues

- **End-to-end flows require configured Supabase + Resend projects** — code is built but can only be smoke-tested in this sandbox without real credentials and all five migrations applied.
- **Two-account RLS isolation test not yet run** — must be verified against a live Supabase project before launch. Use `scripts/verify-rls-isolation.sh` which prints a parameterized SQL template for the Supabase SQL Editor (positive + negative checks for customers, review_requests, and businesses, plus an UPDATE/INSERT attempt).
- **Billing (Polar) is wired up but not live-verified** — create a Polar account, two recurring products, and a webhook pointing to `/api/webhooks/billing`; the webhook signature verification + plan-sync logic is implemented, and quotas are already enforced from `businesses.plan`.
- **No logo/branding assets** — using simple Lucide icon marks + a generated SVG app icon; replace with real brand assets before launch.
- **Next.js 16 middleware deprecation warning** — `middleware.ts` still works; codemod available (`npx @next/codemod@canary middleware-to-proxy .`).
- **CSV column mapping is auto-detected**, not user-facing — covers common headers; can add manual mapping later if needed.
- **Rate limiter is in-memory** — works well enough to blunt abuse on a single Vercel instance; for production scale consider Upstash/Redis (the rate-limit helper is isolated so swapping backends is a single-file change).
- **Resend account + verified sending domain** required for real email delivery in production.
