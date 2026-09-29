"use client"

import { useActionState, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Mail, RotateCcw, Send } from "lucide-react"
import { applyTemplate, renderHtml } from "@/lib/email/render"
import { saveTemplate, resetTemplate, sendTestTemplateEmail } from "./actions/templates"

type ActionRes = {
  success?: boolean
  errors?: Record<string, string | undefined>
  values?: Record<string, string>
  message?: string
} | null

interface Props {
  businessName: string
  contactLine?: string
  mailingAddress?: string
  reviewUrl: string
  initialRequest: { subject: string; body: string }
  initialReminder: { subject: string; body: string }
  emailConfigured: boolean
}

const SAMPLE_VARS = (businessName: string, reviewUrl: string, contactLine?: string, mailingAddress?: string) => ({
  customer_name: "Sam",
  business_name: businessName,
  review_link: reviewUrl,
  contact_line: contactLine,
  mailing_address: mailingAddress,
})

export function TemplatesClient({
  businessName,
  contactLine,
  mailingAddress,
  reviewUrl,
  initialRequest,
  initialReminder,
  emailConfigured,
}: Props) {
  const [tab, setTab] = useState<"request" | "reminder">("request")
  const [request, setRequest] = useState(initialRequest)
  const [reminder, setReminder] = useState(initialReminder)
  const [testTo, setTestTo] = useState("")

  const current = tab === "request" ? request : reminder
  const setCurrent = (patch: Partial<{ subject: string; body: string }>) => {
    if (tab === "request") setRequest({ ...request, ...patch })
    else setReminder({ ...reminder, ...patch })
  }

  const [saveState, saveAction, savePending] = useActionState<ActionRes, FormData>(saveTemplate, null)
  const [resetState, resetAction, resetPending] = useActionState<ActionRes, FormData>(resetTemplate, null)
  const [testState, testAction, testPending] = useActionState<ActionRes, FormData>(sendTestTemplateEmail, null)

  const previewVars = SAMPLE_VARS(businessName, reviewUrl, contactLine, mailingAddress)
  const previewSubject = applyTemplate(current.subject || "(no subject)", previewVars)
  const previewHtml = renderHtml(current.subject || "", current.body || "", previewVars)

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as "request" | "reminder")}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="request">Request email</TabsTrigger>
        <TabsTrigger value="reminder">Reminder email</TabsTrigger>
      </TabsList>

      {(["request", "reminder"] as const).map((kind) => (
        <TabsContent key={kind} value={kind} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {kind === "request" ? "Initial request" : "Automatic reminder"}
              </CardTitle>
              <CardDescription>
                {kind === "request"
                  ? "Sent immediately when you add and send to a customer."
                  : "Sent once, 3 days after the original request, if the customer hasn't clicked the link."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(saveState?.success || resetState?.success || testState?.success) && (
                <Alert variant="success">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    {saveState?.message || resetState?.message || testState?.message || "Done."}
                  </AlertDescription>
                </Alert>
              )}
              {(saveState?.errors?._form || testState?.errors?._form) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{saveState?.errors?._form || testState?.errors?._form}</AlertDescription>
                </Alert>
              )}

              <form action={saveAction} className="space-y-4">
                <input type="hidden" name="kind" value={kind} />
                <div className="space-y-2">
                  <Label htmlFor={`${kind}-subject`}>Subject *</Label>
                  <Input
                    id={`${kind}-subject`}
                    name="subject"
                    required
                    value={current.subject}
                    onChange={(e) => setCurrent({ subject: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${kind}-body`}>Body *</Label>
                  <Textarea
                    id={`${kind}-body`}
                    name="body"
                    required
                    rows={10}
                    value={current.body}
                    onChange={(e) => setCurrent({ body: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Variables: <code>{`{{customer_name}}`}</code>,{" "}
                    <code>{`{{business_name}}`}</code>, <code>{`{{review_link}}`}</code>. Put{" "}
                    <code>{`{{review_link}}`}</code> on its own line to get a big button
                    in the email.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={savePending}>
                    {savePending ? "Saving…" : "Save template"}
                  </Button>
                  <Button formAction={resetAction} type="submit" variant="outline" disabled={resetPending}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset to default
                  </Button>
                </div>
              </form>

              <div className="rounded-lg border pt-4">
                <div className="flex items-center gap-2 border-b px-4 pb-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Preview (sent to Sam)</span>
                </div>
                <div className="bg-white p-4">
                  <div className="mb-2 text-sm text-muted-foreground">
                    <strong>Subject:</strong> {previewSubject}
                  </div>
                  <iframe
                    title="Email preview"
                    className="h-96 w-full rounded border bg-white"
                    srcDoc={previewHtml}
                  />
                </div>
              </div>

              <form action={testAction} className="space-y-2 rounded-md border p-4">
                <h4 className="text-sm font-semibold">Send a test email</h4>
                <p className="text-xs text-muted-foreground">
                  {emailConfigured
                    ? "Sends the current version of this template to your inbox."
                    : "Configure RESEND_API_KEY and EMAIL_FROM_ADDRESS to enable test sends."}
                </p>
                <input type="hidden" name="kind" value={kind} />
                <input type="hidden" name="subject" value={current.subject} />
                <input type="hidden" name="body" value={current.body} />
                <div className="flex gap-2">
                  <Input
                    name="to"
                    type="email"
                    placeholder="you@example.com"
                    value={testTo}
                    onChange={(e) => setTestTo(e.target.value)}
                    disabled={!emailConfigured}
                  />
                  <Button type="submit" variant="outline" disabled={testPending || !emailConfigured}>
                    <Send className="mr-2 h-4 w-4" />
                    Send test
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  )
}
