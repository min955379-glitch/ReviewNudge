"use client"

import { useActionState, useEffect, useCallback } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteCustomer } from "@/app/app/customers/actions/customers"

type DeleteActionFn = (
  prevState: unknown,
  formData: FormData
) => Promise<{ error?: string } | null>

export function DeleteCustomerButton({
  id,
  onDeleted,
}: {
  id: string
  onDeleted?: () => void
}) {
  const [state, action, pending] = useActionState(deleteCustomer as DeleteActionFn, null)

  useEffect(() => {
    if (!state?.error && !pending && state !== null) {
      onDeleted?.()
    }
  }, [state, pending, onDeleted])

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!confirm("Delete this customer? This cannot be undone.")) e.preventDefault()
  }, [])

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <DeleteButton type="submit" variant="ghost" size="sm" disabled={pending} onClick={handleClick}>
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Delete</span>
      </DeleteButton>
    </form>
  )
}

// Separate component reference to satisfy the static-components rule (don't create
// new component types inside render via anonymous closures).
const DeleteButton = Button
