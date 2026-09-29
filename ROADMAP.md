# ROADMAP.md — ReviewNudge Development Roadmap

Last updated: 2026-09-29

---

## Completed

### Phase 0: Project context files ✓
- Created all six project context files (`PRD.md`, `RULES.md`, `ARCHITECTURE.md`, `DESIGN.md`, `PHASES.md`, `MEMORY.md`) from the master prompt
- Created `README.md` with project overview, features, tech stack, and setup instructions
- Created `ROADMAP.md` (this file)
- Product name confirmed: **ReviewNudge**
- All planning documentation is in place and aligned with the master spec

---

## In Progress

_Awaiting approval to begin Phase 1._

(None actively in development)

---

## Next

### Phase 1: Foundation
- Initialize Next.js 14+ with TypeScript and App Router
- Set up Tailwind CSS and shadcn/ui components
- Configure Supabase client/server helpers
- Auth: email/password + Google sign-in; login/signup/forgot-password pages
- Protected app layout (redirect unauthenticated users)
- Database migrations for all 6 tables with RLS policies and indexes
- `.env.example` with all required variables
- Basic global layout and navigation skeleton

---

## Planned

### Phase 2: Business setup (Onboarding + Settings)
- 3-step onboarding wizard (business info → Google review link → template preview/test send)
- Settings page (edit business info, review link, reply-to email)
- Auto-redirect to onboarding for new users
- Default message templates created on business creation
- Google review link URL validation

### Phase 3: Customers
- Customer list page with search, sort, delete
- Add customer form with required consent checkbox
- "Add and send" quick action
- CSV import with column mapping, duplicate detection, error reporting
- Unsubscribed customer blocking

### Phase 4: Sending emails
- Templates page with live preview and "reset to default"
- `sendEmail()` function via Resend with HTML + plain text
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
- Stat cards (sent, click rate, reminders, confirmed reviews)
- 30-day requests chart
- Recent activity feed
- Prominent "Send a request" quick action (10-second flow)

### Phase 7: Billing
- Plan constants and server-side limit enforcement
- Usage meter and upgrade prompts
- Billing provider integration (Polar or Lemon Squeezy)
- Checkout, webhook handling, customer portal

### Phase 8: Landing page and polish
- Marketing landing page (hero, how-it-works, pricing, FAQ)
- SEO metadata and PWA manifest
- Empty states, error pages, loading skeletons
- Privacy & Terms pages
- Mobile polish pass

### Phase 9: Hardening and launch
- RLS cross-account security test
- Rate limiting and security headers
- Final README and Vercel deployment guide
- Full acceptance criteria verification

---

## Known Issues

- **No code written yet** — Project is in planning/documentation phase only. The app does not run yet.
- **Billing provider not yet chosen** — Polar and Lemon Squeezy both documented; final selection needed in Phase 7.
- **No logo/branding assets** — Using text mark until design assets are provided.
- **No demo/seed data** — Will be added in Phase 9.
