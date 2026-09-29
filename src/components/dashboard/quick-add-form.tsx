"use client"

import { useActionState, useEffect } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { quickAddAndSend } from "@/app/app/quick-add-action"
import { UserPlus, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

const initialState = null as Awaited<ReturnType<typeof quickAddAndSend>>

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
        </>
      ) : (
        <>
          <UserPlus className="mr-2 h-4 w-4" /> Add & send
        </>
      )}
    </Button>
  )
}

export function QuickAddForm() {
  const [state, formAction] = useActionState(quickAddAndSend, initialState)

  // Reset form on success so next customer can be added immediately
  useEffect(() => {
    if (state?.success) {
      const form = document.getElementById("quick-add-form") as HTMLFormElement | null
      form?.reset()
    }
  }, [state?.success])

  return (
    <form id="quick-add-form" action={formAction} className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Add a customer and instantly send them a review request.
      </p>

      {state?.success && (
        <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-2 text-sm text-green-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            {state.sent
              ? <>Review request sent to <strong>{state.customerName}</strong>.</>
              : <>{state.customerName} added, but send failed: {state.sendError}</>}
          </div>
        </div>
      )}

      {state?.errors?._form && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>{state.errors._form}</div>
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="qa-name">Customer name</Label>
        <Input
          id="qa-name"
          name="name"
          placeholder="Alex Smith"
          autoComplete="off"
          defaultValue={state?.values?.name ?? ""}
          aria-invalid={!!state?.errors?.name}
        />
        {state?.errors?.name && (
          <p className="text-xs text-destructive">{state.errors.name}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="qa-email">Email</Label>
        <Input
          id="qa-email"
          name="email"
          type="email"
          placeholder="alex@example.com"
          autoComplete="off"
          defaultValue={state?.values?.email ?? ""}
          aria-invalid={!!state?.errors?.email}
        />
        {state?.errors?.email && (
          <p className="text-xs text-destructive">{state.errors.email}</p>
        )}
      </div>

      <div className="flex items-start gap-2">
        <Checkbox id="qa-consent" name="consent_confirmed" className="mt-0.5" />
        <Label htmlFor="qa-consent" className="text-xs font-normal leading-snug text-muted-foreground">
          I have permission to email this customer a review request.
        </Label>
      </div>
      {state?.errors?.consent_confirmed && (
        <p className="text-xs text-destructive">{state.errors.consent_confirmed}</p>
      )}

      <SubmitButton />
    </form>
  )
}
