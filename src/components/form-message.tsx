import { AlertCircle, CheckCircle2 } from "lucide-react"

export interface FormMessageProps {
  error?: string
  success?: string
}

export function FormMessage({ error, success }: FormMessageProps) {
  if (!error && !success) return null

  const isError = !!error
  const msg = error || success || ""

  return (
    <div
      className={
        "flex items-center gap-2 rounded-md p-3 text-sm " +
        (isError
          ? "bg-destructive/10 text-destructive"
          : "bg-green-50 text-green-700")
      }
    >
      {isError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
      <span>{decodeURIComponent(msg)}</span>
    </div>
  )
}
