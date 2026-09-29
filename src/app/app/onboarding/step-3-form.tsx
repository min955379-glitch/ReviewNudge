"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Mail } from "lucide-react"
import { applyTemplate, renderHtml } from "@/lib/email/render"
import { saveOnboardingStep3 } from "../actions/business"
import { isEmailConfigured, sendEmail } from "@/lib/email/send"
import { DEFAULT_REQUEST_BODY, DEFAULT_REQUEST_SUBJECT } from "@/lib/email/defaults"

type FormState = { errors: Record<string, string | undefined>; values: Record<string, string> } | null

interface Props {
  businessName: string
  defaultSubject: string
  defaultBody: string
  googleReviewUrl: string
  ownerEmail: string
}

const SAMPLE_VARS = {
  customer_name: "Sam",
  business_name: "",
  review_link: "",
  contact_line: "",
}

export function Step3Form({
  businessName,
  defaultSubject,
  defaultBody,
  googleReviewUrl,
  ownerEmail,
}: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveOnboardingStep3, null)

  const initialSubject = defaultSubject || DEFAULT_REQUEST_SUBJECT
  const initialBody = defaultBody || DEFAULT_REQUEST_BODY
  const [subject, setSubject] = useState(state?.values?.request_subject ?? initialSubject)
  const [body, setBody] = useState(state?.values?.request_body ?? initialBody)
  const [testEmail, setTestEmail] = useState(ownerEmail)
  const [testSending, setTestSending] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  const previewVars = {
    ...SAMPLE_VARS,
    business_name: businessName,
    review_link: googleReviewUrl,
    contact_line: "",
  }

  const previewSubject = applyTemplate(subject, previewVars)
  const previewHtml = renderHtml(subject, body, previewVars)

  async function handleSendTest() {
    setTestResult(null)
    setTestSending(true)
    try {
      if (!isEmailConfigured()) {
        setTestResult({
          ok: false,
          message:
            "Email sending isn't set up yet. Configure RESEND_API_KEY and EMAIL_FROM_ADDRESS to enable test sends (Phase 4). You can still preview below.",
        })
        return
      }
      const vars = {
        customer_name: "you",
        business_name: businessName,
        review_link: googleReviewUrl,
        unsubscribe_link: `${window.location.origin}/unsubscribe/test`,
      }
      const appHost = process.env.NEXT_PUBLIC_APP_URL
        ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
        : window.location.hostname
      const result = await sendEmail({
        to: testEmail,
        from: `ReviewNudge <reviews@${appHost}>`,
        subject: applyTemplate(subject, vars),
        text: applyTemplate(body, vars),
        html: renderHtml(subject, body, vars),
      })
      setTestResult({
        ok: result.ok,
        message: result.ok ? `Test email sent to ${testEmail}.` : result.error ?? "Unknown error",
      })
    } catch (e) {
      setTestResult({ ok: false, message: e instanceof Error ? e.message : "Unknown error" })
    } finally {
      setTestSending(false)
    }
  }

  function handleReset() {
    setSubject(DEFAULT_REQUEST_SUBJECT)
    setBody(DEFAULT_REQUEST_BODY)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 3 — Your request email</CardTitle>
        <CardDescription>
          This is the email your customers receive. Personalize it — or leave our
          friendly default. We&apos;ll show you a live preview as you type.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-6">
          {state?.errors?._form && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.errors._form}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="request_subject">Email subject *</Label>
            <Input
              id="request_subject"
              name="request_subject"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              aria-invalid={!!state?.errors?.request_subject}
            />
            {state?.errors?.request_subject && (
              <p className="text-sm text-destructive">{state.errors.request_subject}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="request_body">Email body *</Label>
              <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
                Reset to default
              </Button>
            </div>
            <Textarea
              id="request_body"
              name="request_body"
              required
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              aria-invalid={!!state?.errors?.request_body}
            />
            {state?.errors?.request_body && (
              <p className="text-sm text-destructive">{state.errors.request_body}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Use <code>{`{{customer_name}}`}</code>, <code>{`{{business_name}}`}</code>,
              and <code>{`{{review_link}}`}</code> as placeholders. The reminder email
              uses our sensible default and can be customized later on the Templates
              page.
            </p>
          </div>

          {/* Preview */}
          <div className="rounded-lg border">
            <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Preview (sent to Sam)</span>
            </div>
            <div className="bg-white p-4">
              <div className="mb-3 text-sm text-muted-foreground">
                <strong>Subject:</strong> {previewSubject}
              </div>
              <iframe
                title="Email preview"
                className="h-80 w-full rounded border bg-white"
                srcDoc={previewHtml}
              />
            </div>
          </div>

          {/* Test email */}
          <div className="space-y-2 rounded-lg border p-4">
            <Label htmlFor="test_to" className="text-sm font-medium">
              Send a test email (optional)
            </Label>
            <div className="flex gap-2">
              <Input
                id="test_to"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <Button type="button" variant="outline" onClick={handleSendTest} disabled={testSending}>
                {testSending ? "Sending…" : "Send test"}
              </Button>
            </div>
            {testResult && (
              <Alert variant={testResult.ok ? "success" : "destructive"}>
                {testResult.ok ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <strong>Important:</strong> We send every customer to the same Google
              review link. We don&apos;t ask customers to rate first or route unhappy
              customers elsewhere — that&apos;s review gating and it violates Google&apos;s
              policy. We also don&apos;t offer rewards or discounts for reviews.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" asChild type="button">
              <Link href="/app/onboarding?step=2">Back</Link>
            </Button>
            <Button type="submit" size="lg" className="flex-1" disabled={pending}>
              {pending ? "Finishing…" : "Finish setup → Dashboard"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
