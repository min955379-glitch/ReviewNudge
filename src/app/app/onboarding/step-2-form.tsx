"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ExternalLink } from "lucide-react"
import { saveOnboardingStep2 } from "../actions/business"

type FormState = { errors: Record<string, string | undefined>; values: Record<string, string> } | null

interface Props {
  defaultGoogleReviewUrl: string
  defaultReplyToEmail: string
}

export function Step2Form({ defaultGoogleReviewUrl, defaultReplyToEmail }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveOnboardingStep2, null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 2 — Your Google review link</CardTitle>
        <CardDescription>
          This is the link customers land on when they click &quot;Leave a review&quot; in your
          email. It must be a link from Google — we validate it to avoid typos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          {state?.errors?._form && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.errors._form}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="google_review_url">Google review link *</Label>
            <Input
              id="google_review_url"
              name="google_review_url"
              required
              type="url"
              defaultValue={state?.values?.google_review_url ?? defaultGoogleReviewUrl}
              placeholder="https://g.page/yourbusiness/review?rc"
              aria-invalid={!!state?.errors?.google_review_url}
            />
            {state?.errors?.google_review_url && (
              <p className="text-sm text-destructive">{state.errors.google_review_url}</p>
            )}
            <p className="text-xs text-muted-foreground">
              To find it: open your Google Business Profile → click &quot;Ask for reviews&quot; →
              copy the link. It will look like <code>g.page/...</code>,{" "}
              <code>google.com/maps/...</code>,{" "}
              <code>search.google.com/local/writereview?...</code>, or{" "}
              <code>maps.app.goo.gl/...</code>.
            </p>
            <Link
              href="https://support.google.com/business/answer/6216102"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              How to find your link <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reply_to_email">Reply-to email (optional)</Label>
            <Input
              id="reply_to_email"
              name="reply_to_email"
              type="email"
              defaultValue={state?.values?.reply_to_email ?? defaultReplyToEmail}
              placeholder="you@yourbusiness.com"
              aria-invalid={!!state?.errors?.reply_to_email}
            />
            <p className="text-xs text-muted-foreground">
              If a customer replies to the review email, replies come here. We send from
              a ReviewNudge address to ensure deliverability.
            </p>
            {state?.errors?.reply_to_email && (
              <p className="text-sm text-destructive">{state.errors.reply_to_email}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" asChild type="button">
              <Link href="/app/onboarding?step=1">Back</Link>
            </Button>
            <Button type="submit" size="lg" className="flex-1" disabled={pending}>
              {pending ? "Saving…" : "Continue"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
