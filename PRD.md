# PRD: ReviewNudge (formerly ReviewPing)

## Product Summary

ReviewNudge helps local businesses (gyms, salons, dentists, garages, restaurants, tradespeople) get more Google reviews. The owner adds a customer, and the app sends that customer a friendly email asking for a Google review, with a unique tracking link. The app logs when the link is clicked and sends one automatic reminder if the customer has not clicked.

**Product name:** ReviewNudge
**Target customer:** small local business owners in the UK, USA, Canada and Australia.
**Core promise:** "Send review requests in 10 seconds. Get more Google reviews."
**Platform:** responsive website (web app), mobile-first, installable as a PWA. No native mobile app.
**No AI APIs.** Do not integrate any LLM or AI service. All logic is plain code and templates.

---

## Features

### Landing page
Sections: hero (headline, subheadline, CTA "Start free"), a 3-step "How it works", a screenshot/mockup of the dashboard, benefits, pricing table, FAQ, footer.
FAQ must honestly answer: "Can you see if someone left a review?" (No, you see who clicked the link) and "Is this allowed by Google?" (Yes, as long as you ask all customers and don't offer rewards).
Tone: simple, friendly, no hype. Mobile-first.

### Onboarding wizard (3 steps)
1. Business name + contact line (address or phone for email footer)
2. Paste Google review link. Include a help link/text explaining how to find it (Google Business Profile → "Get more reviews" → copy link). Validate that the URL looks like a Google review link (`g.page`, `google.com/maps`, `search.google.com/local/writereview`, or `maps.app.goo.gl`).
3. Preview and edit the default email template, then send a test email to yourself.

### Dashboard
- Stat cards: requests sent (30 days), click rate, reminders sent, manually confirmed reviews
- Chart: requests sent per day, last 30 days
- "Send a request" primary button always visible (large on mobile)
- Recent activity list with status badges

### Customers
- Add customer form: name, email, optional phone, consent checkbox (required)
- Quick "Add and send" action that creates the customer and sends the request in one step (the 10-second flow)
- CSV import with column mapping, duplicate detection by email, row-level error report, and a consent confirmation checkbox for the whole file
- Search, sort, delete
- Unsubscribed customers are visibly marked and cannot be sent to

### Requests
- Table: customer, sent date, status (queued / sent / failed / clicked), clicks, reminder sent
- Filters by status and date
- Row actions: resend, mark "Review received" manually, view details
- Bulk send to selected customers (respect plan limits and rate limits)

### Templates
- Two templates per business: request and reminder
- Variables: `{{customer_name}}`, `{{business_name}}`, `{{review_link}}`
- Live preview with sample data
- "Reset to default" button
- Sensible default copy:

  **Request subject:** `How did we do, {{customer_name}}?`
  **Request body:** `Hi {{customer_name}}, thanks for choosing {{business_name}}. If you have a minute, we'd really appreciate an honest review on Google: {{review_link}}. Thank you!`

  **Reminder subject:** `A quick reminder from {{business_name}}`
  **Reminder body:** `Hi {{customer_name}}, just a friendly reminder in case you missed our earlier message. Your honest feedback helps other people find us: {{review_link}}`

- Email layout: clean, single column, big button "Leave a review", plain-text fallback, footer with contact line and unsubscribe link.

### Tracking link
- On send, generate an 8-character unguessable `short_code`.
- `review_link` in the email = `https://APP_URL/r/{short_code}`.
- On visit: increment `click_count`, set `first_clicked_at` if empty, set status to `clicked`, insert `click_events`, then redirect.
- Ignore obvious bots/link scanners where possible (check user agent for common email scanners) so click stats are not inflated. Do not block real users.

### Automatic reminder
- Cron runs every hour.
- Finds requests where `status = 'sent'`, `first_clicked_at is null`, `reminder_sent_at is null`, `sent_at` older than 3 days, customer not unsubscribed.
- Sends the reminder template once, sets `reminder_sent_at`.
- Only one reminder per request. Never more.

### Plans and billing

| Plan | Price | Limits |
|---|---|---|
| Free | $0 | 10 requests/month, 1 business, no reminders |
| Pro | $12/month | 300 requests/month, auto reminders, CSV import |
| Business | $29/month | 1,500 requests/month, bulk send, priority support |

- Enforce limits server-side. Show usage meter in the dashboard and a friendly upgrade prompt when near the limit.
- Checkout via billing provider, webhook updates `businesses.plan`.
- Customer portal link in Settings to manage or cancel subscription.
- Make prices and limits config constants in one file.

### Settings
- Edit business info and Google review link
- Sender name and reply-to email
- Plan and billing
- Export customers as CSV
- Delete account (deletes all data)

---

## Acceptance Criteria (MVP is done when)

- [ ] A new owner can sign up, finish onboarding and send a test email in under 3 minutes
- [ ] An owner can add a customer and send a request in under 10 seconds
- [ ] Clicking the email link logs the click and lands on the correct Google review page
- [ ] The customer who clicks never receives the reminder; one who doesn't click gets exactly one reminder after 3 days
- [ ] Unsubscribed customers can never be emailed again
- [ ] Two different accounts cannot see each other's data (tested)
- [ ] Free plan limit is enforced and the upgrade flow works end to end
- [ ] The app works well on a 375px wide phone screen
- [ ] No AI API or LLM is used anywhere
- [ ] README explains setup, environment variables, email domain verification and deployment

---

## Out of Scope (do NOT build yet)

SMS sending, WhatsApp, multi-location businesses, team members/roles, Google API integration or review syncing, review response tools, white labelling, native mobile apps, any AI features.
