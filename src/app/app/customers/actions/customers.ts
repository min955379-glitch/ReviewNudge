"use server"

import { requireBusiness } from "@/lib/supabase/require-user"
import type { Database } from "@/lib/supabase/database.types"
import { addCustomerSchema, bulkImportSchema } from "@/lib/validation/customer"

type Customer = Database["public"]["Tables"]["customers"]["Row"]
type CustInsert = Database["public"]["Tables"]["customers"]["Insert"]
type CustUpdate = Database["public"]["Tables"]["customers"]["Update"]
type FieldErrors = Record<string, string | undefined>

type AddState = {
  success?: boolean
  errors?: FieldErrors
  values?: Record<string, string>
  added?: Customer
} | null

type DeleteState = { error?: string } | null

type ImportResult = {
  total: number
  created: number
  duplicates: number
  unsubscribedSkipped: number
  errors: { row: number; message: string }[]
}
type ImportState = {
  success?: boolean
  errors?: FieldErrors
  result?: ImportResult
} | null

type QueryRes<T = unknown> = { data: T; error: { message: string; code?: string } | null }
interface Chainable {
  select: (cols?: string) => Chainable
  insert: (values: unknown) => Chainable
  update: (values: unknown) => Chainable
  delete: () => Chainable
  eq: (col: string, value: unknown) => Chainable
  order: (col: string, opts: { ascending: boolean }) => Chainable
  maybeSingle: () => Promise<QueryRes>
  single: () => Promise<QueryRes>
}
type Sb = { from: (table: string) => Chainable }

function flatten(err: { fieldErrors?: Record<string, string[] | undefined> }): FieldErrors {
  const out: FieldErrors = {}
  if (!err.fieldErrors) return out
  for (const [k, v] of Object.entries(err.fieldErrors)) {
    if (v && v.length) out[k] = v[0]
  }
  return out
}

function toValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {}
  formData.forEach((v, k) => {
    out[k] = typeof v === "string" ? v : ""
  })
  return out
}

function normalizeEmail(email: string | undefined | null): string | null {
  if (!email) return null
  const trimmed = email.trim().toLowerCase()
  return trimmed || null
}

export async function addCustomer(_prev: AddState, formData: FormData): Promise<AddState> {
  const { supabase, business } = await requireBusiness()
  const sb = supabase as unknown as Sb

  const raw = toValues(formData)
  const parsed = addCustomerSchema.safeParse({
    name: raw.name,
    email: raw.email,
    phone: raw.phone,
    consent_confirmed: raw.consent_confirmed ? "on" : undefined,
  })
  if (!parsed.success) return { errors: flatten(parsed.error.flatten()), values: raw }

  const emailNorm = normalizeEmail(parsed.data.email)

  if (emailNorm) {
    const existing = await sb
      .from("customers")
      .select("id, unsubscribed")
      .eq("business_id", business.id)
      .eq("email", emailNorm)
      .maybeSingle()
    if (existing.data) {
      const c = existing.data as Customer
      if (c.unsubscribed) {
        return {
          errors: { email: "This customer has unsubscribed and cannot be emailed again." },
          values: raw,
        }
      }
      const upd = await sb
        .from("customers")
        .update({
          name: parsed.data.name,
          phone: parsed.data.phone || null,
          consent_confirmed: true,
        } as CustUpdate)
        .eq("id", c.id)
        .select()
        .single()
      if (upd.error) return { errors: { _form: upd.error.message }, values: raw }
      return { success: true, added: upd.data as Customer }
    }
  }

  const insert: CustInsert = {
    business_id: business.id,
    name: parsed.data.name,
    email: emailNorm,
    phone: parsed.data.phone || null,
    consent_confirmed: true,
    unsubscribed: false,
  }

  const res = await sb.from("customers").insert(insert).select().single()
  if (res.error) {
    if (res.error.code === "23505") {
      return { errors: { email: "A customer with that email already exists." }, values: raw }
    }
    return { errors: { _form: res.error.message }, values: raw }
  }
  return { success: true, added: res.data as Customer }
}

export async function deleteCustomer(_prev: DeleteState, formData: FormData): Promise<DeleteState> {
  const { supabase, business } = await requireBusiness()
  const sb = supabase as unknown as Sb
  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Missing customer id" }
  // `.delete().eq()` resolves directly to { data, error } (no .single()/.maybeSingle())
  const res = (await sb.from("customers").delete().eq("id", id).eq("business_id", business.id)) as unknown as QueryRes
  if (res.error) return { error: res.error.message }
  return null
}

export async function importCustomers(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const { supabase, business } = await requireBusiness()
  const sb = supabase as unknown as Sb

  const consentRaw = formData.get("consent_confirmed")
  const consentParsed = bulkImportSchema.safeParse({ consent_confirmed: consentRaw ? "on" : undefined })
  if (!consentParsed.success) return { errors: flatten(consentParsed.error.flatten()) }

  const file = formData.get("csv_file")
  if (!(file instanceof File) || file.size === 0) {
    return { errors: { csv_file: "Please choose a CSV file to import." } }
  }
  if (file.size > 5 * 1024 * 1024) {
    return { errors: { csv_file: "CSV file must be under 5 MB." } }
  }

  const csvText = await file.text()
  const Papa = await import("papaparse")
  const parsed = Papa.default.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim().toLowerCase(),
  })

  const rows = parsed.data
  const result: ImportResult = {
    total: rows.length,
    created: 0,
    duplicates: 0,
    unsubscribedSkipped: 0,
    errors: [],
  }

  const existingRes = (await sb
    .from("customers")
    .select("id, email, unsubscribed")
    .eq("business_id", business.id)) as unknown as QueryRes<
    { id: string; email: string | null; unsubscribed: boolean }[]
  >
  const existingByEmail = new Map<string, { id: string; unsubscribed: boolean }>()
  if (existingRes.data) {
    for (const c of existingRes.data) {
      if (c.email) existingByEmail.set(c.email.toLowerCase(), { id: c.id, unsubscribed: c.unsubscribed })
    }
  }

  const toInsert: CustInsert[] = []

  rows.forEach((row, idx) => {
    const rowNum = idx + 2
    const nameKey = Object.keys(row).find((k) => ["name", "customer_name", "full_name", "fullname"].includes(k))
    const emailKey = Object.keys(row).find((k) => ["email", "email_address", "e-mail"].includes(k))
    const phoneKey = Object.keys(row).find((k) => ["phone", "phone_number", "mobile", "tel"].includes(k))

    const name = (nameKey ? row[nameKey] : "").trim()
    const email = (emailKey ? row[emailKey] : "").trim()
    const phone = phoneKey ? row[phoneKey].trim() : ""

    if (!name) { result.errors.push({ row: rowNum, message: "Missing name." }); return }
    if (!email) { result.errors.push({ row: rowNum, message: "Missing email." }); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      result.errors.push({ row: rowNum, message: `Invalid email: ${email}` }); return
    }

    const emailKeyNorm = email.toLowerCase()
    const existing = existingByEmail.get(emailKeyNorm)
    if (existing) {
      if (existing.unsubscribed) { result.unsubscribedSkipped++; return }
      result.duplicates++
      return
    }

    toInsert.push({
      business_id: business.id,
      name,
      email: emailKeyNorm,
      phone: phone || null,
      consent_confirmed: true,
      unsubscribed: false,
    })
    existingByEmail.set(emailKeyNorm, { id: "pending", unsubscribed: false })
  })

  if (toInsert.length > 0) {
    const res = (await sb.from("customers").insert(toInsert as unknown as never)) as unknown as QueryRes
    if (res.error) {
      return { errors: { _form: `Failed to import rows: ${res.error.message}` }, result }
    }
    result.created = toInsert.length
  }

  return { success: true, result }
}
