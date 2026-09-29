"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { AddCustomerDialog } from "@/components/customers/add-customer-dialog"
import { CsvImportDialog } from "@/components/customers/csv-import-dialog"
import { DeleteCustomerButton } from "@/components/customers/delete-customer-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Mail, Search, MailX, Users, Check, Loader2 } from "lucide-react"
import { sendBulk } from "../requests/actions/requests"
import { useActionState } from "react"

type Customer = {
  id: string
  name: string
  email: string | null
  phone: string | null
  consent_confirmed: boolean
  unsubscribed: boolean
  created_at: string
}

type SortKey = "name" | "email" | "created_at"
type SortDir = "asc" | "desc"

type BulkRes = {
  success?: boolean
  error?: string
  errors?: Record<string, string | undefined>
  sent?: number
  failed?: number
  skipped?: number
} | null

function SortButton({
  k,
  label,
  sortKey,
  sortDir,
  onToggle,
}: {
  k: SortKey
  label: string
  sortKey: SortKey
  sortDir: SortDir
  onToggle: (k: SortKey) => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 px-2 font-semibold uppercase tracking-wider text-xs text-muted-foreground hover:text-foreground"
      onClick={() => onToggle(k)}
    >
      {label}
      {sortKey === k && <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>}
    </Button>
  )
}

export function CustomersClientWrapper({ initialCustomers }: { initialCustomers: Customer[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [customers] = useState(initialCustomers)
  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("created_at")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const refresh = () => startTransition(() => { router.refresh() })

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(k); setSortDir("asc") }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = customers
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q) ||
          (c.phone ?? "").toLowerCase().includes(q),
      )
    }
    return [...list].sort((a, b) => {
      let av: string, bv: string
      if (sortKey === "created_at") { av = a.created_at; bv = b.created_at }
      else if (sortKey === "email") { av = a.email ?? ""; bv = b.email ?? "" }
      else { av = a.name; bv = b.name }
      if (av < bv) return sortDir === "asc" ? -1 : 1
      if (av > bv) return sortDir === "asc" ? 1 : -1
      return 0
    })
  }, [customers, query, sortKey, sortDir])

  const emailable = useMemo(
    () => filtered.filter((c) => c.email && !c.unsubscribed && c.consent_confirmed),
    [filtered],
  )
  const allEmailableSelected =
    emailable.length > 0 && emailable.every((c) => selected.has(c.id))

  function toggleAllEmailable() {
    if (allEmailableSelected) {
      const next = new Set(selected)
      emailable.forEach((c) => next.delete(c.id))
      setSelected(next)
    } else {
      const next = new Set(selected)
      emailable.forEach((c) => next.add(c.id))
      setSelected(next)
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const [bulkState, bulkAction, bulkPending] = useActionState<BulkRes, FormData>(
    async (_prev, fd) => {
      const res = await sendBulk(_prev, fd)
      if (res?.success) {
        setSelected(new Set())
        router.refresh()
      }
      return res
    },
    null,
  )

  function submitBulk() {
    const fd = new FormData()
    fd.set("customer_ids_json", JSON.stringify(Array.from(selected)))
    bulkAction(fd)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage the people you&apos;ve sent review requests to.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AddCustomerDialog onAdded={refresh} />
          <CsvImportDialog onImported={refresh} />
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search customers…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {bulkState?.success && (
        <Alert variant="success">
          <Check className="h-4 w-4" />
          <AlertDescription>
            Sent {bulkState.sent ?? 0} review request{bulkState.sent === 1 ? "" : "s"}.
            {bulkState.skipped ? ` ${bulkState.skipped} skipped (unsubscribed/missing email).` : ""}
            {bulkState.failed ? ` ${bulkState.failed} failed.` : ""}
          </AlertDescription>
        </Alert>
      )}
      {(bulkState?.error || bulkState?.errors?._form || bulkState?.errors?.customer_ids) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {bulkState.error || bulkState.errors?._form || bulkState.errors?.customer_ids}
          </AlertDescription>
        </Alert>
      )}

      {selected.size > 0 && (
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-lg border bg-background/95 px-4 py-2 shadow-sm backdrop-blur">
          <p className="text-sm">
            <strong>{selected.size}</strong> selected
          </p>
          <form action={submitBulk}>
            <Button type="submit" disabled={bulkPending} size="sm">
              {bulkPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              Send review request{selected.size === 1 ? "" : "s"}
            </Button>
          </form>
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            {customers.length} customer{customers.length === 1 ? "" : "s"}
          </CardTitle>
          <CardDescription>
            Tick the box to select, then click send. Unsubscribed customers can&apos;t be emailed.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-12 text-center">
              <Users className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">No customers yet</p>
              <p className="mb-4 text-sm text-muted-foreground">
                Add your first customer or import a CSV to get started.
              </p>
              <AddCustomerDialog onAdded={refresh} />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No customers match your search.
            </p>
          ) : (
            <div className="-mx-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        aria-label="Select all emailable"
                        checked={allEmailableSelected}
                        disabled={emailable.length === 0}
                        onCheckedChange={toggleAllEmailable}
                      />
                    </TableHead>
                    <TableHead>
                      <SortButton k="name" label="Name" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                    </TableHead>
                    <TableHead>
                      <SortButton k="email" label="Email" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                    </TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <SortButton k="created_at" label="Added" sortKey={sortKey} sortDir={sortDir} onToggle={toggleSort} />
                    </TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => {
                    const canEmail = !!c.email && !c.unsubscribed && c.consent_confirmed
                    const isSelected = selected.has(c.id)
                    return (
                      <TableRow key={c.id} data-state={isSelected ? "selected" : undefined} className={isSelected ? "bg-muted/50" : ""}>
                        <TableCell>
                          <Checkbox
                            aria-label={`Select ${c.name}`}
                            checked={isSelected}
                            disabled={!canEmail}
                            onCheckedChange={() => toggleOne(c.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {c.email || <span className="italic">—</span>}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {c.phone || <span className="italic">—</span>}
                        </TableCell>
                        <TableCell>
                          {c.unsubscribed ? (
                            <Badge variant="destructive" className="gap-1">
                              <MailX className="h-3 w-3" /> Unsubscribed
                            </Badge>
                          ) : c.consent_confirmed ? (
                            <Badge variant="success" className="gap-1">
                              <Check className="h-3 w-3" /> Consent
                            </Badge>
                          ) : (
                            <Badge variant="secondary">No consent</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DeleteCustomerButton id={c.id} onDeleted={() => {
                            setSelected((s) => { const n = new Set(s); n.delete(c.id); return n })
                            refresh()
                          }} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
