"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"
import { startCheckout } from "./actions"

function CTA({ label, variant }: { label: string; variant: "default" | "outline" }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" variant={variant} disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
      {pending ? "Redirecting…" : `Upgrade to ${label}`}
    </Button>
  )
}

export function CheckoutButton({
  plan,
  label,
  variant = "default",
}: {
  plan: string
  label: string
  variant?: "default" | "outline"
}) {
  const [state, formAction] = useActionState(startCheckout, null)
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="plan" value={plan} />
      <CTA label={label} variant={variant} />
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  )
}
