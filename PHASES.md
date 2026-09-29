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
**Status:** Not started

**Checklist:**
- [ ] Onboarding wizard at `/app/onboarding` (3 steps)
  - Step 1: Business name + contact line
  - Step 2: Google review link (with validation)
  - Step 3: Preview default template, send test email to self
- [ ] Redirect to onboarding if business is not set up
- [ ] Settings page: edit business info, review link, reply-to email
- [ ] Server actions for creating/updating business
- [ ] Default message templates created automatically when business is created
- [ ] Google review link URL validation (accept `g.page`, `google.com/maps`, `search.google.com/local/writereview`, `maps.app.goo.gl`)

**Done when:**
- New user signs up → redirected to onboarding → completes 3 steps → lands on dashboard
- Settings page saves changes
- Default templates exist after onboarding
- Invalid Google review links are rejected with helpful message

---

## Phase 3: Customers
**Status:** Not started

**Checklist:**
- [ ] Customers page at `/app/customers`
- [ ] Add customer form: name, email, optional phone, required consent checkbox
- [ ] "Add and send" quick action
- [ ] Customer list table with search, sort, delete
- [ ] CSV import (Papaparse) with column mapping, duplicate detection, row-level errors
- [ ] Bulk consent checkbox for CSV import
- [ ] Unsubscribed customers visibly marked and blocked from sending
- [ ] Server actions for customer CRUD

**Done when:**
- Can add a customer manually
- Can import a CSV and see results (successes/errors/duplicates)
- Cannot email unsubscribed customers
- Customer list search and sort work

---

## Phase 4: Sending emails
**Status:** Not started

**Checklist:**
- [ ] Templates page at `/app/templates`: edit request & reminder templates
- [ ] Live preview with sample data
- [ ] "Reset to default" button
- [ ] `sendEmail()` function in `lib/email/` using Resend
- [ ] HTML + plain-text email rendering with variable substitution
- [ ] Short code generation (8 chars, cryptographically random)
- [ ] Single send (creates review_request, sends email, updates status)
- [ ] Bulk send to selected customers (respects limits)
- [ ] Requests page at `/app/requests`: table with status, filters, row actions
- [ ] Unsubscribe link in emails (signed token)
- [ ] List-Unsubscribe header

**Done when:**
- Can send a review request email to a customer
- Email renders correctly with replaced variables and working tracking link
- Requests table shows sent requests with correct status
- Templates can be edited, previewed, and reset
- Bulk send works

---

## Phase 5: Tracking and reminders
**Status:** Not started

**Checklist:**
- [ ] `/r/[code]` public route: look up code server-side with service role
- [ ] Log click event, increment click_count, set first_clicked_at, update status to 'clicked'
- [ ] Bot/scanner detection (basic user-agent check)
- [ ] 302 redirect to the business's Google review URL
- [ ] Invalid code → friendly fallback page
- [ ] `/unsubscribe/[token]` route: one-click unsubscribe, permanent record
- [ ] `POST /api/cron/reminders` protected by `CRON_SECRET`
- [ ] Reminder logic: status='sent', not clicked, no reminder yet, sent_at > 3 days ago
- [ ] Send reminder email once; set `reminder_sent_at`

**Done when:**
- Clicking an email link logs the click and redirects to Google
- Clicking after first visit still redirects (and increments click_count)
- Unsubscribing works and blocks future emails
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
