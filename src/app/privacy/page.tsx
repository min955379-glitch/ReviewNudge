import type { Metadata } from "next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "ReviewNudge Privacy Policy — what data we collect, how we use it, who we share it with, and your rights.",
}

const EFFECTIVE = "September 29, 2026"

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
          <p className="text-sm text-muted-foreground">Effective {EFFECTIVE}</p>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground">
          <p>
            This Privacy Policy explains how ReviewNudge (&quot;we&quot;, &quot;us&quot;)
            collects, uses, and shares information when you use our website and
            email service (the &quot;Service&quot;).
          </p>

          <h3>Information we collect</h3>
          <ul>
            <li>
              <strong>Account information:</strong> your email address, name, and
              authentication credentials when you sign up.
            </li>
            <li>
              <strong>Business information:</strong> business name, Google review
              URL, reply-to email, mailing address, and other information you
              enter during onboarding.
            </li>
            <li>
              <strong>Customer data (you provide this):</strong> when you add
              customers to your account, you provide their name, email, optional
              phone number, and consent status. We store this so you can send
              emails and track clicks — we never use your customers&apos; data for
              our own marketing.
            </li>
            <li>
              <strong>Email and click activity:</strong> whether an email was
              delivered, when a tracking link was clicked, and the IP address /
              user agent of the click (used to filter out automated bot clicks).
            </li>
            <li>
              <strong>Diagnostic data:</strong> server logs, error reports, and
              usage telemetry that helps us debug issues.
            </li>
          </ul>

          <h3>How we use information</h3>
          <ul>
            <li>To provide the Service — authenticate you, send emails you request, track clicks.</li>
            <li>To process payments via our billing provider (Polar).</li>
            <li>To send you service-related notices (e.g. billing failures, quota warnings).</li>
            <li>To detect abuse and keep the Service secure.</li>
          </ul>
          <p>
            We do <strong>not</strong> sell your data or your customers&apos; data.
            We do <strong>not</strong> use your customers&apos; email addresses to
            send marketing of our own.
          </p>

          <h3>Subprocessors and service providers</h3>
          <p>We use the following third-party providers to deliver the Service:</p>
          <ul>
            <li><strong>Supabase</strong> — database and authentication.</li>
            <li><strong>Resend</strong> — transactional email delivery.</li>
            <li><strong>Polar</strong> — billing, payments, and subscription management.</li>
            <li><strong>Vercel</strong> — hosting and serverless infrastructure.</li>
          </ul>
          <p>
            When emails are sent through Resend, your customer&apos;s email address
            and the message content are transmitted to Resend for delivery
            subject to their privacy policy.
          </p>

          <h3>Data retention</h3>
          <ul>
            <li>Account and business data is retained as long as your account is active.</li>
            <li>
              Customer records and review request history are retained while your
              account is active; you can delete individual customers or your
              whole account at any time.
            </li>
            <li>
              Diagnostic/server logs are retained for up to 30 days for debugging.
            </li>
          </ul>

          <h3>Your rights</h3>
          <p>
            Depending on your jurisdiction you may have rights to access,
            correct, export, or delete personal data we hold about you. Because
            customer records belong to you (the ReviewNudge account holder),
            your customers&apos; data-rights requests should be directed to you in
            the first instance; we will support you in fulfilling them as
            required by law.
          </p>
          <p>
            To request deletion of your account or your data, email{" "}
            <a href="mailto:privacy@reviewnudge.app">privacy@reviewnudge.app</a>.
          </p>

          <h3>Cookies</h3>
          <p>
            We use a small number of cookies required to keep you logged in and
            to protect against cross-site request forgery. We do not use
            third-party advertising or analytics cookies.
          </p>

          <h3>Changes</h3>
          <p>
            We may update this policy occasionally. Material changes will be
            announced by email or an in-app notice.
          </p>

          <h3>Contact</h3>
          <p>
            Privacy questions? Email{" "}
            <a href="mailto:privacy@reviewnudge.app">privacy@reviewnudge.app</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
