# ROADMAP.md — ReviewNudge Development Roadmap

Last updated: 2026-09-29

---

## Completed

### Phase 0: Project context files ✓
- Created all six project context files (`PRD.md`, `RULES.md`, `ARCHITECTURE.md`, `DESIGN.md`, `PHASES.md`, `MEMORY.md`) from the master prompt
- Created `README.md` with project overview, features, tech stack, and setup instructions
- Product name confirmed: **ReviewNudge**
- All planning documentation in place and aligned with the master spec

### Phase 1: Foundation ✓
- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + ESLint initialized
- shadcn/ui-style base components: Button, Card, Input, Label, Textarea, Checkbox, Badge, Skeleton, Alert
- Supabase client, server, and service-role helpers with TypeScript database types
- Middleware for session refresh and route protection
- Auth pages: `/login`, `/signup`, `/forgot-password` with email/password + Google OAuth server actions
- `/auth/callback` route for auth code exchange
- Protected app shell with responsive sidebar/nav and user menu
- Dashboard page with placeholder stat cards and "Send a request" CTA
- Placeholder pages for every planned route
- Placeholder API routes for cron and billing webhook
- Full SQL migration (`00001_initial_schema.sql`) with all 6 tables, RLS policies, indexes, CHECK/UNIQUE constraints, and a short_code helper function
- `.env.example` with all required environment variables
- Teal accent color (teal-600 `#0d9488`) configured as primary
- Graceful "setup required" banner/card when Supabase is not configured
- Build and lint pass cleanly; all routes return 200

### Phase 2: Business setup (Onboarding + Settings) ✓
- 3-step onboarding wizard with step indicator, back navigation, and progress-aware redirects (can't URL-skip ahead)
  - Step 1: Business name + contact line (creates business and seeds default templates)
  - Step 2: Google review link (server-side URL validation) + reply-to email
  - Step 3: Request email editor with live iframe preview, "Reset to default", optional test-send button (warns if Resend not yet configured), and Finish action
- Default email templates (request + reminder) auto-created when a business is inserted
- Email rendering engine: variable substitution (`{{customer_name}}`, `{{business_name}}`, `{{review_link}}`), HTML with big CTA button, plain-text fallback, footer
- Settings page with business profile form (name, contact line, Google review link, reply-to email), plan badge, and billing/danger-zone placeholders
- Server actions with Zod validation for all business/profile mutations
- Google review URL validator (accepts g.page, google.com/maps, search.google.com/local/writereview, maps.app.goo.gl, goo.gl/maps)
- Compliance callout about no review gating and no incentives on onboarding step 3
- Dashboard now requires onboarding completion and redirects to the correct step

---

## In Progress

_Awaiting approval to begin Phase 3._

(None actively in development)

---

## Next

### Phase 3: Customers
- Customer list page at `/app/customers` with search, sort, delete
- Add customer form (name, email, optional phone, required consent checkbox)
- "Add and send" quick action (the 10-second flow)
- CSV import (Papaparse) with column mapping, duplicate detection by email, row-level error report
- Bulk consent checkbox for CSV imports
- Unsubscribed customers visibly marked and blocked from sending

---

## Planned

### Phase 4: Sending emails
- Templates page with live preview for request + reminder templates, "Reset to default"
- `sendEmail()` wired to Resend (HTML + plain text, List-Unsubscribe header)
- Short code generation (8-char cryptographically random)
- Single and bulk send server actions
- Requests table with status filters and row actions (resend, mark reviewed, details)
- Signed one-click unsubscribe links

### Phase 5: Tracking and reminders
- `/r/[code]` public tracking redirect with service-role click logging
- Basic bot/scanner user-agent filtering
- One-click unsubscribe flow (permanent per-business)
- Cron job for automatic reminders (3 days, one reminder max) — `POST /api/cron/reminders` with CRON_SECRET

### Phase 6: Dashboard
- Real stat cards (sent, click rate, reminders, confirmed reviews) from DB
- 30-day requests chart
- Recent activity feed with status badges
- Prominent "Send a request" quick action completing the 10-second flow

### Phase 7: Billing
- Plan constants and server-side limit enforcement (free: 10/mo, pro: 300/mo, business: 1500/mo)
- Usage meter and upgrade prompts
- Billing provider integration (Polar or Lemon Squeezy)
- Checkout, webhook handling, customer portal link

### Phase 8: Landing page and polish
- Final marketing landing page (hero, how-it-works, pricing, FAQ with honest Google/Compliance answers)
- SEO metadata and PWA manifest
- Empty states, 404/500 error pages, loading skeletons, toasts
- Final Privacy & Terms pages
- Mobile polish pass at 375px

### Phase 9: Hardening and launch
- RLS cross-account security test (two real accounts)
- Rate limiting (per-business sends, per-IP on auth and /r/[code])
- Security headers (CSP, X-Frame-Options, Referrer-Policy)
- Final README and Vercel deployment guide (SPF/DKIM/DMARC)
- Full acceptance criteria verification

---

## Known Issues

- **Auth/DB require Supabase project** — code is complete but end-to-end auth and database flows cannot be verified until a Supabase project is provisioned and env vars are configured. The migration file is ready to apply via the Supabase SQL editor.
- **Test email button non-functional until Phase 4** — it shows a friendly "email sending not set up yet" message; Resend integration lands in Phase 4.
- **Billing provider not chosen** — Polar vs Lemon Squeezy decision deferred to Phase 7.
- **No logo/branding assets** — using simple lucide icon marks.
- **Customers, Requests, Templates pages are placeholders** — real implementations begin in Phase 3.
- **Next.js 16 middleware deprecation warning** — current middleware works; can run `npx @next/codemod@canary middleware-to-proxy .` when convenient.
- **Resend account + verified sending domain** needed before Phase 4.
