"use client"

import { useActionState, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, MoreHorizontal, RotateCw, Search } from "lucide-react"
import { resendRequest, markReviewed } from "./actions/requests"
import Link from "next/link"

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return "just now"
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  const mo = Math.floor(d / 30)
  return `${mo}mo ago`
}

type Res = {
  success?: boolean
  errors?: Record<string, string | undefined>
  message?: string
} | null

type RequestRow = {
  id: string
  customer_name: string | null
  customer_email: string
  status: "queued" | "sent" | "failed" | "clicked"
  first_clicked_at: string | null
  sent_at: string | null
  manually_marked_reviewed: boolean
  error_message: string | null
  created_at: string
}
const rowStatus = (r: RequestRow): "queued" | "sent" | "failed" | "clicked" | "reviewed" =>
  r.manually_marked_reviewed ? "reviewed" : r.status

interface Props { initialRequests: RequestRow[] }

type DisplayStatus = RequestRow["status"] | "reviewed"

function statusLabel(s: DisplayStatus) {
  switch (s) {
    case "queued": return "Queued"
    case "sent": return "Sent"
    case "failed": return "Failed"
    case "clicked": return "Link clicked"
    case "reviewed": return "Reviewed"
  }
}
function statusVariant(s: DisplayStatus): "destructive" | "outline" | "secondary" | "default" {
  switch (s) {
    case "queued": return "secondary"
    case "sent": return "default"
    case "failed": return "destructive"
    case "clicked": return "outline"
    case "reviewed": return "default"
  }
}

export function RequestsClient({ initialRequests }: Props) {
  const router = useRouter()
  const [requests] = useState<RequestRow[]>(initialRequests)
  const [q, setQ] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | DisplayStatus>("all")

  const [resendState, resendAction, resendPending] = useActionState<Res, FormData>(resendRequest, null)
  const [markState, markAction, markPending] = useActionState<Res, FormData>(markReviewed, null)

  useEffect(() => {
    if (resendState?.success || markState?.success) router.refresh()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resendState?.success, markState?.success])

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== "all" && rowStatus(r) !== statusFilter) return false
      if (!q.trim()) return true
      const s = q.trim().toLowerCase()
      return (
        r.customer_name?.toLowerCase().includes(s) ||
        r.customer_email.toLowerCase().includes(s)
      )
    })
  }, [requests, q, statusFilter])

  const counts = useMemo(() => {
    const c = { all: requests.length, sent: 0, clicked: 0, failed: 0, reviewed: 0, queued: 0 } as Record<string, number>
    for (const r of requests) { const s = rowStatus(r); c[s] = (c[s] ?? 0) + 1 }
    return c
  }, [requests])

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <h3 className="text-lg font-semibold">No requests yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Head to Customers to add people and send your first review request.
          </p>
          <Button asChild className="mt-4">
            <Link href="/app/customers">Go to Customers</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {(resendState?.success || markState?.success) && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{resendState?.message || markState?.message}</AlertDescription>
        </Alert>
      )}
      {(resendState?.errors?._form || markState?.errors?._form) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{resendState?.errors?._form || markState?.errors?._form}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {(["all", "sent", "clicked", "reviewed", "failed"] as const).map((k) => (
          <Button
            key={k}
            variant={statusFilter === k ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(k)}
          >
            {k.charAt(0).toUpperCase() + k.slice(1)}
            <Badge variant="secondary" className="ml-2">{counts[k]}</Badge>
          </Button>
        ))}
        <div className="ml-auto relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search…"
            className="pl-8 w-64"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No matching requests.</TableCell></TableRow>
              ) : filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.customer_name || "(no name)"}</div>
                    <div className="text-xs text-muted-foreground">{r.customer_email}</div>
                    {r.error_message && <div className="text-xs text-destructive mt-0.5">{r.error_message}</div>}
                  </TableCell>
                  <TableCell><Badge variant={statusVariant(rowStatus(r))}>{statusLabel(rowStatus(r))}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.sent_at ? timeAgo(r.sent_at) : timeAgo(r.created_at)}
                    {r.first_clicked_at && (
                      <div className="text-xs text-green-700">Clicked {timeAgo(r.first_clicked_at)}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {r.status === "failed" && (
                          <DropdownMenuItem asChild>
                            <form action={resendAction}>
                              <input type="hidden" name="request_id" value={r.id} />
                              <button type="submit" disabled={resendPending} className="flex w-full items-center gap-2">
                                <RotateCw className="h-4 w-4" /> Resend
                              </button>
                            </form>
                          </DropdownMenuItem>
                        )}
                        {!r.manually_marked_reviewed && (
                          <DropdownMenuItem asChild>
                            <form action={markAction}>
                              <input type="hidden" name="request_id" value={r.id} />
                              <button type="submit" disabled={markPending} className="flex w-full items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" /> Mark reviewed
                              </button>
                            </form>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        We can&apos;t see whether a customer actually left a Google review. &ldquo;Reviewed&rdquo; is a manual tag for your own tracking.
      </p>
    </div>
  )
}
