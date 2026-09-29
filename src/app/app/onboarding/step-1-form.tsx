"use client"

import { useActionState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { createBusiness } from "../actions/business"

type FormState = { errors: Record<string, string | undefined>; values: Record<string, string> } | null

interface Props {
  defaultName: string
  defaultContactLine: string
  defaultMailingAddress: string
  defaultTimezone: string
}

export function Step1Form({ defaultName, defaultContactLine, defaultMailingAddress, defaultTimezone }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(createBusiness, null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 1 — Your business</CardTitle>
        <CardDescription>
          Start with the basics. This is shown in your emails and helps customers trust
          your message.
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
            <Label htmlFor="name">Business name *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={state?.values?.name ?? defaultName}
              placeholder="e.g. Anna's Coffee Shop"
              aria-invalid={!!state?.errors?.name}
            />
            {state?.errors?.name && (
              <p className="text-sm text-destructive">{state.errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_line">Phone or contact line (optional)</Label>
            <Input
              id="contact_line"
              name="contact_line"
              defaultValue={state?.values?.contact_line ?? defaultContactLine}
              placeholder="e.g. 020 7946 0000"
              aria-invalid={!!state?.errors?.contact_line}
            />
            <p className="text-xs text-muted-foreground">
              A phone number or short contact line shown in your email footer.
            </p>
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
              defaultValue={state?.values?.mailing_address ?? defaultMailingAddress}
              placeholder={"123 High Street\nLondon NW1 1AA\nUnited Kingdom"}
              aria-invalid={!!state?.errors?.mailing_address}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Required by CAN-SPAM and other anti-spam laws — shown in the footer of every email.
            </p>
            {state?.errors?.mailing_address && (
              <p className="text-sm text-destructive">{state.errors.mailing_address}</p>
            )}
          </div>

          <input type="hidden" name="timezone" value={defaultTimezone} />

          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? "Saving…" : "Continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
