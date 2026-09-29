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
- Next.js 16.3.6 (App Router) + TypeScript + Tailwind CSS v4 + ESLint initialized
- shadcn/ui-style base components: Button, Card, Input, Label, Textarea, Checkbox, Badge, Skeleton
- Supabase client, server, and service-role helpers with TypeScript database types
- Middleware for session refresh and route protection (redirect logic + graceful no-env fallback)
- Auth pages: `/login`, `/signup`, `/forgot-password` with email/password + Google OAuth server actions
- `/auth/callback` route for auth code exchange
- Protected app shell with responsive sidebar/nav and user menu
- Dashboard page with stat card placeholders and "Send a request" CTA
- Placeholder pages for every planned route (Customers, Requests, Templates, Settings, Onboarding, Pricing, Privacy, Terms, tracking link, unsubscribe)
- Placeholder API routes for cron and billing webhook
- Full SQL migration (`00001_initial_schema.sql`) with all 6 tables, RLS policies, indexes, CHECK/UNIQUE constraints, and a short_code helper function
- `.env.example` with all required environment variables
- Teal accent color (teal-600 `#0d9488`) configured as primary via CSS variables
- Graceful "setup required" banner/card when Supabase is not configured
- Build and lint pass cleanly; all routes return 200

---

## In Progress

_Awaiting approval to begin Phase 2._

(None actively in development)

---

## Next

### Phase 2: Business setup (Onboarding + Settings)
- 3-step onboarding wizard (business info → Google review link → template preview + test send)
- Auto-create default message templates when business is created
- Settings page (edit business info, review link, reply-to email, contact line)
- Auto-redirect to onboarding for new users without a business
- Google review link URL validation (accept `g.page`, `google.com/maps`, `search.google.com/local/writereview`, `maps.app.goo.gl`)

---

## Planned

### Phase 3: Customers
- Customer list page with search, sort, delete
- Add customer form with required consent checkbox
- "Add and send" quick action
- CSV import with column mapping, duplicate detection, error reporting
- Unsubscribed customer blocking

### Phase 4: Sending emails
- Templates page with live preview and "reset to default"
- `sendEmail()` function via Resend (HTML + plain text)
- Short code generation (8-char, unguessable)
- Single and bulk send server actions
- Requests table with status filters and row actions
- Signed unsubscribe links and List-Unsubscribe header

### Phase 5: Tracking and reminders
- `/r/[code]` public tracking redirect with click logging (service-role server-side)
- Basic bot/scanner detection
- One-click unsubscribe flow
- Cron job for automatic reminders (3 days, one reminder max)

### Phase 6: Dashboard
- Real stat cards (sent, click rate, reminders, confirmed reviews) from DB data
- 30-day requests chart
- Recent activity feed with status badges
- Prominent "Send a request" quick action (10-second flow)

### Phase 7: Billing
- Plan constants and server-side limit enforcement
- Usage meter and upgrade prompts
- Billing provider integration (Polar or Lemon Squeezy)
- Checkout, webhook handling, customer portal

### Phase 8: Landing page and polish
- Final marketing landing page (hero, how-it-works, pricing, FAQ)
- SEO metadata and PWA manifest
- Empty states, error pages, loading skeletons
- Final Privacy & Terms pages
- Mobile polish pass (375px)

### Phase 9: Hardening and launch
- RLS cross-account security test (two real accounts)
- Rate limiting and security headers
- Final README and Vercel deployment guide (SPF/DKIM/DMARC)
- Full acceptance criteria verification

---

## Known Issues

- **Auth requires Supabase:** Sign-up/log-in flows are implemented but cannot be end-to-end tested until a Supabase project is created and env vars are configured.
- **Billing provider not chosen:** Polar and Lemon Squeezy are both documented; final selection needed in Phase 7.
- **No logo/branding assets yet** — using a simple mail/bar-chart icon mark.
- **No real data yet:** Dashboard shows placeholder zeros; Customers/Requests/Templates/Settings pages are placeholders until later phases.
- **Next.js 16 middleware warning:** Next 16 deprecated "middleware" in favor of "proxy". Current code works; a codemod is available (`npx @next/codemod@canary middleware-to-proxy .`) but not urgent.
- **Resend and billing accounts needed** before Phases 4 and 7 respectively.
