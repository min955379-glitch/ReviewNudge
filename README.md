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

> **Status: Phase 5 (Tracking and reminders) complete.**

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
- **Automatic 3-day reminders**: `POST /api/cron/reminders` (protected by `CRON_SECRET`), scheduled hourly via `vercel.json`, finds sent/unclicked/unreminded requests older than 3 days, sends the reminder template, stamps `reminder_sent_at` so only one reminder is ever sent; re-checks consent/unsubscribed right before send; throttles at 200ms between emails.
- Server-side enforcement: ownership checks, RLS, unsubscribed blocking, duplicate detection, Zod validation on all inputs
- Database migrations `00001_initial_schema.sql` + `00002_public_tracking.sql` with RLS policies for public click/unsubscribe endpoints
- Vercel cron config at `vercel.json` (hourly schedule)
- Full build and lint pass; dev server runs out of the box; routes return 200; cron returns 401 without auth

**Not yet implemented:** billing, final marketing landing page, 30-day chart on dashboard.

## Technology stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14+ (App Router), TypeScript |
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
BILLING_PROVIDER=            # polar | lemonsqueezy
BILLING_API_KEY=
BILLING_WEBHOOK_SECRET=
BILLING_PRO_PRODUCT_ID=
BILLING_BUSINESS_PRODUCT_ID=
```

If `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are not set, the app still runs but shows a "Setup required" banner with instructions.

### Database setup
1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. In the SQL Editor, run the migration at `supabase/migrations/00001_initial_schema.sql`.
3. Under Authentication → Providers, enable Email and (optionally) Google.
4. Add your site URL (`http://localhost:3000`) to Authentication → URL Configuration → Redirect URLs, along with `http://localhost:3000/auth/callback`.

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

> Coming after Phase 1. Deployment target: Vercel.

Email deliverability requires domain verification with Resend (SPF, DKIM, DMARC records in DNS) — full instructions will be provided here.

## Current development status

- **Phase:** 5 (Tracking and reminders) — Complete
- **Next phase:** Phase 6 — Dashboard polish (30-day chart, quicker send flow)
- App compiles, runs, and passes lint/build. Auth, onboarding, settings, customers, templates, requests, sending, tracking, click filtering, unsubscribe, and the hourly reminder cron are all built. End-to-end email delivery requires a Resend API key + verified sending domain; live cron execution requires deploying to Vercel with `CRON_SECRET` set; end-to-end DB flows require Supabase credentials with both migrations applied.

## Important limitations

- This is pre-release software under active development.
- No AI or LLM APIs are used or will be used (per product policy).
- Review gating (asking "how was your experience?" first and routing unhappy customers elsewhere) is intentionally not supported — it violates Google policy.
- The app cannot detect whether a customer actually posted a review (Google does not expose this). It only tracks link clicks.
- SMS sending is out of scope for MVP.
- Multi-location businesses and team/role support are out of scope for MVP.

## Important compliance notes

- Every email includes the business name, a contact line, and a one-click unsubscribe link.
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
