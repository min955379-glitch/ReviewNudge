"use client"

import { useActionState, useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { addCustomer } from "@/app/app/customers/actions/customers"

// Action function signature expected by React 19 useActionState
type ServerActionFn = (
  prevState: unknown,
  formData: FormData
) => Promise<{ success?: boolean; errors?: Record<string, string | undefined>; values?: Record<string, string> } | null>

type ActionRes = Awaited<ReturnType<ServerActionFn>>

export function AddCustomerDialog({ onAdded }: { onAdded?: () => void }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<ActionRes, FormData>(addCustomer as ServerActionFn, null)
  const [andSend, setAndSend] = useState(false)

  const success = !!state?.success
  useEffect(() => {
    if (success && open) {
      const t = setTimeout(() => {
        setOpen(false)
        onAdded?.()
      }, 700)
      return () => clearTimeout(t)
    }
  }, [success, open, onAdded])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add customer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a customer</DialogTitle>
          <DialogDescription>
            They&apos;ll be saved to your list. You can send them a review request
            right away, or later.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          {state?.errors?._form && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.errors._form}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert variant="success">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Customer added.</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={state?.values?.name ?? ""}
              placeholder="e.g. Alex Johnson"
            />
            {state?.errors?.name && <p className="text-sm text-destructive">{state.errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={state?.values?.email ?? ""}
              placeholder="alex@example.com"
            />
            <p className="text-xs text-muted-foreground">
              Required to send a review request. You can add customers without an email
              (e.g. just a phone number for future features).
            </p>
            {state?.errors?.email && <p className="text-sm text-destructive">{state.errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={state?.values?.phone ?? ""}
              placeholder="+1 555 555 5555"
            />
          </div>

          <div className="flex items-start gap-2">
            <Checkbox id="consent_confirmed" name="consent_confirmed" defaultChecked required />
            <Label htmlFor="consent_confirmed" className="text-sm leading-snug font-normal">
              This customer has done business with me and I have permission to contact them. *
            </Label>
          </div>
          {state?.errors?.consent_confirmed && (
            <p className="text-sm text-destructive">{state.errors.consent_confirmed}</p>
          )}

          <div className="flex items-start gap-2">
            <Checkbox
              id="and_send"
              name="and_send"
              checked={andSend}
              onCheckedChange={(v) => setAndSend(v === true)}
            />
            <Label htmlFor="and_send" className="text-sm leading-snug font-normal">
              Send a review request immediately after adding (coming in Phase 4 — will
              show a preview for now).
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : andSend ? "Add and send" : "Add customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
