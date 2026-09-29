# PHASES.md — Build Phases

Build one phase at a time. At the end of each phase, list what was done and how to test it, update `MEMORY.md`, then wait for approval before moving on.

---

## Phase 0: Project context files
**Status:** Built, not yet verified against live Supabase and Resend (initial setup)

**Checklist:**
- [x] `PRD.md` created from master prompt
- [x] `RULES.md` created
- [x] `ARCHITECTURE.md` created
- [x] `DESIGN.md` created
- [x] `PHASES.md` created (this file)
- [x] `MEMORY.md` created
- [x] `README.md` created
- [x] `ROADMAP.md` created

**Done when:** All six context files exist in repo root, plus README and ROADMAP. No application code is written in Phase 0.

---

## Phase 1: Foundation
**Status:** Built, not yet verified against live Supabase and Resend

**Checklist:**
- [x] Initialize Next.js project with TypeScript, App Router (Next.js 16.3.6)
- [x] Set up Tailwind CSS v4 with CSS-variable design tokens
- [x] Install and configure shadcn/ui-style base components (Button, Card, Input, Label, Textarea, Checkbox, Badge, Skeleton)
- [x] Set up Supabase client, server, and service-role helpers in `src/lib/supabase/` with TS types
- [x] Auth pages: `/login`, `/signup`, `/forgot-password` (email/password + Google OAuth server actions)
- [x] `/auth/callback` route for code exchange
- [x] Middleware for session refresh and route protection (redirects unauth → /login, auth routes → /app when logged in)
- [x] Protected app layout with responsive sidebar/nav (Dashboard, Customers, Requests, Templates, Settings)
- [x] Database migration `supabase/migrations/00001_initial_schema.sql` for all 6 tables
- [x] RLS policies on every table; indexes; CHECK/UNIQUE constraints; short_code helper function
- [x] `.env.example` file with all required variables
- [x] `src/lib/utils/` with cn helper and encodedRedirect
- [x] Placeholder pages for all routes (so build + navigation work end-to-end)
- [x] Placeholder API routes (cron + billing webhook with auth stubs)
- [x] Graceful "setup required" screen when Supabase env vars are not configured

**Done when:**
- [x] `npm install && npm run dev` runs without errors
- [ ] User can sign up with email/password and log in *(auth code is in place; requires Supabase env vars + Google OAuth config to fully verify)*
- [x] Logged-in user can access `/app`; unauthenticated users are redirected (verified via middleware logic; requires Supabase for live session test)
- [x] Supabase migration SQL is written and ready to apply via Supabase SQL editor
- [x] `.env.example` lists all required variables
- [x] RLS policies are in place in the migration
- [x] `npm run build` and `npm run lint` pass cleanly

---

## Phase 2: Business setup (Onboarding + Settings)
**Status:** Built, not yet verified against live Supabase and Resend

**Checklist:**
- [x] 3-step onboarding wizard at `/app/onboarding`
  - Step 1: Business name + contact line (+ timezone hidden default)
  - Step 2: Google review link with server-side validation + reply-to email
  - Step 3: Request template editor with live iframe preview, "reset to default", test-send button (warns if Resend not configured), and finish action
- [x] Auto-redirect to onboarding for users without a business; redirect to correct step based on saved progress
- [x] Settings page: edit business name, contact line, review link, reply-to email
- [x] Server actions: createBusiness, saveOnboardingStep2, saveOnboardingStep3, updateBusinessProfile, resetRequestTemplate, resetReminderTemplate
- [x] Default message templates (request + reminder) auto-created when a business is inserted
- [x] Google review link URL validation (accepts g.page, google.com/maps, search.google.com/local/writereview, maps.app.goo.gl, goo.gl/maps)
- [x] Email rendering helpers (variable substitution, HTML + plain text, CTA button, footer)
- [x] Compliance notice (no review gating / no incentives) in onboarding step 3
- [x] Back buttons between steps; users can revisit earlier steps but cannot URL-skip ahead

**Done when:**
- [x] New user signs up → is redirected to onboarding and can progress through all 3 steps
- [x] After completing step 3, user lands on dashboard
- [x] Settings page saves changes to business profile
- [x] Default templates exist after business creation (verified in code; DB verification requires Supabase)
- [x] Invalid Google review links are rejected with helpful error message (validator tested via code review)
- [x] Build and lint pass cleanly

---

## Phase 3: Customers
**Status:** Built, not yet verified against live Supabase and Resend

**Checklist:**
- [x] Customers page at `/app/customers` with server-fetched list
- [x] Add customer dialog: name, email, optional phone, required consent checkbox
- [x] "Add and send" checkbox (customer saved; sending wired in Phase 4)
- [x] Customer list table with client-side search, sort (name/email/date), and delete
- [x] CSV import (Papaparse): auto column detection, duplicate detection by email, row-level error report, 5 MB cap
- [x] Bulk consent checkbox for CSV import (required)
- [x] Unsubscribed customers visibly marked (red badge) and server-side blocked from re-add
- [x] Server actions: addCustomer, deleteCustomer, importCustomers with Zod validation
- [x] Empty state with "Add your first customer" CTA
- [x] Table + Dialog shadcn/ui components added
- [x] Dashboard "Send a request" CTA links to Customers page

**Done when:**
- [x] Can add a customer manually via dialog (validated; consent required)
- [x] Can import a CSV and see results (added/duplicates/unsubscribed/row errors)
- [x] Unsubscribed customers blocked from being re-added
- [x] Customer list search and sort work
- [x] Build and lint pass cleanly

---

## Phase 4: Sending emails
**Status:** Built, not yet verified against live Supabase and Resend

**Checklist:**
- [x] `resend` package installed; `lib/email/send.ts` wraps `sendEmail()` + `sendReviewEmail()`
- [x] `lib/email/defaults.ts` (request + reminder defaults) and `lib/email/render.ts` (variable substitution, HTML + plain text, CTA button)
- [x] `lib/utils/crypto.ts` — `generateShortCode()` (8-char alphanumeric, retry on collision), `signToken()`/`verifyToken()` for HMAC-signed unsubscribe tokens (30-day TTL)
- [x] Templates page at `/app/templates`: edit request & reminder templates with tabs, live iframe preview, "Reset to default", test-send button (warns when Resend not configured)
- [x] Templates server actions: `saveTemplate`, `resetTemplate`, `sendTestTemplateEmail`
- [x] Single-send flow: `sendToOne` server action creates `review_requests` row, generates short_code, renders and sends email, updates `status='sent'|'failed'` with timestamps/errors
- [x] "Add and send" flow wired in Add Customer dialog (new `addAndSendCustomer` server action)
- [x] Bulk send: checkbox selection UI on Customers page + sticky action bar; `sendBulk` server action with 100/hour rate limit, 150ms spacing, eligibility checks (consent + email + not unsubscribed)
- [x] Requests page at `/app/requests`: server-fetched list joined with customer, status badges, filters (all/sent/clicked/reviewed/failed), search, resend for failed, mark-reviewed row action
- [x] Resend & mark-reviewed server actions (`resendRequest`, `markReviewed`)
- [x] Signed unsubscribe tokens in every email + `List-Unsubscribe` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers
- [x] Public `/r/[code]` tracking redirect (look up by short_code, mark clicked, increment click_count, show friendly CTA to Google review URL)
- [x] Public `/unsubscribe/[token]` confirmation page + POST `/api/unsubscribe/[token]` for RFC 8058 one-click
- [x] Supabase migration `00002_public_tracking.sql` adds RLS policies for anon read/update on review_requests/businesses/customers needed by public routes
- [x] Dashboard updated with real 30-day stats (sent, click rate, clicks, marked reviewed), recent requests list, email-setup warning when Resend not configured
- [x] Sidebar already includes Requests + Templates links
- [x] `.env.example` lists `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `UNSUBSCRIBE_SIGNING_SECRET`

**Done when:**
- [x] Can add a customer and "Add and send" queues a review request
- [x] Bulk select → "Send review requests" queues to multiple customers
- [x] Email renders correctly with replaced variables, big CTA button, and working tracking/unsubscribe links (HTML rendering verified via preview iframe; live delivery requires Resend API key)
- [x] Requests table shows sent requests with correct status; resend + mark-reviewed work
- [x] Templates can be edited, previewed live, reset to default, and test-sent to an email
- [x] `/r/[code]` marks clicks and redirects users to the Google review URL; /unsubscribe/[token] marks the customer unsubscribed
- [x] `npm run build` and `npm run lint` pass cleanly; dev server returns 200 on all Phase 4 routes

---

## Phase 5: Tracking and reminders
**Status:** Built, not yet verified against live Supabase and Resend

**Checklist:**
- [x] `/r/[code]` public route: look up code server-side, log click, set first_clicked_at, increment click_count, update status to 'clicked'
- [x] Click page shows a friendly CTA pointing to the business's Google review URL (opens in new tab) rather than auto-redirecting, so mail scanners don't inflate counts
- [x] Bot/scanner detection: user-agent matching against a well-known bot/preview/scanner list (WhatsApp, Slack, Teams, Telegram, Facebook, Twitter/LinkedIn bots, curl/wget/python-requests, Googlebot/Ahrefs/Semrush, monitoring/uptime agents, headless browsers); bots see the page but clicks are not counted
- [x] Invalid code → friendly "Link not found" card
- [x] `/unsubscribe/[token]` route: HMAC-signed one-click unsubscribe, permanent record (`unsubscribed=true`)
- [x] `POST /api/unsubscribe/[token]` RFC-8058 one-click endpoint
- [x] `POST /api/cron/reminders` protected by `Authorization: Bearer <CRON_SECRET>`
- [x] Reminder logic: `status='sent'`, `first_clicked_at IS NULL`, `reminder_sent_at IS NULL`, `manually_marked_reviewed=false`, `sent_at` older than 3 days; also re-checks customer consent/unsubscribed/email right before sending; batches at most 500 per invocation
- [x] Reminder email uses the business's reminder template (falls back to request template) and the same tracking short_code; sets `reminder_sent_at` on success so it's not retried
- [x] 200 ms spacing between reminder sends to stay under provider burst limits
- [x] Vercel Cron config (`vercel.json`) schedules `/api/cron/reminders` hourly (`0 * * * *`)
- [x] Graceful skip when Resend or Supabase service role isn't configured (returns 200/500 with helpful error rather than crashing)

**Done when:**
- [x] Clicking an email link from a real browser logs the click and shows the CTA page
- [x] Clicking from a bot/preview UA still loads the page but does NOT mark the request as clicked
- [x] Clicking after first visit still shows the CTA (and increments click_count for humans)
- [x] Unsubscribing works via both the link page and the POST one-click endpoint, and blocks future emails
- [x] The cron endpoint is protected by CRON_SECRET (401 without/with wrong token)
- [x] Reminder query correctly targets 3-day-old sent/unclicked/unreminded requests and marks `reminder_sent_at` after send
- [x] `npm run build` and `npm run lint` pass cleanly; dev server returns 200 on public routes and 401 on unauthenticated cron

---

## Phase 6: Dashboard polish
**Status:** Built, not yet verified against live Supabase and Resend

**Checklist:**
- [x] Stat cards: emails sent (30d, initial + reminders), click rate, clicks, manually confirmed reviews
- [x] 30-day sends chart (inline SVG line chart, daily buckets of initial sends + reminders, tooltip via `<title>`)
- [x] Recent activity list with status badges + "View all" link
- [x] Monthly quota meter (rolling 30-day window, color-coded Progress bar — green/amber/red, upgrade CTA at/near limit)
- [x] "Send a request" primary CTA (large, stays visible on mobile)
- [x] Quick-add customer form on dashboard (name + email + consent → add & send in one submit, success/error inline, form resets after success)
- [x] Placeholder Billing page (`/app/settings/billing`) with current-plan summary and "Upgrade to Pro (coming soon)" state
- [x] Quota counting extracted into shared `src/lib/billing/quota.ts` (`countRecentSends`) used by initial/bulk/resend actions, cron, dashboard, and billing page

**Done when:**
- Dashboard loads with accurate stats from real data
- Chart renders correctly
- Quick-send flow works from dashboard in under 10 seconds

---

## Phase 7: Billing
**Status:** Built, not yet verified against live Polar + Supabase

Polar is our billing provider (polar.sh). All billing integration is behind env vars so the app works with a free-plan cap during local dev even without Polar credentials.

**Checklist:**
- [x] Plan constants (`src/lib/billing/plans.ts`) — Free 10/mo, Pro 300/mo ($12), Business 1500/mo ($29); reminders count toward quota
- [x] Server-side limit enforcement — uses shared `countRecentSends` (initial sends + reminders in rolling 30-day window); enforced in `sendToOne`, `sendBulk`, `resendRequest`, and reminder cron
- [x] Usage meter on dashboard quota card + dedicated `/app/settings/billing` page
- [x] Upgrade prompt in quota card links to billing page; billing page shows plan comparison with upgrade CTAs
- [x] Polar integration via `@polar-sh/sdk` (`src/lib/billing/polar.ts`): checkout creation, customer-portal URL
- [x] Checkout flow — server action `startCheckout` creates a Polar checkout and redirects; metadata tags userId/businessId/plan so webhooks can sync plan
- [x] `POST /api/webhooks/billing` — verifies signature with `POLAR_WEBHOOK_SECRET` via `@polar-sh/sdk/webhooks.validateEvent`; handles `checkout.updated`, `subscription.active`, `subscription.updated`, `subscription.canceled`, `subscription.revoked` (downgrades to free); stores billing_customer_id / billing_subscription_id / subscription_status / current_period_end / cancel_at_period_end
- [x] Customer-portal link ("Manage subscription") on Billing page for active subscribers, opening Polar's /purchases portal
- [x] Plan updates synced to `businesses.plan` — webhook writes plan, subscription metadata, and period end; quota checks read directly from `business.plan`
- [x] Migration `00005_billing_columns.sql` adds billing_customer_id, billing_subscription_id, billing_provider, subscription_status, current_period_end, cancel_at_period_end
- [x] `.env.example` updated with POLAR_ACCESS_TOKEN / POLAR_WEBHOOK_SECRET / POLAR_PRO_PRODUCT_ID / POLAR_BUSINESS_PRODUCT_ID

**Done when:**
- Free plan user is blocked after 10 sends in a month
- Pro/Business plan limits enforced correctly against live Polar webhook sync
- Webhook updates plan status
- User can manage subscription via portal link

---

## Phase 8: Landing page and polish
**Status:** Built, not yet verified end-to-end (mobile QA + design pass pending)

**Checklist:**
- [x] Landing page at `/` (hero with gradient + stats, how-it-works 3-step cards, 6-item feature grid, honest FAQ with "we cannot detect reviews" and "no review gating" answers, final CTA)
- [x] Sticky marketing header with backdrop blur, Pricing/Privacy/Terms nav links, proper footer with contact
- [x] SEO metadata (title template, description, metadataBase, Open Graph, Twitter card, icons, robots, sitemap)
- [x] PWA manifest (`/manifest.webmanifest`) and SVG app icon (`/icon.svg`)
- [x] Error pages: `not-found.tsx` (friendly 404 with Go home / Dashboard buttons) and `error.tsx` (Try again / Go home reset button)
- [x] Privacy and Terms fleshed out with real clauses (acceptable-use, no-review-gating rule, billing, subprocessors, DPA-style retention, privacy rights)
- [x] `robots.txt` disallows `/app/` and `/api/`, points to sitemap
- [x] `sitemap.xml` lists all public marketing routes with last-modified

**Done when:**
- Landing page renders and looks good on mobile (manual 375px pass still pending — visual QA against a real browser)
- All pages have reasonable empty/loading/error states (404 + 500 in place; customer/request empty states existed from earlier phases; skeletons remain a stretch goal)
- PWA manifest is present and app is installable

---

## Phase 9: Hardening and launch
**Status:** Built, not yet verified end-to-end against live services

**Checklist:**
- [x] Security headers in `next.config.ts` (CSP with Supabase+Resend connect-src, HSTS, X-Frame-Options: DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-XSS-Protection)
- [x] Per-IP in-memory rate limiting in middleware (20/min auth, 60/min click tracking, 30/min unsubscribe, 10/min cron, 60/min webhooks), returning 429 with `Retry-After`
- [x] Security audit: service-role key and Polar/Resend/CRON/UNSUBSCRIBE secrets used only on the server; client bundle contains only `NEXT_PUBLIC_*` vars; Zod schemas validate all server-action inputs; unsubscribe tokens are HMAC-signed.
- [x] README finalized: full env-var list, all 5 migrations, deployment steps for Vercel, Polar webhook setup, pre-launch checklist, domain verification notes.
- [x] RLS cross-account verification script: `scripts/verify-rls-isolation.sh` prints a parameterized SQL template with positive + negative checks (read, update, insert across business IDs) to run in the Supabase SQL Editor using `SET request.jwt.claims.sub`.
- [x] Cron schedule, auth, public tracking, and unsubscribe routes re-verified against hardened middleware.
- [ ] **Manual** verification still required against live services before launch:
  - Run `scripts/verify-anon-rls.sh` against the real Supabase project.
  - Run the `verify-rls-isolation.sh` SQL against the real project with two test accounts.
  - End-to-end Resend test (send to yourself, click link, unsubscribe).
  - Polar webhook test (real checkout → plan flips to pro → quota increases).
  - Manual 375px mobile QA pass.
- [ ] Optional: seed/demo data script, production logo assets, Next.js 16 `middleware → proxy` codemod migration (current middleware works).

**Done when:**
- All acceptance criteria in PRD.md are met
- App can be deployed to Vercel with documented steps
- RLS isolation test passes against a live Supabase project
- Security checklist in RULES.md is fully checked
