"use server"

import { createSupabaseServiceClient } from "@/lib/supabase/server"
import { verifyToken } from "@/lib/utils/crypto"

export async function performUnsubscribe(token: string): Promise<{
  ok: boolean
  email?: string
  businessName?: string
}> {
  const payload = verifyToken(token)
  if (!payload || typeof payload.business_id !== "string" || typeof payload.email !== "string") {
    return { ok: false }
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false }
  }
  const supabase = await createSupabaseServiceClient()
  const { data: business } = await (supabase.from("businesses") as unknown as {
    select: (c: string) => { eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: unknown; error: unknown }> } }
  })
    .select("name")
    .eq("id", payload.business_id)
    .maybeSingle()
  // RLS policy "Public can unsubscribe customers" allows anon UPDATE here.
  await (supabase.from("customers") as unknown as {
    update: (v: Record<string, unknown>) => { eq: (c: string, v: unknown) => { eq: (c: string, v: unknown) => Promise<unknown> } }
  })
    .update({ unsubscribed: true })
    .eq("business_id", payload.business_id)
    .eq("email", payload.email.toLowerCase())
  return {
    ok: true,
    email: payload.email,
    businessName: (business as { name?: string } | null)?.name,
  }
}
