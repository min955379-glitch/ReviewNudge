"use client"

import { useActionState, useRef, useState } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { importCustomers } from "@/app/app/customers/actions/customers"

type ImportResult = {
  total: number
  created: number
  duplicates: number
  unsubscribedSkipped: number
  errors: { row: number; message: string }[]
}
type ServerActionFn = (
  prevState: unknown,
  formData: FormData
) => Promise<{ success?: boolean; errors?: Record<string, string | undefined>; result?: ImportResult } | null>

type ImportState = Awaited<ReturnType<ServerActionFn>>

export function CsvImportDialog({ onImported }: { onImported?: () => void }) {
  const [open, setOpen] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [state, action, pending] = useActionState<ImportState, FormData>(importCustomers as ServerActionFn, null)

  const success = !!state?.success
  const errors = state?.errors ?? {}

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Import customers from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV with columns like <code>name</code>, <code>email</code>,
            <code>phone</code>. We auto-detect common header names. Max 5 MB.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          {success && state?.result && (
            <Alert variant="success">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Import complete: {state.result.created} added, {state.result.duplicates}{" "}
                duplicates skipped, {state.result.unsubscribedSkipped} unsubscribed skipped
                {state.result.errors.length > 0 ? `, ${state.result.errors.length} row errors.` : "."}
              </AlertDescription>
            </Alert>
          )}
          {errors._form && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors._form}</AlertDescription>
            </Alert>
          )}
          {errors.csv_file && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.csv_file}</AlertDescription>
            </Alert>
          )}
          {errors.consent_confirmed && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.consent_confirmed}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="csv_file">CSV file *</Label>
            <input
              id="csv_file"
              ref={fileRef}
              name="csv_file"
              type="file"
              accept=".csv,text/csv"
              required
              className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground hover:file:bg-primary/90"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
            {fileName && <p className="text-xs text-muted-foreground">Selected: {fileName}</p>}
            <p className="text-xs text-muted-foreground">
              Recognised columns: <code>name</code>, <code>email</code>, <code>phone</code> (and
              common variations like <code>customer_name</code>, <code>email_address</code>,
              <code>mobile</code>).
            </p>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox id="csv_consent" name="consent_confirmed" required />
            <Label htmlFor="csv_consent" className="text-sm leading-snug font-normal">
              All customers in this file have done business with me and I have
              permission to contact them. *
            </Label>
          </div>

          {state?.result && state.result.errors.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-md border p-3 text-xs">
              <p className="mb-2 font-medium">Row errors:</p>
              <ul className="space-y-1">
                {state.result.errors.slice(0, 50).map((e, i) => (
                  <li key={i} className="text-destructive">
                    Row {e.row}: {e.message}
                  </li>
                ))}
                {state.result.errors.length > 50 && (
                  <li className="text-muted-foreground">
                    …and {state.result.errors.length - 50} more.
                  </li>
                )}
              </ul>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                if (success) onImported?.()
              }}
            >
              {success ? "Done" : "Cancel"}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Importing…" : "Import"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
