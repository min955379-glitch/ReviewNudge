"use server"

import { requireBusiness } from "@/lib/supabase/require-user"
import type { Database } from "@/lib/supabase/database.types"
import { addCustomerSchema } from "@/lib/validation/customer"
import { sendToOne } from "@/app/app/requests/actions/requests"

type Customer = Database["public"]["Tables"]["customers"]["Row"]
type CustInsert = Database["public"]["Tables"]["customers"]["Insert"]
type CustUpdate = Database["public"]["Tables"]["customers"]["Update"]
type FieldErrors = Record<string, string | undefined>

type State = {
  success?: boolean
  errors?: FieldErrors
  values?: Record<string, string>
  added?: Customer
  sent?: boolean
  sendError?: string
} | null

type QueryRes<T = unknown> = { data: T; error: { message: string; code?: string } | null }
interface Chainable {
  select: (cols?: string) => Chainable
  insert: (values: unknown) => Chainable
  update: (values: unknown) => Chainable
  eq: (col: string, value: unknown) => Chainable
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
  formData.forEach((v, k) => { out[k] = typeof v === "string" ? v : "" })
  return out
}

function normalizeEmail(email: string | undefined | null): string | null {
  if (!email) return null
  const t = email.trim().toLowerCase()
  return t || null
}

export async function addAndSendCustomer(_prev: State, formData: FormData): Promise<State> {
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
  if (!emailNorm) {
    return { errors: { email: "An email is required to send a review request." }, values: raw }
  }

  let customer: Customer | null = null

  const existing = await sb
    .from("customers")
    .select("*")
    .eq("business_id", business.id)
    .eq("email", emailNorm)
    .maybeSingle()
  if (existing.data) {
    const c = existing.data as Customer
    if (c.unsubscribed) {
      return { errors: { email: "This customer has unsubscribed and cannot be emailed again." }, values: raw }
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
    customer = upd.data as Customer
  } else {
    const insert: CustInsert = {
      business_id: business.id,
      name: parsed.data.name,
      email: emailNorm,
      phone: parsed.data.phone || null,
      consent_confirmed: true,
      unsubscribed: false,
    }
    const res = await sb.from("customers").insert(insert).select().single()
    if (res.error) return { errors: { _form: res.error.message }, values: raw }
    customer = res.data as Customer
  }

  if (!customer) return { errors: { _form: "Failed to add customer." }, values: raw }

  // Now send the email
  const sendFd = new FormData()
  sendFd.set("customer_id", customer.id)
  const sendRes = await sendToOne(null, sendFd)
  const sendErr = sendRes?.errors?._form ?? sendRes?.errors?.customer_id

  return {
    success: true,
    added: customer,
    sent: !sendErr,
    sendError: sendErr,
  }
}
