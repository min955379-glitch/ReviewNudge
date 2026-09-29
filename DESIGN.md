# DESIGN.md — Visual & UX Guidelines

## 1. Visual Direction

**Mood:** Clean, modern, trustworthy. Lots of white space. Simple and friendly. No hype.

**Accent color:** A single blue/teal accent for primary actions, links, and highlights.
- Primary color: Teal/blue range — e.g. `#0d9488` (teal-600) or similar.
- Background: White / very light gray.
- Text: Near-black (`#111827`) for headings, medium gray (`#4b5563`) for body.
- Status colors: success green, warning amber, error/danger red, neutral gray.

**Typography:**
- Use the default shadcn/ui typography stack (Inter via system fallbacks).
- Clear hierarchy: large bold headings, readable body (16px base minimum on mobile).
- Line-height comfortable for reading (~1.5–1.6 for body).

**Spacing:** Generous whitespace. Use Tailwind's spacing scale. Avoid cramming. Cards and sections have comfortable padding.

**Components:**
- Use shadcn/ui as the base component library: Button, Card, Input, Label, Select, Table, Dialog, Tabs, Badge, Toast, Skeleton, Dropdown Menu, Checkbox, Textarea, Progress, Alert.
- Buttons: Clear primary (solid accent), secondary (outline), ghost, and destructive variants.
- Form inputs with labels, error messages, and helper text.
- Tables responsive with horizontal scroll on mobile.
- Badges for status: queued (gray), sent (blue), clicked (green), failed (red).

**Dark mode:** Optional, not required for MVP. Can be added later.

---

## 2. Mobile-First UX Rules

- **The 10-second flow:** The "Add customer + send" action must be reachable in one tap from the dashboard. Big tap targets (min 44px height).
- Primary CTA "Send a request" is always visible — large and prominent on mobile.
- Forms: Stacked labels above inputs, single column on mobile.
- Tables: On narrow screens, collapse to card-style rows or allow horizontal scroll with clear indication.
- Bottom padding for mobile safe areas.
- No hover-only interactions. All actions accessible via tap.

---

## 3. UX Details

- **Empty states:** Friendly illustrations/icon + message + CTA when there are no customers, no requests, etc.
- **Loading states:** Skeleton loaders for lists and dashboards; disabled buttons with spinners during actions.
- **Success toasts:** Confirm actions like "Request sent", "Customer added", "Template saved".
- **Error messages:** Clear, specific, helpful. Don't just say "Error" — explain what went wrong and how to fix it.
- **Confirmation dialogs** for destructive actions (delete customer, delete account).
- **Help text:** Explain the Google review link (with how-to-find instructions), consent checkbox meaning, etc.

---

## 4. Email Design

- Single column layout, ~600px wide.
- Large prominent "Leave a review" button in accent color.
- Friendly, short copy (see defaults in PRD).
- Plain-text fallback included.
- Footer: business name, contact line, unsubscribe link, "Sent by ReviewNudge" note.
- Responsive: readable on phone screens.

---

## 5. PWA

- `manifest.json` with name, short_name, icons, theme color matching accent.
- Installable, but no offline features required.
- App-like icons (simple logo mark).

---

## 6. Iconography

- Use lucide-react icons (default for shadcn/ui).
- Consistent stroke width (2px default).
- Common icons: Mail, Users, Send, Chart, Settings, Check, X, Clock, AlertCircle, ExternalLink, Plus, Search, Trash, Edit, Download, Upload.
