"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, ExternalLink } from "lucide-react"
import { updateBusinessProfile } from "../actions/business"

type SettingsActionResult = {
  success?: boolean
  errors?: Record<string, string | undefined>
  values?: Record<string, string>
} | null

interface Props {
  business: {
    name: string
    google_review_url: string
    reply_to_email: string
    contact_line: string
    mailing_address: string
    timezone: string
    plan: string
  }
  userEmail: string
}

export function SettingsForm({ business, userEmail }: Props) {
  const [state, action, pending] = useActionState<SettingsActionResult, FormData>(
    updateBusinessProfile,
    null
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business profile</CardTitle>
        <CardDescription>
          These details appear in your emails and on your dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          {state?.success && (
            <Alert variant="success">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Settings saved.</AlertDescription>
            </Alert>
          )}
          {state?.errors?._form && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.errors._form}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Business name *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={state?.values?.name ?? business.name}
              aria-invalid={!!state?.errors?.name}
            />
            {state?.errors?.name && <p className="text-sm text-destructive">{state.errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_line">Contact line (email footer)</Label>
            <Input
              id="contact_line"
              name="contact_line"
              defaultValue={state?.values?.contact_line ?? business.contact_line}
              placeholder="Phone number or short contact line"
            />
            {state?.errors?.contact_line && (
              <p className="text-sm text-destructive">{state.errors.contact_line}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mailing_address">Physical mailing address *</Label>
            <Textarea
              id="mailing_address"
              name="mailing_address"
              required
              rows={3}
              defaultValue={state?.values?.mailing_address ?? business.mailing_address}
              placeholder={"123 High Street\nLondon NW1 1AA\nUnited Kingdom"}
              aria-invalid={!!state?.errors?.mailing_address}
            />
            <p className="text-xs text-muted-foreground">
              Required by CAN-SPAM and other anti-spam laws — shown in every email footer.
            </p>
            {state?.errors?.mailing_address && (
              <p className="text-sm text-destructive">{state.errors.mailing_address}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="google_review_url">Google review link *</Label>
            <Input
              id="google_review_url"
              name="google_review_url"
              type="url"
              required
              defaultValue={state?.values?.google_review_url ?? business.google_review_url}
              aria-invalid={!!state?.errors?.google_review_url}
            />
            {state?.errors?.google_review_url && (
              <p className="text-sm text-destructive">{state.errors.google_review_url}</p>
            )}
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
            <Label htmlFor="reply_to_email">Reply-to email</Label>
            <Input
              id="reply_to_email"
              name="reply_to_email"
              type="email"
              defaultValue={state?.values?.reply_to_email ?? business.reply_to_email}
              placeholder="you@yourbusiness.com"
              aria-invalid={!!state?.errors?.reply_to_email}
            />
            {state?.errors?.reply_to_email && (
              <p className="text-sm text-destructive">{state.errors.reply_to_email}</p>
            )}
          </div>

          <input type="hidden" name="timezone" value={business.timezone} />

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Plan:</span>
                <Badge variant="secondary" className="capitalize">{business.plan}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Signed in as {userEmail}. Upgrade and plan management coming in Phase 7.
              </p>
            </div>
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
