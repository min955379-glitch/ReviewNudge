# MEMORY.md — Development Log

## Completed

- **Phase 0 (2026-09-29):** Planning docs — PRD, RULES, ARCHITECTURE, DESIGN, PHASES, MEMORY, README, ROADMAP.
- **Phase 1 (2026-09-29):** Foundation — Next.js 16 + Tailwind v4 + shadcn/ui components + Supabase SSR helpers + middleware + auth pages + protected app shell + placeholder routes + SQL migration.
- **Phase 2 (2026-09-29): Business setup (Onboarding + Settings)**
  - Created Zod validation schemas for business profile, each onboarding step, and test email.
  - Added Google review URL validator accepting `g.page`, `google.com/maps`, `search.google.com/local/writereview`, `maps.app.goo.gl`, `goo.gl/maps`, with friendly error message.
  - Added default email template constants (request + reminder subjects/bodies) in `src/lib/email/defaults.ts`.
  - Added email rendering helpers (`applyTemplate`, `renderHtml`, `renderText`) in `src/lib/email/render.ts` — supports `{{customer_name}}`, `{{business_name}}`, `{{review_link}}` variables; renders HTML email with single-column layout and a big teal "Leave a review" CTA button, plus plain-text fallback; includes footer with business name/contact/unsubscribe.
  - Added `sendEmail()` stub + `isEmailConfigured()` in `src/lib/email/send.ts` (full Resend integration in Phase 4).
  - Added `requireUser`, `requireBusiness`, `getUserBusiness` helpers in `src/lib/supabase/require-user.ts`.
  - Built 3-step onboarding wizard at `/app/onboarding`:
    - Step 1: Business name + contact line + timezone (server action creates business + seeds default templates)
    - Step 2: Google review link + reply-to email (validated server-side)
    - Step 3: Request email editor with live iframe preview that updates as the user types, "Reset to default" button, sample data preview ("Sam"), anti-gating/anti-incentive notice, optional test-send (gracefully warns if Resend not configured), and Finish action that saves template and redirects to dashboard
    - Step indicator (1-2-3) shows completed/active/upcoming steps
    - Back buttons between steps, users can revisit earlier steps
    - Auto-redirects to the correct step based on what's been saved (prevents skipping ahead via URL)
  - Built Settings page at `/app/settings` with a business profile form (name, contact line, Google review link, reply-to email), plan badge, and placeholders for billing/danger-zone sections (Phase 7).
  - Server actions: `createBusiness`, `saveOnboardingStep2`, `saveOnboardingStep3`, `updateBusinessProfile`, `resetRequestTemplate`, `resetReminderTemplate` with Zod validation, typed errors/values, and redirects.
  - Added `Alert` shadcn/ui component (used for form errors/success messages).
  - Dashboard now requires onboarding completion and redirects to the appropriate step; shows "Next: Phase 3" placeholder.
  - Graceful env-var guards: all routes return 200 with setup guidance when Supabase isn't configured.
  - Build and lint pass. All routes return 200 in dev server.

## Decisions made

- **Email sending in onboarding (step 3):** The "Send test email" button is wired up but returns a friendly "not yet configured" message until Resend is integrated in Phase 4. Users can still preview the email live via the iframe preview using sample data, and can complete onboarding without sending a test email.
- **Template seeding:** When a business is created in step 1, we immediately seed both the request AND reminder templates with defaults. The reminder template can be customized in Phase 4 on the Templates page.
- **"Reset to default"** is available on step 3 for the request template; the reminder template reset lives on the future Templates page.
- **Step navigation:** Onboarding page normalizes the `?step=N` URL and prevents users from URL-skipping ahead past saved progress, but allows going back.
- **Timezone:** Hidden input defaulting to `Europe/London` for MVP; timezone selector UI can be added later.
- **Compliance callout:** A visible amber notice on step 3 reminds owners about no review gating and no incentives (per RULES.md).
- **Server action typing:** Used `useActionState<State, FormData>` generics on client components to satisfy React 19 typing, and a typed `Sb` interface for supabase calls in server actions to work around a Supabase chained-generic inference issue where some queries collapsed to `never`.

## Next up

**Phase 3: Customers**
- Customers page at `/app/customers` with list/search/sort/delete
- Add customer form (name, email, optional phone, required consent checkbox)
- "Add and send" quick action
- CSV import (Papaparse) with column mapping, duplicate detection, row-level error report
- Bulk consent checkbox for CSV import
- Unsubscribed customers visibly marked and blocked from sending

## Open questions

- Billing provider (Polar vs Lemon Squeezy) — deferred to Phase 7.
- Logo/branding assets — still using simple icon marks.
- Supabase project credentials — needed to fully test auth + onboarding flow end-to-end.
- Resend account + verified domain — needed for Phase 4 email sending; test-send button will start working then.
- Timezone UI (hidden for MVP with Europe/London default) — expose a select later if requested.
