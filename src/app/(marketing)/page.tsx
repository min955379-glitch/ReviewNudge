import Link from "next/link"
import { Mail, MousePointerClick, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Send review requests in 10 seconds.
            <span className="text-primary"> Get more Google reviews.</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            ReviewNudge helps local businesses collect more Google reviews. Add a customer,
            hit send, and we take care of delivery, tracking, and one friendly reminder.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button asChild size="xl">
              <Link href="/signup">Start free</Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              icon: Mail,
              title: "1. Add a customer",
              body: "Type their name and email, tick the consent box — takes 10 seconds.",
            },
            {
              icon: MousePointerClick,
              title: "2. We send the email",
              body: "A friendly review request with a unique tracking link lands in their inbox.",
            },
            {
              icon: Clock,
              title: "3. One reminder",
              body: "If they don't click after 3 days, we send one reminder. No spam, ever.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-lg border bg-card p-6">
              <Icon className="mb-4 h-8 w-8 text-primary" />
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Placeholder notice */}
      <section className="mx-auto max-w-3xl px-4 py-8 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
        <p>
          <em>Note:</em> Full marketing site, pricing, FAQ, and legal pages are coming in Phase 8.
        </p>
      </section>
    </div>
  )
}
