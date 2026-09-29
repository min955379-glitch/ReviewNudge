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

> **Status: Phase 1 (Foundation) complete.**

- Next.js 16 App Router app with TypeScript + Tailwind CSS v4
- Supabase auth wired up (email/password + Google OAuth ready)
- Route protection via middleware
- Responsive app shell with sidebar navigation
- Login, signup, forgot-password pages
- Dashboard with stat card placeholders
- Database migration for all tables with RLS
- Placeholder pages for all planned routes
- Full build and lint pass; dev server runs out of the box

**Not yet implemented:** onboarding/business setup, customer management, email sending, tracking, reminders, billing, final landing page.

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

- **Phase:** 1 (Foundation) — Complete
- **Next phase:** Phase 2 — Business setup (onboarding wizard + settings page)
- App compiles, runs, and passes lint/build. Auth and database are wired up but require Supabase credentials to use end-to-end.

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
