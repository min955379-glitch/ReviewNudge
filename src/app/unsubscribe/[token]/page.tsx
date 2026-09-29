import { createSupabaseServerClient } from "@/lib/supabase/server"
import { verifyToken } from "@/lib/utils/crypto"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, MailX } from "lucide-react"
import { confirmUnsubscribe } from "./actions"

interface Params {
  params: Promise<{ token: string }>
  searchParams?: Promise<{ done?: string }>
}

export default async function UnsubscribePage({ params, searchParams }: Params) {
  const { token } = await params
  const sp = await searchParams
  const payload = verifyToken(token)

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Unsubscribe</CardTitle>
            <CardDescription className="text-center">
              Setup pending — please try again in a moment.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!payload || typeof payload.business_id !== "string" || typeof payload.email !== "string") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-center">Invalid or expired link</CardTitle>
            <CardDescription className="text-center">
              This unsubscribe link is no longer valid.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const email = payload.email as string
  const businessId = payload.business_id as string

  const supabase = await createSupabaseServerClient()
  const { data: business } = await supabase
    .from("businesses")
    .select("name")
    .eq("id", businessId)
    .maybeSingle()
  const businessName = (business as { name?: string } | null)?.name

  const { data: existing } = await supabase
    .from("customers")
    .select("unsubscribed")
    .eq("business_id", businessId)
    .eq("email", email.toLowerCase())
    .maybeSingle()
  const alreadyUnsubscribed =
    !!(existing as { unsubscribed?: boolean } | null)?.unsubscribed || sp?.done === "1"

  if (alreadyUnsubscribed) {
    return <UnsubscribedCard email={email} businessName={businessName} />
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <MailX className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-center">Unsubscribe</CardTitle>
          <CardDescription className="text-center">
            {businessName
              ? <>Stop receiving review-request emails from <strong>{businessName}</strong>.</>
              : <>Stop receiving future review-request emails for this address.</>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={confirmUnsubscribe} className="space-y-3">
            <input type="hidden" name="token" value={token} />
            <p className="text-sm text-muted-foreground text-center">
              Address: <code className="rounded bg-muted px-1">{email}</code>
            </p>
            <Button type="submit" className="w-full">
              Confirm unsubscribe
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function UnsubscribedCard({ email, businessName }: { email: string; businessName?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-700" />
          </div>
          <CardTitle className="text-center">You&apos;re unsubscribed</CardTitle>
          <CardDescription className="text-center">
            {businessName
              ? <>You won&apos;t receive any more review-request emails from <strong>{businessName}</strong>.</>
              : <>You won&apos;t receive any more review-request emails to this address.</>}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-xs text-muted-foreground">
          Address: <code className="rounded bg-muted px-1">{email}</code>
        </CardContent>
      </Card>
    </div>
  )
}
