import Link from "next/link"
import { Mail, MousePointerClick, Clock, ShieldCheck, LineChart, Upload, CheckCircle2, Star, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata = {
  title: "ReviewNudge — Get more Google reviews on autopilot",
  description:
    "ReviewNudge sends friendly Google review requests to your customers by email, with automatic reminders, click tracking, and one-click unsubscribe. Built for local businesses.",
}

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_60%)]"
        />
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6">
              <Sparkles className="mr-1 h-3 w-3" /> Start free — no credit card required
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              More Google reviews,
              <span className="text-primary"> with zero extra work.</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              ReviewNudge sends your customers a single, friendly email asking for a
              Google review — and one automatic reminder if they don&apos;t click. No
              spam, no review gating, no fake reviews. Just more real feedback for
              your business.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Button asChild size="xl">
                <Link href="/signup">Send your first request free</Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Free plan includes 10 emails per month. Upgrade anytime.
            </p>
          </div>

          {/* Hero stats */}
          <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { k: "10s", v: "to send a request" },
              { k: "3 days", v: "auto reminder delay" },
              { k: "0", v: "extra reviews faked" },
              { k: "100%", v: "CAN-SPAM compliant" },
            ].map((s) => (
              <div key={s.k} className="text-center">
                <dt className="text-2xl font-bold text-primary sm:text-3xl">{s.k}</dt>
                <dd className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
          <p className="mt-4 text-muted-foreground">
            Three steps, 10 seconds total. Your customer gets a clean email with a
            single button that opens Google Reviews — nothing else.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: Upload,
              num: "1",
              title: "Add a customer",
              body: "Type their name and email (or bulk-import a CSV) and tick the consent box. That's it — no templates to configure before you can start.",
            },
            {
              icon: Mail,
              num: "2",
              title: "We send the email",
              body: "A branded email lands in their inbox with a big button that opens your Google review link. Every send is tracked so you can see who clicked.",
            },
            {
              icon: Clock,
              num: "3",
              title: "One polite reminder",
              body: "If they don't click after 3 days, we send exactly one reminder. No more. If they unsubscribe, they're never emailed again.",
            },
          ].map(({ icon: Icon, num, title, body }) => (
            <Card key={title}>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="font-mono">Step {num}</Badge>
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Built for small, honest businesses
            </h2>
            <p className="mt-4 text-muted-foreground">
              ReviewNudge was built by a small team for small teams. Every feature
              keeps things simple and compliant — no growth hacks, no dark patterns.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Fully compliant",
                body: "CAN-SPAM ready with your physical mailing address in every footer, one-click unsubscribe, and an HMAC-signed unsubscribe link that can't be forged.",
              },
              {
                icon: MousePointerClick,
                title: "Bot-proof click tracking",
                body: "Mail scanners and link previews are detected automatically so your stats reflect real clicks from real customers — not Gmail's fetchers.",
              },
              {
                icon: LineChart,
                title: "30-day dashboard",
                body: "See who opened, who clicked, and how many reviews were confirmed right from your dashboard — with a daily sends chart and quota meter.",
              },
              {
                icon: Mail,
                title: "Customizable templates",
                body: "Edit the subject line and body of both the request and the reminder email, with an instant preview and a one-click test send.",
              },
              {
                icon: Upload,
                title: "CSV import",
                body: "Upload a CSV of customer names and emails, auto-detects common column headers. Duplicates and unsubscribed emails are skipped automatically.",
              },
              {
                icon: CheckCircle2,
                title: "No review gating, ever",
                body: "Every customer gets the same Google review link. We never intercept positive vs negative feedback or steer customers to different destinations.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <Card key={title} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <Icon className="mb-3 h-6 w-6 text-primary" />
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Honest FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Honest answers</h2>
        <p className="mt-4 text-muted-foreground">
          We&apos;re not going to over-promise. Here&apos;s what ReviewNudge actually does.
        </p>
        <div className="mt-8 space-y-6">
          {[
            {
              q: "Can ReviewNudge tell me if someone actually posted a review?",
              a: "No. Google doesn't expose that data to third parties. We can tell you when a customer clicked your review link — we can never know for sure whether they wrote a review afterward. If a customer tells you they reviewed you, you can mark them 'reviewed' manually to stop reminders.",
            },
            {
              q: "Do you ever send more than one reminder?",
              a: "No. Exactly one reminder is sent 3 days after the original email, and only to customers who haven't clicked. After that, we leave them alone.",
            },
            {
              q: "Will this get me in trouble with Google?",
              a: "As long as you're emailing real customers who actually did business with you and not offering incentives for positive reviews, you're following Google's guidelines. We do NOT support review gating (sending happy customers to Google and unhappy ones to a feedback form) — every customer gets the same link.",
            },
            {
              q: "Is this legal under CAN-SPAM / GDPR?",
              a: "The tool is built for compliance: every email has your physical mailing address, a working one-click unsubscribe, and a clear 'From' line. You still need to only email people you have a business relationship with, and make sure you have whatever consent your region requires. We're not lawyers, but we've made the easy parts easy.",
            },
            {
              q: "Do you use AI to write my emails?",
              a: "No. The default templates are short, human-written emails that just ask for a review. You can edit them to sound like you. There are zero LLM or AI API calls in ReviewNudge.",
            },
          ].map((item) => (
            <div key={item.q}>
              <h3 className="flex items-start gap-2 font-semibold">
                <Star className="mt-1 h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
                {item.q}
              </h3>
              <p className="mt-2 pl-6 text-sm text-muted-foreground">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Start turning happy customers into reviews.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Sign up free, connect your Google review link, and send your first
            request in under 3 minutes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="xl">
              <Link href="/signup">Start free</Link>
            </Button>
            <Button asChild variant="ghost" size="xl">
              <Link href="/login">I already have an account</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
