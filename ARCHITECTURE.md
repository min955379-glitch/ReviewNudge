# ARCHITECTURE.md — Tech Stack, Data Model, Routes, Structure

## 1. Technology Stack

- **Framework:** Next.js 14+ (App Router), TypeScript, React Server Components where sensible
- **Styling:** Tailwind CSS + shadcn/ui components
- **Database/Auth:** Supabase (Postgres, Auth with email + password and Google sign-in, Row Level Security)
- **Email:** Resend (transactional email). Abstract behind a `sendEmail()` function so SMS can be added later.
- **Validation:** Zod
- **Forms:** React Hook Form
- **Background jobs:** Vercel Cron (or Supabase scheduled function) hitting a protected route for reminders
- **Billing:** Polar or Lemon Squeezy (merchant of record, works for sellers in Pakistan). Abstract behind a `billing` module. Stripe is NOT an option.
- **CSV import:** Papaparse
- **Hosting:** Vercel
- **Analytics:** Vercel Analytics (optional)

---

## 2. Data Model (Supabase / Postgres)

```sql
-- businesses (one per owner for MVP)
create table businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  google_review_url text not null,
  reply_to_email text,
  contact_line text,              -- shown in email footer (address or phone)
  timezone text default 'Europe/London',
  plan text not null default 'free',   -- free | pro | business
  created_at timestamptz default now()
);

-- customers
create table customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text not null,
  email text,
  phone text,                     -- stored for future SMS, unused in MVP
  consent_confirmed boolean not null default false,
  unsubscribed boolean not null default false,
  created_at timestamptz default now(),
  unique (business_id, email)
);

-- review_requests
create table review_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  short_code text not null unique,      -- e.g. 8 char random, used in /r/[code]
  status text not null default 'queued', -- queued | sent | failed | clicked
  sent_at timestamptz,
  first_clicked_at timestamptz,
  click_count int not null default 0,
  reminder_sent_at timestamptz,
  manually_marked_reviewed boolean not null default false,
  error_message text,
  created_at timestamptz default now()
);

-- message_templates
create table message_templates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  kind text not null,             -- request | reminder
  subject text not null,
  body text not null,             -- supports {{customer_name}}, {{business_name}}, {{review_link}}
  unique (business_id, kind)
);

-- unsubscribes (global per email per business)
create table unsubscribes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  email text not null,
  created_at timestamptz default now(),
  unique (business_id, email)
);

-- click_events (simple log)
create table click_events (
  id uuid primary key default gen_random_uuid(),
  review_request_id uuid not null references review_requests(id) on delete cascade,
  clicked_at timestamptz default now(),
  user_agent text
);
```

**Also required:**
- RLS policies: `businesses.owner_id = auth.uid()` and every child table checks ownership through `business_id`.
- Indexes on `review_requests(business_id, created_at)`, `review_requests(short_code)`, `customers(business_id)`.
- The public `/r/[code]` route must use a **server-side service role** call (never expose the service key to the client) to look up the code, log the click and redirect.

---

## 3. Pages and Routes

### Public (marketing + auth + tracking)
- `/` Landing page
- `/pricing` Pricing (can be a section on `/`)
- `/login`, `/signup`, `/forgot-password`
- `/r/[code]` Tracking redirect: logs click, updates status, then 302 redirects to the business's `google_review_url`. If code is invalid, show a friendly fallback page.
- `/unsubscribe/[token]` Unsubscribe confirmation page (signed token, one click)
- `/privacy`, `/terms`

### App (auth required)
- `/app` Dashboard: stats + recent requests
- `/app/customers` Customer list, add customer, CSV import
- `/app/requests` All requests with status filters
- `/app/templates` Edit email templates and preview
- `/app/settings` Business profile, Google review link, billing, account
- `/app/onboarding` First-run wizard (3 steps)

### API / server actions
- `POST` send request (single and bulk, server actions)
- `POST /api/cron/reminders` protected by `CRON_SECRET` header
- `POST /api/webhooks/billing` billing provider webhook (verify signature)
- `POST /api/webhooks/resend` (optional) delivery/bounce events

---

## 4. Folder Structure

```
/app
  /(marketing)        landing, pricing, privacy, terms
  /(auth)             login, signup, forgot-password
  /app                dashboard, customers, requests, templates, settings, onboarding
  /r/[code]           tracking redirect
  /unsubscribe/[token]
  /api                cron, webhooks
/components           ui, forms, tables, charts
/lib
  supabase/           server + client helpers
  email/              sendEmail(), templates renderer
  billing/            provider abstraction, plan config
  validation/         zod schemas
  utils/
/supabase/migrations  SQL files
```

---

## 5. Environment Variables

`.env.example`:

```
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
EMAIL_FROM_ADDRESS=
CRON_SECRET=
UNSUBSCRIBE_SIGNING_SECRET=
BILLING_PROVIDER=            # polar | lemonsqueezy
BILLING_API_KEY=
BILLING_WEBHOOK_SECRET=
BILLING_PRO_PRODUCT_ID=
BILLING_BUSINESS_PRODUCT_ID=
```
