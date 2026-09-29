# ReviewNudge

> Send review requests in 10 seconds. Get more Google reviews.

## What is ReviewNudge?

ReviewNudge is a simple web app that helps local businesses (gyms, salons, dentists, garages, restaurants, tradespeople) collect more Google reviews. Business owners add a customer, and the app sends a friendly email with a unique tracking link asking for a review. ReviewNudge logs link clicks and sends one automatic reminder if the customer hasn't clicked.

## What problem does it solve?

Local businesses live or die by their Google reviews, but asking every customer to leave a review is tedious and easy to forget. ReviewNudge makes it a 10-second action — type a name and email, hit send, and the app handles delivery, tracking, and one reminder. No complicated CRM, no review gating, no fake reviews — just a friendly, compliant nudge.

## Main features

- **One-click send** — Add a customer and send a review request in seconds
- **Unique tracking links** — See who clicked your review link (privacy-safe)
- **Automatic reminder** — One friendly reminder after 3 days if no click
- **Email templates** — Customizable subject and body with live preview
- **CSV import** — Bulk import customers from a spreadsheet
- **Google-validated review links** — Checks that your review URL is a valid Google link
- **Compliant by design** — Unsubscribe links, consent checkbox, no review gating, no incentives
- **Dashboard & analytics** — Send stats, click rates, recent activity
- **Plans & billing** — Free tier for getting started, paid tiers for higher volume

## Current functionality

> **Status: Phases 1–5 built, not yet verified against live Supabase and Resend.**

- Next.js 16 App Router app with TypeScript + Tailwind CSS v4
- Supabase auth wired up (email/password + Google OAuth ready)
- Route protection via middleware
- Responsive app shell with sidebar navigation (Dashboard, Customers, Requests, Templates, Settings)
- Login, signup, forgot-password pages
- **3-step onboarding wizard:** business info → Google review link (validated) → email template with live preview
- **Settings page:** edit business name, contact line, Google review link, reply-to email
- Default request + reminder templates seeded automatically on business creation
- Email rendering engine (variable substitution, HTML with CTA button, plain-text fallback, footer)
- **Templates page (/app/templates):** tabs for request/reminder, live iframe preview with sample data, reset-to-default, send-test button (warns if Resend not configured)
- Resend integration (`lib/email/send.ts`) with HTML + text, Reply-To, `List-Unsubscribe` + `List-Unsubscribe-Post=One-Click` headers
- HMAC-signed unsubscribe tokens (30-day expiry, timing-safe compare) + one-click `POST /api/unsubscribe/[token]` endpoint
- 8-character crypto-random short codes with collision-retry for tracking links
- **Customers page:** add customer dialog (name/email/phone/consent, "Add and send"), bulk-select checkboxes + sticky send bar, searchable/sortable table, per-row delete, unsubscribed badge, empty state
- **CSV import:** auto column detection (name/email/phone variants), duplicate detection, per-row error report, bulk consent checkbox, 5 MB cap
- **Requests page (/app/requests):** status badges (Queued/Sent/Failed/Link clicked/Reviewed), filters, search, resend for failures, mark-reviewed action
- Single-send server action (`sendToOne`) creates a `review_requests` row, generates a short code, sends the email, records `sent_at`/`error_message`; bulk send (`sendBulk`) with 100/hour rate limit, 150 ms spacing, eligibility checks (consent + email + not unsubscribed)
- **Public tracking page (/r/[code]):** marks click, increments click_count, shows a friendly CTA pointing to the business's Google review URL
- **Public unsubscribe page (/unsubscribe/[token]):** confirms the opt-out and permanently marks the customer unsubscribed
- Dashboard with real 30-day stats (sent count, click rate, clicks, manually marked reviews), recent activity, and a banner warning when Resend env vars aren't configured
- **Bot/scanner filtering** on `/r/[code]`: a UA regex ignores known bots, crawlers, email link previews (WhatsApp/Slack/Teams etc.), HTTP libraries (curl/wget), and monitoring agents — they see the page but don't inflate click counts.
- **Automatic 3-day reminders**: `POST /api/cron/reminders` (protected by `CRON_SECRET`), scheduled daily at 09:00 UTC via `vercel.json` (works on Vercel Hobby, which rejects hourly crons), finds sent/unclicked/unreminded requests older than 3 days, sends the reminder template, stamps `reminder_sent_at` so only one reminder is ever sent; re-checks consent/unsubscribed right before send; throttles at 200ms between emails.
- Server-side enforcement: ownership checks, RLS, unsubscribed blocking, duplicate detection, Zod validation on all inputs
- Database migrations `00001_initial_schema.sql` + `00002_public_tracking.sql` with RLS policies for public click/unsubscribe endpoints
- Vercel cron config at `vercel.json` (daily 09:00 UTC schedule; Vercel Hobby supports only daily cron)
- Full build and lint pass; dev server runs out of the box; routes return 200; cron returns 401 without auth

**Not yet implemented:** billing, final marketing landing page, 30-day chart on dashboard.

## Technology stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database & Auth | Supabase (Postgres, RLS, email + Google sign-in) |
| Email | Resend (transactional) |
| Validation | Zod |
| Forms | React Hook Form |
| Background jobs | Vercel Cron |
| Billing | Polar or Lemon Squeezy (TBD) |
| CSV import | Papaparse |
| Hosting | Vercel |

## Project structure

```
/app                  # Next.js App Router
  /(marketing)/       # Landing, pricing, legal pages
  /(auth)/            # Login, signup, forgot-password
  /app/               # Dashboard, customers, requests, templates, settings, onboarding
  /r/[code]/          # Tracking redirect
  /unsubscribe/[token]/
  /api/               # Cron jobs, webhooks
/components/          # React components (UI, forms, tables, charts)
/lib/
  supabase/           # Supabase server + client helpers
  email/              # sendEmail() and template rendering
  billing/            # Billing provider abstraction
  validation/         # Zod schemas
  utils/              # Shared utilities
/supabase/migrations/ # SQL migrations
```

## Setup and installation

### Prerequisites
- Node.js 18+ (Next.js 16 requires Node 18.18+)
- npm
- A Supabase account (for auth + database)
- A Resend account (for transactional email — needed from Phase 4)
- A Vercel account (for deployment)

### Install
```bash
npm install
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
EMAIL_FROM_ADDRESS="ReviewNudge <reviews@yourdomain.com>"
CRON_SECRET=
UNSUBSCRIBE_SIGNING_SECRET=
# Polar billing (https://polar.sh). Leave unset during local dev to stay on Free-plan cap.
POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
POLAR_PRO_PRODUCT_ID=
POLAR_BUSINESS_PRODUCT_ID=
```

If `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are not set, the app still runs but shows a "Setup required" banner with instructions.

### Database setup
1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. In the SQL Editor, run the migrations in order:
   - `supabase/migrations/00001_initial_schema.sql` — tables, RLS (owner-only policies), short_code helper
   - `supabase/migrations/00002_public_tracking.sql` — no-op, documents that public routes use the service-role client (no anon policies added)
   - `supabase/migrations/00003_mailing_address.sql` — required `mailing_address` column on businesses (CAN-SPAM)
   - `supabase/migrations/00004_reminder_claim_column.sql` — adds `reminder_claimed_at` for safe reminder cron claiming, plus supporting indexes
   - `supabase/migrations/00005_billing_columns.sql` — adds Polar subscription/customer ID columns and period tracking
   - **If any migration fails with "column already exists"** (e.g. you created the project against an earlier alpha build), stop and instead run `supabase/run-all-migrations-safe.sql` followed by `supabase/repair-legacy-schema.sql` — these are idempotent scripts that add only what's missing and reshape old `message_templates`/`click_events` tables to match the current schema without dropping data.
```bash
bash scripts/verify-anon-rls.sh
```
The script exits 0 only when `/rest/v1/businesses`, `/rest/v1/customers`, and `/rest/v1/review_requests` return 401/403 or an empty array for the anon key.

3. Under Authentication → Providers, enable Email and (optionally) Google.
4. Add your site URL (`http://localhost:3000`) to Authentication → URL Configuration → Redirect URLs, along with `http://localhost:3000/auth/callback`.
5. **Cross-tenant isolation test (required before launch):** create two test accounts, run `bash scripts/verify-rls-isolation.sh` to print the SQL template, and execute it in the SQL Editor per the instructions. All negative queries must return 0 rows.

## How to run locally

```bash
npm run dev
```

Open http://localhost:3000.

### Other commands
```bash
npm run build    # Production build
npm run lint     # ESLint
npm run start    # Serve production build
```

## How to build and deploy

Deployment target: **Vercel**.

```bash
npm run build
vercel --prod
```

Required Vercel environment variables (Project → Settings → Environment Variables):

- `NEXT_PUBLIC_APP_URL` — your production URL (e.g. `https://reviewnudge.app`)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`
- `CRON_SECRET` — a long random string (e.g. `openssl rand -hex 32`). The daily cron call passes this as `Authorization: Bearer <CRON_SECRET>`; without it the cron returns 401.
- `UNSUBSCRIBE_SIGNING_SECRET` — a long random string used to sign unsubscribe tokens. Rotating it invalidates existing unsubscribe links.
- **Polar billing (enable to accept paid signups):**
  - `POLAR_ACCESS_TOKEN` — Polar organization access token (use Sandbox for preview deployments, Production for your live site)
  - `POLAR_WEBHOOK_SECRET` — signing secret from the Polar webhook endpoint
  - `POLAR_PRO_PRODUCT_ID`, `POLAR_BUSINESS_PRODUCT_ID` — product IDs for your two paid recurring plans
  - In Polar, create a webhook pointing to `https://<your-domain>/api/webhooks/billing` subscribed to: `checkout.updated`, `subscription.active`, `subscription.updated`, `subscription.canceled`, `subscription.revoked`.

### Security baseline included
- Strict security headers (CSP, HSTS, X-Frame-Options: DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) applied globally via `next.config.ts`.
- Per-IP rate limiting in middleware:
  - Auth endpoints (login/signup/forgot/callback): 20 req/min/IP
  - Click tracking `/r/[code]`: 60 req/min/IP
  - Unsubscribe `/api/unsubscribe/[token]`: 30 req/min/IP
  - Cron `/api/cron/reminders`: 10 req/min/IP (secrets still required)
  - Webhooks `/api/webhooks/billing`: 60 req/min/IP
- Anon role has zero access to `businesses`/`customers`/`review_requests`; public routes use the service-role client with lookup-by-token only.
- All server actions and cron routes are authenticated; the service-role key is never exposed to the client.

### Pre-launch checklist
1. Migrations 00001–00005 applied in order.
2. `bash scripts/verify-anon-rls.sh` exits 0 against your Supabase project.
3. Cross-tenant RLS test (`scripts/verify-rls-isolation.sh`) passes with two test accounts.
4. Resend sending domain verified (SPF/DKIM/DMARC green in Resend dashboard).
5. `CRON_SECRET` set; trigger `/api/cron/reminders` with the secret once to confirm it returns a structured JSON response.
6. Polar webhook delivery confirmed (send a test checkout; verify `businesses.plan` flips to `pro` after checkout.updated fires).
7. Smoke test the unsubscribe link from a real email; confirm the customer's `unsubscribed` flag flips to true.
8. Visit `/pricing`, `/privacy`, `/terms`, `/signup`, `/login`, `/app`, `/r/<bad-code>`, and a nonexistent path to confirm error pages render.

### Email domain verification (required for production)
Email deliverability requires domain verification with Resend — add the SPF, DKIM, and DMARC records Resend provides for your sending domain before going live. Until your domain is verified, Resend only sends to the email address you signed up with, and mail to other addresses will bounce.

## Current development status

- **Phase:** 5 (Tracking + reminders + quota) — code complete, not yet verified end-to-end against live Supabase + Resend
- **Next phase:** Phase 6 — Dashboard polish (30-day chart, quota meter, quicker send flow)
- App compiles, runs, and passes lint/build. Auth, onboarding, settings, customers, templates, requests, sending, tracking, bot filtering, unsubscribe, CAN-SPAM mailing address, monthly free-plan quota (10 emails), and the daily reminder cron are all built. End-to-end email delivery requires a Resend API key + verified sending domain; live cron execution requires deploying to Vercel with `CRON_SECRET` set; end-to-end DB flows require Supabase credentials with all three migrations applied.
- **Reminders count toward the monthly free-plan quota** (every delivered email, initial or reminder, is one send). Upgrade paths and enforcement for Pro/Business land in Phase 7.

## Important limitations

- This is pre-release software under active development.
- No AI or LLM APIs are used or will be used (per product policy).
- Review gating (asking "how was your experience?" first and routing unhappy customers elsewhere) is intentionally not supported — it violates Google policy.
- The app cannot detect whether a customer actually posted a review (Google does not expose this). It only tracks link clicks.
- SMS sending is out of scope for MVP.
- Multi-location businesses and team/role support are out of scope for MVP.

## Important compliance notes

- Every email includes the business name, contact line, physical mailing address (required by CAN-SPAM), and a one-click unsubscribe link (both a web page and an RFC-8058 POST endpoint for `List-Unsubscribe-Post`).
- Unsubscribes are respected permanently per email per business.
- The consent checkbox ("This customer has done business with me and I have permission to contact them") is required before sending.
- No rewards, discounts, or incentives for reviews are offered — this violates Google policy and FTC guidelines.

## Links & references

- [Google's review policy](https://support.google.com/business/answer/3474050)
- [Supabase documentation](https://supabase.com/docs)
- [Resend documentation](https://resend.com/docs)
- [Next.js documentation](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

## License

TBD
