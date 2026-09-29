"use server"

import { requireBusiness } from "@/lib/supabase/require-user"
import type { Database } from "@/lib/supabase/database.types"
import { addCustomerSchema } from "@/lib/validation/customer"
import { sendToOne } from "@/app/app/requests/actions/requests"

type Customer = Database["public"]["Tables"]["customers"]["Row"]
type FieldErrors = Record<string, string | undefined>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sb = any

type QuickAddState = {
  success?: boolean
  errors?: FieldErrors
  values?: Record<string, string>
  customerName?: string
  sent?: boolean
  sendError?: string
} | null

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

/**
 * Quick-add from the dashboard: add a customer by name + email and
 * immediately send them a review request. Uses the same consent/validation
 * rules as the Customers page add-and-send flow.
 */
export async function quickAddAndSend(
  _prev: QuickAddState,
  formData: FormData,
): Promise<QuickAddState> {
  const { supabase, business } = await requireBusiness()
  const sb = supabase as Sb

  const raw = toValues(formData)
  const parsed = addCustomerSchema.safeParse({
    name: raw.name,
    email: raw.email,
    phone: "",
    consent_confirmed: raw.consent_confirmed ? "on" : undefined,
  })
  if (!parsed.success) return { errors: flatten(parsed.error.flatten()), values: raw }

  const emailNorm = normalizeEmail(parsed.data.email)
  if (!emailNorm) {
    return { errors: { email: "Email is required to send a review request." }, values: raw }
  }

  let customer: Customer | null = null

  const existing = await sb
    .from("customers")
    .select("*")
    .eq("business_id", business.id)
    .eq("email", emailNorm)
    .maybeSingle()
  if (existing.error) return { errors: { _form: existing.error.message }, values: raw }

  if (existing.data) {
    const c = existing.data as Customer
    if (c.unsubscribed) {
      return { errors: { email: "This customer has unsubscribed and cannot be emailed." }, values: raw }
    }
    const upd = await sb
      .from("customers")
      .update({
        name: parsed.data.name,
        phone: null,
        consent_confirmed: true,
      })
      .eq("id", c.id)
      .select()
      .single()
    if (upd.error) return { errors: { _form: upd.error.message }, values: raw }
    customer = upd.data as Customer
  } else {
    const insert = {
      business_id: business.id,
      name: parsed.data.name,
      email: emailNorm,
      phone: null,
      consent_confirmed: true,
      unsubscribed: false,
    }
    const res = await sb.from("customers").insert(insert).select().single()
    if (res.error) return { errors: { _form: res.error.message }, values: raw }
    customer = res.data as Customer
  }

  if (!customer) return { errors: { _form: "Failed to add customer." }, values: raw }

  const sendFd = new FormData()
  sendFd.set("customer_id", customer.id)
  const sendRes = await sendToOne(null, sendFd)
  const sendErr = sendRes?.errors?._form ?? sendRes?.errors?.customer_id

  return {
    success: true,
    customerName: customer.name ?? emailNorm,
    sent: !sendErr,
    sendError: sendErr,
  }
}
