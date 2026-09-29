# MEMORY.md — Development Log

## Completed

- **Phase 0 (2026-09-29):** Created all six project context files from the master prompt:
  - `PRD.md` — Product requirements, features, acceptance criteria, out of scope
  - `RULES.md` — Hard rules, security checklist, email compliance
  - `ARCHITECTURE.md` — Tech stack, data model (SQL), routes, folder structure, env vars
  - `DESIGN.md` — Visual direction, mobile-first UX, component guidelines
  - `PHASES.md` — 9 build phases with checklists and "done when" criteria
  - `MEMORY.md` — This file (running log)
  - `README.md` — Project overview and documentation
  - `ROADMAP.md` — Development roadmap tracking progress

## Decisions made

- **Product name:** ReviewNudge (repo name); master prompt used "ReviewPing" but repo is ReviewNudge, so that's the official product name.
- **Billing provider:** TBD — will choose between Polar and Lemon Squeezy when reaching Phase 7 (both are documented as options).
- **Stack:** Next.js 14+ App Router, TypeScript, Tailwind + shadcn/ui, Supabase, Resend — all per master prompt.
- **Phased development:** Building strictly one phase at a time, waiting for approval between phases.
- **No AI APIs:** Confirmed — no LLM or AI service anywhere.

## Next up

Wait for user approval to begin **Phase 1: Foundation** (Next.js project setup, Tailwind, shadcn/ui, Supabase auth, database migrations, protected routes).

## Open questions

- Billing provider preference (Polar vs Lemon Squeezy) — does not block until Phase 7.
- Exact accent color preference (teal vs blue) — will pick teal-600 as default unless asked otherwise.
- Logo/branding assets — will use a simple text mark initially.
- Preferred region for Supabase project — will document but not assume.
