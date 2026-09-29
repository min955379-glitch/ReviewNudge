import type { Metadata } from "next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "ReviewNudge Terms of Service — what you can and can't do with the service, and what you're responsible for as a sender.",
}

const EFFECTIVE = "September 29, 2026"

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle>Terms of Service</CardTitle>
          <p className="text-sm text-muted-foreground">Effective {EFFECTIVE}</p>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground">
          <p>
            These Terms of Service (&quot;Terms&quot;) govern your use of ReviewNudge
            (&quot;the Service&quot;), operated by ReviewNudge (&quot;we&quot;, &quot;us&quot;).
            By creating an account or sending emails through ReviewNudge, you agree
            to these Terms.
          </p>

          <h3>1. Your account</h3>
          <p>
            You must be at least 18 years old and legally able to enter into a
            contract to use the Service. You are responsible for maintaining the
            security of your account and for all activity that occurs under it.
          </p>

          <h3>2. Acceptable use</h3>
          <p>You agree <strong>not</strong> to use ReviewNudge to:</p>
          <ul>
            <li>
              Send email to anyone with whom you do not have an existing business
              relationship or who has not given appropriate consent to be contacted.
            </li>
            <li>
              Offer incentives (discounts, free products, gift cards, etc.) in
              exchange for positive Google reviews, or otherwise attempt to
              manipulate review content — this violates Google&apos;s policies and
              in many jurisdictions consumer-protection law.
            </li>
            <li>
              Harass recipients, send content that is illegal, threatening,
              discriminatory, or sexually explicit.
            </li>
            <li>
              Use the Service to send more email than your plan allows, attempt
              to bypass quota limits, or interfere with the security or stability
              of the Service.
            </li>
          </ul>
          <p>
            We reserve the right to suspend or terminate accounts that violate
            these rules — in particular, accounts that send spam or that attempt
            to fraudulently manipulate reviews will be shut down immediately and
            without refund.
          </p>

          <h3>3. What we do</h3>
          <p>
            ReviewNudge sends transactional email requests on your behalf, tracks
            link clicks, and provides an automatic reminder email. We do not
            write reviews, post reviews, read reviews, or guarantee that any
            recipient will leave a review. We cannot detect whether a recipient
            actually submitted a review on Google.
          </p>

          <h3>4. Subscriptions and billing</h3>
          <p>
            Paid plans renew automatically until canceled. You may cancel at any
            time from your billing page; you retain access until the end of the
            paid period. All fees are exclusive of any applicable taxes, which
            are collected by our Merchant of Record (Polar).
          </p>

          <h3>5. Cancellation and termination</h3>
          <p>
            You may cancel your account at any time. We may suspend or terminate
            accounts that violate these Terms or that generate abuse complaints,
            including spam reports from recipients or from email providers.
          </p>

          <h3>6. Disclaimer of warranties</h3>
          <p>
            The Service is provided &quot;as is&quot; without warranty of any kind.
            We do not warrant that the Service will be uninterrupted, error-free,
            or that it will produce any particular number of reviews for your
            business.
          </p>

          <h3>7. Limitation of liability</h3>
          <p>
            To the maximum extent permitted by law, our total liability for any
            claim arising out of your use of the Service is limited to the amount
            you paid us in the 12 months preceding the claim.
          </p>

          <h3>8. Changes</h3>
          <p>
            We may update these Terms from time to time. Material changes will be
            announced by email or by a notice in the app. Continued use of the
            Service after changes take effect constitutes your acceptance.
          </p>

          <h3>9. Contact</h3>
          <p>
            Questions about these Terms? Email{" "}
            <a href="mailto:support@reviewnudge.app">support@reviewnudge.app</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
