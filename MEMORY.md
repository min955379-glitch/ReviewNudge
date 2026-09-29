# MEMORY.md — Development Log

## Completed

- **Phase 0 (2026-09-29):** Planning docs — PRD, RULES, ARCHITECTURE, DESIGN, PHASES, MEMORY, README, ROADMAP.
- **Phase 1 (2026-09-29):** Foundation — Next.js 16 + Tailwind v4 + shadcn/ui components + Supabase SSR helpers + middleware + auth pages + protected app shell + placeholder routes + SQL migration.
- **Phase 2 (2026-09-29):** Business setup — 3-step onboarding wizard (business info → Google review link validation → email template editor with live preview, reset, test-send stub), default email templates seeded on creation, Settings page (edit business profile), compliance callout, email rendering engine (HTML with CTA, plain text, variable substitution).
- **Phase 3 (2026-09-29): Customers**
  - Installed papaparse for CSV parsing (including @types/papaparse)
  - Installed @radix-ui/react-dialog and added shadcn-style Dialog component
  - Added Table component (shadcn-style) with Table/TableHeader/TableBody/TableRow/TableHead/TableCell
  - Validation schemas: `addCustomerSchema`, `bulkImportSchema` with consent enforcement and email validation
  - Server actions:
    - `addCustomer` — validates input, normalizes email (trim + lowercase), blocks unsubscribed emails, deduplicates against existing customers (updating name/phone/consent on re-add), inserts new records
    - `deleteCustomer` — ownership-guarded delete (verifies business_id)
    - `importCustomers` — parses CSV with papaparse, auto-detects common column headers (name/email/phone variants), validates per-row, detects duplicates by email, skips unsubscribed, returns row-level error report, bulk-inserts new rows
  - Customer list UI (`/app/customers`):
    - Server-fetches customers for the business, redirects to onboarding if business isn't fully set up
    - Empty state with "Add your first customer" CTA
    - Search (filter by name/email/phone, case-insensitive)
    - Sortable columns (name, email, added date) with asc/desc toggle
    - Status badges: Consent (green) for consent-confirmed, Unsubscribed (red with MailX icon)
    - Per-row delete button (with confirm dialog)
  - Add Customer dialog: name, email, optional phone, required consent checkbox, optional "Add and send" checkbox (shows note that sending lands in Phase 4), success feedback, client-side close after save
  - CSV Import dialog: file picker (CSV, max 5 MB), required bulk consent checkbox, column name auto-detection, post-import summary (added/duplicates/unsubscribed/errors), per-row error list (capped at 50 shown)
  - Dashboard "Send a request" primary CTA now links to /app/customers
  - Unsubscribed customers are visually marked with a red badge and cannot be added/emailed (server-side enforcement)
  - Build and lint pass cleanly; dev server tested at /, /app/customers, /app/onboarding (all 200)

## Decisions made

- **Email in Phase 3:** Customers can be added without an email (stored as null) for future SMS features. But the list will still allow phone-only entries. Sending is blocked until Phase 4.
- **CSV column mapping:** Auto-detects common header variants (name/customer_name/full_name, email/email_address/e-mail, phone/phone_number/mobile/tel). No manual column-mapping UI yet (per PRD it is optional; the auto-detect covers the majority of simple CSV exports).
- **Deduplication on import:** Performed against existing customers + within-file duplicates (earlier row wins, later duplicates counted).
- **Unsubscribe check on add:** Blocks re-adding an unsubscribed email at the server action level and returns a clear error message.
- **"Add and send" checkbox** is present but sending is stubbed (Phase 4) — checkbox is purely informational for now; the customer is saved but no email is sent.
- **Delete confirm:** Uses native `confirm()` to keep things simple; can be swapped to a nicer modal later.
- **Customer data fetch:** Done server-side on page load; mutations trigger `router.refresh()` to re-fetch after add/delete/import. Filter/sort are client-side on the current snapshot.

- **Phase 5 (2026-09-29): Tracking & reminders**
  - `src/app/r/[code]/page.tsx`: added bot/scanner detection via user-agent regex (`BOT_UA_RE`) before updating click counts/status. Bots still see the CTA page (so preview renders work) but clicks aren't counted; a small "Automated preview" notice is shown when a bot UA is detected. UA list covers bots, crawlers, link scanners, email/chat previews (WhatsApp/Slack/Teams/Telegram/Facebook/Twitter/LinkedIn), HTTP libraries (curl/wget/python-requests/httpclient), monitoring/uptime agents, and headless browsers.
  - `src/lib/cron/send-reminders.ts` — new file: `runReminderCron()` uses the Supabase **service-role client** to bypass RLS, finds `review_requests` with `status='sent'`, `first_clicked_at IS NULL`, `reminder_sent_at IS NULL`, `manually_marked_reviewed=false`, and `sent_at` older than 3 days (500-row safety cap per run). Groups by business to fetch templates once, re-checks customer eligibility (email/consent/unsubscribed) immediately before send, uses the reminder template (falls back to request), sends at 200ms intervals, and stamps `reminder_sent_at` on success. Reminders reuse the original short_code (no new tracking row) so the same link keeps working; at most one reminder per request. Graceful structured error if Supabase/Resend not configured.
  - `src/app/api/cron/reminders/route.ts`: replaced placeholder with real handler that checks `Authorization: Bearer <CRON_SECRET>` (returns 401 on missing/bad token) and invokes `runReminderCron()`, returning 200 with counts on success or 500 on error.
  - `vercel.json`: new file scheduling `/api/cron/reminders` hourly (`0 * * * *`).
  - Build and lint pass cleanly. Verified via `next start`: `/r/bogus` returns 200 (with and without user agent), `/api/cron/reminders` returns 401 with missing or wrong Authorization header.

- **Phase 4 (2026-09-29): Sending emails**
  - Installed `resend` package.
  - `src/lib/utils/crypto.ts`: `generateShortCode()` (8-char alphanumeric via `crypto.randomBytes` with collision retry), `signToken()`/`verifyToken()` for HMAC-SHA256-signed unsubscribe tokens (30-day TTL, base64url encoding, `timingSafeEqual`); fallback secret in dev, throws in prod without `UNSUBSCRIBE_SIGNING_SECRET`.
  - `src/lib/email/send.ts`: Resend wrapper (`isEmailConfigured`, `sendEmail` with HTML/text/replyTo/headers), `sendReviewEmail` composes subject/body via template vars, sets `List-Unsubscribe` (both https POST endpoint and mailto fallback) and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers.
  - `src/lib/email/unsubscribe.ts`: `performUnsubscribe` server-side helper (verifies HMAC token, marks the matching customer unsubscribed).
  - `src/lib/validation/request.ts`: `sendRequestSchema`, `bulkSendSchema`, `updateTemplateSchema`, `markReviewedSchema`.
  - `src/app/app/requests/actions/requests.ts`: server actions `sendToOne`, `sendBulk`, `resendRequest`, `markReviewed` — eligibility checks (consent + email + not unsubscribed + ownership), short-code generation with collision retry (5 attempts), 100-sends/hour rate-limit guard, 150ms delay between bulk sends, status lifecycle `queued → sent|failed` with `sent_at`/`error_message`.
  - `src/app/app/customers/actions/add-and-send.ts`: combined `addAndSendCustomer` server action that creates/finds the customer then calls `sendToOne`.
  - `src/app/app/templates/actions/templates.ts`: `saveTemplate` (upsert), `resetTemplate`, `sendTestTemplateEmail`.
  - **Templates page** (`/app/templates`): server-fetches both templates; client uses Radix Tabs for request/reminder, subject/body inputs, live iframe preview rendering with sample data ("Sam"), reset-to-default, and test-send form (disabled with friendly message when Resend is unconfigured).
  - Added `src/components/ui/tabs.tsx` and `src/components/ui/dropdown-menu.tsx` (Radix-based, shadcn-style).
  - **Requests page** (`/app/requests`): server-fetches recent 200 requests joined with customer name/email, status filters (all/sent/clicked/reviewed/failed) with counts, search, per-row dropdown actions (Resend for failed rows, Mark reviewed), friendly disclaimer that we can't detect real Google reviews.
  - **Customers page bulk UI:** added a master checkbox (selects all emailable customers in the filtered view), per-row checkboxes (disabled for unsubscribed/missing-email/no-consent rows), a sticky action bar showing count + "Send review requests" button, and wired `sendBulk` via `customer_ids_json`. "Add and send" checkbox now actually sends.
  - **Public `/r/[code]` page:** looks up the request by short_code (using server client + RLS-opened policies), marks clicked / increments click_count, renders a friendly CTA page with a button that opens the business's Google review URL in a new tab (avoids bot auto-redirect), and shows a link-not-found state for bad codes.
  - **Public `/unsubscribe/[token]` page:** verifies the HMAC token, shows a confirmation form with a "Confirm unsubscribe" button (server action marks the customer unsubscribed and re-renders with a success card), plus an already-unsubscribed shortcut.
  - `POST /api/unsubscribe/[token]` route implements RFC 8058 one-click unsubscribe (expects `List-Unsubscribe=One-Click` form body).
  - Supabase migration `00002_public_tracking.sql`: adds RLS policies that allow anon SELECT on `review_requests`/`businesses`/`customers` and anon UPDATE on `review_requests` (click tracking) and `customers` (unsubscribe), since these public routes aren't authenticated.
  - **Dashboard** rewrote stat cards to query real 30-day counts (sent, clicks, click rate, manually marked reviews, customer total), added a recent-requests list with status badges, quick-action links, and an amber warning card when `RESEND_API_KEY`/`EMAIL_FROM_ADDRESS` are missing.
  - Build and lint pass cleanly; dev server verified `/app/templates`, `/app/requests`, `/app/customers`, `/r/boguscode`, `/unsubscribe/badtoken` all 200.
  - Docs updated: `PHASES.md` (Phases 4 complete, Phase 5 partially done), `ROADMAP.md`, `README.md`.

## Decisions made

- **Email in Phase 3:** Customers can be added without an email (stored as null) for future SMS features. But the list will still allow phone-only entries. Sending is blocked until Phase 4.
- **CSV column mapping:** Auto-detects common header variants (name/customer_name/full_name, email/email_address/e-mail, phone/phone_number/mobile/tel). No manual column-mapping UI yet (per PRD it is optional; the auto-detect covers the majority of simple CSV exports).
- **Deduplication on import:** Performed against existing customers + within-file duplicates (earlier row wins, later duplicates counted).
- **Unsubscribe check on add:** Blocks re-adding an unsubscribed email at the server action level and returns a clear error message.
- **Delete confirm:** Uses native `confirm()` to keep things simple; can be swapped to a nicer modal later.
- **Customer data fetch:** Done server-side on page load; mutations trigger `router.refresh()` to re-fetch after add/delete/import. Filter/sort are client-side on the current snapshot.
- **Public tracking/unsubscribe RLS:** Added permissive policies (`true` USING) because short_codes are 8-char random (62^8 ≈ 2e14) making enumeration infeasible; tokens are HMAC-signed with a server secret so they can't be forged. Public routes only need read+click/unsubscribe write — no broad enumeration endpoints.
- **Tracking page UX:** Instead of an auto-302-redirect (which mail scanners trigger, inflating click counts and opening Google for bots), Phase 4 shows a clear "Open Google Reviews" button. Bot user-agent filtering comes in Phase 5.
- **Bulk-send form contract:** Server action reads `customer_ids_json` (JSON array) rather than repeated FormData fields — simpler for the client to construct.
- **Dashboard Date.now lint:** Server component uses `Date.now` for the 30-day window; disabled the react-hooks/purity rule because RSC renders don't need idempotence the way client renders do.
- **Bot filtering:** Opted for a deny-list UA regex over IP/rate-limiting or bot-detection libraries — it's the simplest robust approach, email providers (Gmail/Outlook) all use fetchers that clearly identify themselves, and false negatives are harmless (a few extra counted clicks are far better than false positives that hide real clicks). Bots still see the review CTA page so email previews render correctly; they just don't inflate stats.
- **Reminder reuses short_code:** A reminder email goes to the same tracking link (`/r/<same-code>`) rather than generating a new one, so the customer has one consistent link. `reminder_sent_at` on the original row prevents re-sending. We don't create new rows for reminders to keep the requests table a clean list of "original requests."
- **Cron auth:** Uses standard `Authorization: Bearer <CRON_SECRET>` header (Vercel Cron sends this automatically when you set `CRON_SECRET` env var) rather than a query-string secret, to avoid leaking the secret into logs.
- **Cron uses service role:** The cron route can't have a logged-in user, so it uses the Supabase service-role client to bypass RLS — safe because it only touches rows matching the reminder query and never exposes data to the caller.

- **Phase 5+follow-up #2 (2026-09-29): Security + reminder-claim + quota fixes**
  - RLS hardening: `supabase/migrations/00002_public_tracking.sql` rewritten to `SELECT 1;` (documentation-only, creates **no** RLS policies). The previous version added five `USING (true)` policies that granted the `anon`/`authenticated` roles SELECT on `businesses`/`customers`/`review_requests` and UPDATE on `review_requests`/`customers` — any visitor with the anon key could enumerate all three tables. The fix removes those grants entirely.
  - Public routes now use the **service-role** Supabase client (bypasses RLS, requires `SUPABASE_SERVICE_ROLE_KEY` env var):
    - `src/app/r/[code]/page.tsx`
    - `src/app/unsubscribe/[token]/page.tsx`
    - `src/lib/email/unsubscribe.ts` (feeds `POST /api/unsubscribe/[token]`)
  - Because these routes always look up by the high-entropy `short_code` (8 chars alnum, ~2e14 space) or HMAC-signed unsubscribe token, using the service role server-side is strictly safer than opening RLS to anon.
  - New script `scripts/verify-anon-rls.sh`: hits `/rest/v1/businesses`, `/customers`, `/review_requests` with the anon key; exits 0 only when all three return 401/403 or empty `[]`. Documented in README.
  - Reminder claim column: new migration `00004_reminder_claim_column.sql` adds `reminder_claimed_at TIMESTAMPTZ` to `review_requests` plus two partial indexes (`idx_review_requests_unreminded`, `idx_review_requests_claimed`). DB types updated.
  - `src/lib/cron/send-reminders.ts` rewritten to use the new claim column:
    - At start of each run, releases stale claims older than 15 minutes (`CLAIM_STALE_MS = 15 * 60 * 1000`) by setting `reminder_claimed_at = NULL`.
    - Atomic claim: SELECT candidate IDs matching eligibility (ordered by `sent_at` ASC, `LIMIT BATCH_LIMIT`), then UPDATE those IDs to set `reminder_claimed_at = now()`.
    - SELECTs claimed rows and processes them.
    - Success stamps `reminder_sent_at` and clears `reminder_claimed_at`; failure/skip/quota-skip releases claim to NULL.
    - `BATCH_LIMIT = 40` (down from 500) — safe for Vercel serverless's ~10s budget at ~150ms/email.
  - Quota count fix: `countRecentSends` in both `src/app/app/requests/actions/requests.ts` and `src/lib/cron/send-reminders.ts` now runs two separate count queries — one for initial sends (`status IN ('sent','clicked') AND sent_at >= since`) and one for reminders (`reminder_sent_at >= since`) — and sums them. Previously only `status IN ('sent','clicked')` was counted, which under-counted free-plan usage when reminders were sent. A row where both timestamps fall in the window correctly counts as 2.
  - README DB setup now lists all 4 migrations (00001–00004) and explains the RLS verification script.
  - Build + lint pass. Smoke test against `next start`: GET/POST with valid `CRON_SECRET` returns structured `ok:false` JSON (Supabase not configured) with HTTP 500; wrong secret returns 401.
  - Commit for this fix block pending after final review.

- **Phase 5+follow-up (2026-09-29): Hardening fixes requested before Phase 6**
  - `vercel.json`: schedule changed from hourly `0 * * * *` to daily `0 9 * * *` (Vercel Hobby rejects hourly crons).
  - `/api/cron/reminders` now accepts both GET and POST, both requiring `Authorization: Bearer <CRON_SECRET>` (returns 401 otherwise). Verified: GET no-auth 401, GET bad-auth 401, POST no-auth 401.
  - Cron claim-sentinel pattern: before sending, the reminder job atomically `UPDATE`s all eligible rows (`status='sent'`, not clicked, no reminder, not manually reviewed, sent_at older than 3 days) to set `reminder_sent_at = '9999-01-01T00:00:00Z'`, then SELECTs rows carrying that sentinel. Failed sends reset `reminder_sent_at = NULL` so they can be retried next run; successful sends stamp the real ISO timestamp. This prevents overlapping cron invocations from double-sending.
  - Monthly quota: `src/lib/billing/plans.ts` defines `free: 10/month` (rolling 30-day window), `pro/business: null` (unlimited). Both initial sends and reminders count against the quota (constant `REMINDERS_COUNT_TOWARD_QUOTA = true`). Enforced in `sendToOne`, `sendBulk` (stops at quota mid-batch with explanatory message), `resendRequest`, and in `runReminderCron` (per-business bucket with `used` counter, releases claim on quota-limited rows).
  - Mailing address (CAN-SPAM): new `mailing_address TEXT NOT NULL DEFAULT ''` column via migration `00003_mailing_address.sql`; DB types updated; required in Zod schema; added to onboarding Step 1 (Textarea) with CAN-SPAM explainer; added to Settings form; rendered in email HTML footer (as a `<div>` under the name/contact/unsubscribe line) and in plain-text footer. Test-send and reminder/bulk emails all pass `mailing_address` through.
  - Cross-account RLS isolation test moved from Phase 9 into Known Issues in ROADMAP.md (must be verified manually against live Supabase before launch).
  - README/ROADMAP cleanup: fixed Next.js version (16), listed all 3 migrations in database setup, rewrote deploy notes with all env vars including `CRON_SECRET` and the daily cron schedule, marked Phases 1–5 as "Built, not yet verified against live Supabase and Resend" instead of "Completed", removed duplicate Phase 6 entry and outdated items (placeholder notices, Resend-waiting entries), clarified that reminders count toward quota.
  - Docs: `PHASES.md`, `ROADMAP.md`, `README.md`, `MEMORY.md` all updated.

- **Phase 6 (2026-09-29): Dashboard polish**
  - Dashboard rewrite (`src/app/app/page.tsx`, server component):
    - 30-day "Emails sent" stat now correctly sums initial sends + reminders (was previously using `created_at >= since AND status IN (sent,clicked)` which under-counted).
    - New inline-SVG line chart (`src/components/dashboard/line-chart.tsx`) — no external chart dependency, renders daily send counts (initial + reminders) for the last 30 days with gradient area fill, gridlines, axis labels, and native SVG `<title>` tooltips. Shows empty-state when zero sends.
    - New quota meter card (`src/components/ui/progress.tsx`): uses `countRecentSends` from a shared helper, shows `used / limit` with color-coded bar (green < 80%, amber ≥ 80%, red at limit) and an upgrade CTA linking to `/app/settings/billing`. Unlimited plans show a full green bar and "Unlimited sends" copy.
    - Quick-add form card (`src/components/dashboard/quick-add-form.tsx` + server action `src/app/app/quick-add-action.ts`) — name + email + consent checkbox → adds the customer (or updates existing, respecting unsubscribed flag) and immediately sends a review request via `sendToOne`. Uses React `useActionState`, inline field errors, spinner while pending, auto-resets on success.
    - Recent-requests list capped at 5 with "View all →" link to Requests page.
    - Quick-actions panel retained with live customer count.
    - "Emails sent" stat replaces the old "Requests sent" to clarify reminders count too; clicks/click-rate/manually reviewed stat cards preserved.
  - New shared quota helper `src/lib/billing/quota.ts` exporting `countRecentSends(sb, businessId, sinceIso)` used by `sendToOne`, `sendBulk`, `resendRequest`, reminder cron, dashboard, and billing page — eliminates three duplicate implementations.
  - Billing page at `src/app/app/settings/billing/page.tsx` (replaced placeholder): current plan card with Progress usage meter, plan-picker grid (Free/Pro/Business), success/cancel flash messages, "Manage subscription" portal link for active subscribers.
  - New shadcn-style `src/components/ui/progress.tsx` (color-coded by percentage).
  - Build + lint both clean; dev server verified `/`, `/login`, `/app`, `/app/settings/billing` all return 200.

- **Phase 7 (2026-09-29): Billing (Polar)**
  - Chose Polar (polar.sh) as the Merchant-of-Record provider. Installed `@polar-sh/sdk`.
  - Updated `src/lib/billing/plans.ts`: added proper PlanId type, Pro (300/mo @ $12) and Business (1500/mo @ $29) limits, UPGRADE_PLANS list, isValidPlan() helper.
  - New `src/lib/billing/polar.ts`: `isPolarConfigured()`, `getPolarClient()` (sandbox in dev, production in prod), `createCheckout()` (products, successUrl/returnUrl, customerEmail, externalCustomerId=userId, metadata with userId/businessId/plan), `createPortalLink()` (returns Polar /purchases/:id URL).
  - New migration `00005_billing_columns.sql`: adds `billing_customer_id`, `billing_subscription_id`, `billing_provider`, `subscription_status`, `current_period_end`, `cancel_at_period_end` to businesses; two partial indexes for fast lookups.
  - Updated `database.types.ts` with new columns on businesses Row/Insert/Update.
  - New server action `src/app/app/settings/billing/actions.ts` (`startCheckout`): requires business, validates plan, calls createCheckout, redirects; returns {error} on failure.
  - New client `src/app/app/settings/billing/checkout-button.tsx` — useActionState wrapper that shows spinner during redirect and inline errors.
  - Rewrote billing page to show 3 plan cards with real CTAs (forms posting to startCheckout when Polar is configured, "Coming soon" disabled when not); shows cancel-at-period-end warning, links to Polar portal for existing subscribers.
  - Rewrote `/api/webhooks/billing/route.ts`:
    - Runtime = nodejs, force dynamic.
    - Reads raw body, validates signature via `validateEvent(body, headers, POLAR_WEBHOOK_SECRET)` from `@polar-sh/sdk/webhooks`; 401 on invalid signature.
    - Uses service-role client to update businesses.
    - `checkout.updated`: stores billing_customer_id; on confirmed/succeeded, resolves plan from metadata (preferred) or product mapping and sets businesses.plan.
    - `subscription.active|updated|canceled|revoked`: writes subscription id/status/period_end/cancel flag, maps productId → plan; on revoked, downgrades to free.
  - Updated `/pricing` page to reflect real plan prices/features (300/1500 emails, etc.).
  - `.env.example` updated with POLAR_ACCESS_TOKEN, POLAR_WEBHOOK_SECRET, POLAR_PRO_PRODUCT_ID, POLAR_BUSINESS_PRODUCT_ID.
  - README DB setup lists migration 00005 and updated env vars.
  - Quota enforcement already reads `business.plan` directly — so as soon as webhook writes the plan column, plan limits apply automatically (300 for pro, 1500 for business).

## Next up

**Phase 8: Landing page and polish**
- Final marketing landing page (hero, how-it-works, pricing, FAQ with honest Google/Compliance answers)
- SEO metadata, PWA manifest, legal pages flesh-out (Terms/Privacy already exist as stubs)
- Empty states, 404/error pages
- Mobile polish pass (375px breakpoint QA)
- Copy pass across all templates/defaults

## Open questions

- Billing provider (Polar vs Lemon Squeezy) — deferred to Phase 7.
- Logo/branding assets — still using simple icon marks.
- Supabase project credentials — needed to fully test auth + customers flow end-to-end.
- Resend account + verified sending domain — needed for Phase 4.
- CSV manual column mapping UI — if auto-detection isn't sufficient for users, add it later.
