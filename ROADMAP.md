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
- Add Customer dialog (name, email, optional phone, required consent checkbox, "Add and send" checkbox)
- Per-row delete with confirm, ownership-guarded server-side
- CSV import via Papaparse: auto column detection, duplicate detection by email, per-row error report, bulk consent checkbox, 5 MB cap
- Unsubscribed customers marked with red badge and blocked from re-add (server enforced)
- Server actions: `addCustomer`, `deleteCustomer`, `importCustomers` with Zod validation and field errors
- Dashboard "Send a request" CTA links to Customers

---

## In Progress

(None actively in development)

---

## Next

### Phase 4: Sending emails
- Wire Resend into `sendEmail()` (HTML + plain text, List-Unsubscribe header, Reply-To)
- Templates page (`/app/templates`) for editing request + reminder emails with live preview and Reset-to-default
- Short code generation (8-char crypto-random, stored on review_requests)
- Single send flow (from Customers page, creates review_request, generates code, sends email, updates status)
- Bulk send to selected customers (respects plan limits — placeholder enforcement for now)
- Requests page (`/app/requests`) with table, status badges, filters (status, date), row actions (resend, mark reviewed)
- Signed one-click unsubscribe tokens
- Basic rate limiting stub (max sends per hour)

---

## Planned

### Phase 5: Tracking and reminders
- `/r/[code]` public tracking redirect with service-role click logging
- Basic bot/scanner user-agent filtering
- One-click unsubscribe flow (permanent per-business)
- Cron job `/api/cron/reminders` for automatic reminders (3 days, one reminder max)

### Phase 6: Dashboard
- Real stat cards (sent, click rate, reminders, confirmed reviews) from DB
- 30-day requests chart
- Recent activity feed with status badges
- Prominent "Send a request" quick action completing the 10-second flow

### Phase 7: Billing
- Plan constants and server-side limit enforcement
- Usage meter and upgrade prompts
- Billing provider integration (Polar or Lemon Squeezy)
- Checkout, webhook handling, customer portal link

### Phase 8: Landing page and polish
- Final marketing landing page (hero, how-it-works, pricing, FAQ with honest Google/Compliance answers)
- SEO metadata and PWA manifest
- Empty states, error pages, loading skeletons, toasts
- Final Privacy & Terms pages; mobile polish pass at 375px

### Phase 9: Hardening and launch
- RLS cross-account security test (two real accounts)
- Rate limiting (per-business sends, per-IP on auth and /r/[code])
- Security headers (CSP, X-Frame-Options, Referrer-Policy)
- Final README and Vercel deployment guide (SPF/DKIM/DMARC)
- Full acceptance criteria verification

---

## Known Issues

- **End-to-end auth/database flows require a Supabase project** — code is complete but can't be fully exercised without credentials and migration applied.
- **Test-send and real email sending not functional until Phase 4** — Resend integration is the next milestone.
- **Billing not integrated yet** (Phase 7).
- **No logo/branding assets** — using simple lucide icon marks.
- **Requests, Templates, Tracking, Reminders are placeholders** — built in Phases 4 and 5.
- **Next.js 16 middleware deprecation warning** — works now; codemod available (`npx @next/codemod@canary middleware-to-proxy .`).
- **"Add and send"** checkbox on Add Customer dialog is informational until Phase 4.
- **CSV column mapping is auto-detected**, not user-facing — covers common headers; can add manual mapping later if needed.
- **Resend account + verified sending domain** needed for Phase 4.
