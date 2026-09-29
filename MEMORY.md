# MEMORY.md — Development Log

## Completed

- **Phase 0 (2026-09-29):** Created all six project context files from the master prompt (PRD, RULES, ARCHITECTURE, DESIGN, PHASES, MEMORY), plus README.md and ROADMAP.md. Product name: ReviewNudge.

- **Phase 1 (2026-09-29): Foundation**
  - Initialized Next.js 16.3.6 (App Router, TypeScript, Tailwind CSS v4, ESLint).
  - Installed and configured shadcn/ui-style base components: Button, Input, Label, Textarea, Card, Checkbox, Badge, Skeleton.
  - Installed runtime deps: @supabase/ssr, @supabase/supabase-js, @radix-ui primitives, lucide-react, react-hook-form + @hookform/resolvers, zod, class-variance-authority, clsx, tailwind-merge, tailwindcss-animate.
  - Set up Supabase browser + server + service-role client helpers in `src/lib/supabase/` with TypeScript `Database` types.
  - Middleware (`src/middleware.ts`) using @supabase/ssr for session refresh and route protection:
    - Public routes: `/`, `/pricing`, `/privacy`, `/terms`, `/r/*`, `/unsubscribe/*`, `/api/*`, `/auth/*`
    - Auth routes (`/login`, `/signup`, `/forgot-password`) redirect to `/app` when already logged in
    - All other routes redirect to `/login` when not authenticated
    - Gracefully shows a setup banner when Supabase env vars are missing (no crash)
  - Auth pages: `/login`, `/signup`, `/forgot-password` with server actions for sign-up, sign-in (email/password), Google OAuth, forgot password, sign out.
  - `/auth/callback` route for Supabase auth code exchange.
  - Protected app shell (`src/app/app/layout.tsx`): responsive sidebar + top-bar navigation with links to Dashboard, Customers, Requests, Templates, Settings. Shows user email + logout button.
  - Dashboard page at `/app` with stat card placeholders, "Send a request" CTA, and a recent activity placeholder. Redirects to `/app/onboarding` if no business exists.
  - Placeholder pages for all routes: Customers, Requests, Templates, Settings, Onboarding, Pricing, Privacy, Terms, /r/[code], /unsubscribe/[token].
  - Placeholder API routes: `/api/cron/reminders` (CRON_SECRET-protected stub), `/api/webhooks/billing` (stub).
  - Full SQL migration `supabase/migrations/00001_initial_schema.sql`:
    - All 6 tables (businesses, customers, review_requests, message_templates, unsubscribes, click_events)
    - RLS policies on every table (ownership via business_id/owner_id)
    - Required indexes (business_id+created_at, short_code, customers.business_id)
    - CHECK constraints, UNIQUE constraints, foreign keys
    - `generate_unique_short_code(len)` helper function
  - `.env.example` listing all required environment variables.
  - Design tokens configured in `src/app/globals.css` (Tailwind v4 with CSS variables, primary = teal-600 #0d9488, dark mode palette included).
  - Graceful "Supabase not configured" screen with setup instructions when env vars are missing.
  - Verified: `npm run build` succeeds, `npm run lint` is clean, dev server returns 200 on all routes without Supabase configured.

## Decisions made

- **Next.js 16 / Tailwind v4:** Scaffolded with latest stable create-next-app. Uses Turbopack for dev and build.
- **Tailwind v4 @plugin syntax:** Uses `@plugin "tailwindcss-animate"` (Tailwind v4 no longer supports `@import` of postcss plugins).
- **shadcn/ui components hand-authored:** Rather than running the shadcn CLI (which targets Tailwind v3), I created the standard shadcn/ui components directly with Tailwind v4-compatible CSS variable design tokens. This keeps everything consistent.
- **Env-var guard:** Rather than crashing when Supabase is not configured (common in early local dev), middleware + layout show an amber "Setup required" banner / setup card. This makes the app immediately runnable after `npm install && npm run dev`.
- **Marketing landing page:** A simple hero + 3-step how-it-works placeholder is included at `/` so the app has a working home page (full landing page will be built in Phase 8).
- **Billing provider:** Still deferred (Polar vs Lemon Squeezy). Placeholder webhook route is in place.
- **Middleware deprecation:** Next.js 16 renamed "middleware" to "proxy"; the codemod can be run later. Current middleware.ts still works but emits a warning.

## Next up

**Phase 2: Business setup (Onboarding + Settings)**
- 3-step onboarding wizard at `/app/onboarding` (business info → Google review link validation → default template preview + test send)
- Auto-create default message templates when a business is created
- Settings page (edit business info, Google review link, reply-to email)
- Google review link validation (accept `g.page`, `google.com/maps`, `search.google.com/local/writereview`, `maps.app.goo.gl`)

## Open questions

- Billing provider preference (Polar vs Lemon Squeezy) — does not block until Phase 7.
- Logo/branding assets — using a simple mail/chart icon mark for now.
- Supabase project region/credentials — not yet provisioned; needed to fully test auth + database flows.
- Resend account/domain — needed for Phase 4 (sending).
- Resend domain for sender address (e.g. `reviews@yourdomain.com`) — requires DNS setup.
