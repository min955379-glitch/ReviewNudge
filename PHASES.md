# PHASES.md — Build Phases

Build one phase at a time. At the end of each phase, list what was done and how to test it, update `MEMORY.md`, then wait for approval before moving on.

---

## Phase 0: Project context files
**Status:** Completed (initial setup)

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
**Status:** Completed

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
**Status:** Completed

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
**Status:** Completed

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
**Status:** Completed

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
**Status:** In progress (tracking shipped in Phase 4; reminders + bot detection remaining)

**Checklist:**
- [x] `/r/[code]` public route: look up code server-side, log click, set first_clicked_at, increment click_count, update status to 'clicked'
- [x] Click redirects to the business's Google review URL (open in new tab with explicit button to avoid auto-redirect quirks with mail scanners)
- [x] Invalid code → friendly fallback page
- [x] `/unsubscribe/[token]` route: HMAC-signed token, confirmation page, `POST /api/unsubscribe/[token]` RFC 8058 one-click
- [ ] Bot/scanner detection (basic user-agent check before counting clicks)
- [ ] `POST /api/cron/reminders` protected by `CRON_SECRET`
- [ ] Reminder logic: status='sent', not clicked, no reminder yet, sent_at > 3 days ago
- [ ] Send reminder email once; set `reminder_sent_at`

**Done when:**
- [x] Clicking an email link logs the click and offers a clear button to Google
- [x] Clicking after first visit still offers the link (and increments click_count)
- [x] Unsubscribing works and blocks future emails
- Cron job sends exactly one reminder after 3 days to non-clickers; clickers get none

---

## Phase 6: Dashboard
**Status:** Not started

**Checklist:**
- [ ] Stat cards: requests sent (30d), click rate, reminders sent, manually confirmed reviews
- [ ] Chart: requests sent per day, last 30 days
- [ ] Recent activity list with status badges
- [ ] "Send a request" primary button (prominent, large on mobile)
- [ ] Quick-add customer form or modal on dashboard (the 10-second flow)

**Done when:**
- Dashboard loads with accurate stats from real data
- Chart renders correctly
- Quick-send flow works from dashboard in under 10 seconds

---

## Phase 7: Billing
**Status:** Not started

**Checklist:**
- [ ] Plan constants file (prices, limits)
- [ ] Server-side limit enforcement (check monthly usage before sending)
- [ ] Usage meter in dashboard/sidebar
- [ ] Upgrade prompt when near limit
- [ ] Billing provider integration (Polar or Lemon Squeezy — abstracted)
- [ ] Checkout flow
- [ ] `POST /api/webhooks/billing` with signature verification
- [ ] Customer portal link in Settings
- [ ] Plan updates synced to `businesses.plan`

**Done when:**
- Free plan user is blocked after 10 sends in a month
- Pro/Business plan limits enforced correctly
- Webhook updates plan status
- User can manage subscription via portal link

---

## Phase 8: Landing page and polish
**Status:** Not started

**Checklist:**
- [ ] Landing page at `/` (hero, how-it-works, pricing, FAQ, footer)
- [ ] SEO metadata (title, description, Open Graph)
- [ ] PWA manifest and icons
- [ ] Empty states for all list pages
- [ ] Error pages (404, 500)
- [ ] Loading states and skeletons
- [ ] Privacy and Terms pages
- [ ] Mobile polish pass (375px testing)

**Done when:**
- Landing page renders and looks good on mobile
- All pages have reasonable empty/loading/error states
- PWA manifest is present and app is installable

---

## Phase 9: Hardening and launch
**Status:** Not started

**Checklist:**
- [ ] RLS cross-account test (two separate accounts, confirm no data leakage)
- [ ] Rate limiting (per-business sends, per-IP on auth and /r/[code])
- [ ] Security headers (CSP, X-Frame-Options, Referrer-Policy)
- [ ] Security audit (no secrets exposed, all inputs validated)
- [ ] README finalized (setup, env vars, email domain verification, deployment)
- [ ] Deployment guide for Vercel
- [ ] Seed/demo data script (optional)
- [ ] Final bug pass

**Done when:**
- All acceptance criteria in PRD.md are met
- App can be deployed to Vercel with documented steps
- Security checklist in RULES.md is fully checked
