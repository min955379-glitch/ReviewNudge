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

## Next up

**Phase 4: Sending emails**
- Wire up Resend in `sendEmail()` (API call, HTML + plain text)
- Build Templates page at `/app/templates` for editing both request + reminder templates with live preview + reset
- Short code generation (8-char crypto-random, stored on review_requests)
- Single and bulk send server actions
- Build Requests page with table (status, clicks, reminders) and filters
- Signed one-click unsubscribe links (with crypto signing secret)
- List-Unsubscribe header on every email

## Open questions

- Billing provider (Polar vs Lemon Squeezy) — deferred to Phase 7.
- Logo/branding assets — still using simple icon marks.
- Supabase project credentials — needed to fully test auth + customers flow end-to-end.
- Resend account + verified sending domain — needed for Phase 4.
- CSV manual column mapping UI — if auto-detection isn't sufficient for users, add it later.
