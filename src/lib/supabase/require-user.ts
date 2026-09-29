import { createSupabaseServerClient } from "./server"
import { redirect } from "next/navigation"
import type { Database } from "./database.types"

type Business = Database["public"]["Tables"]["businesses"]["Row"]

export async function requireUser() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")
  return { supabase, user }
}

export async function requireBusiness() {
  const { supabase, user } = await requireUser()
  const result = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle()
  const business = result.data as Business | null
  if (!business) redirect("/app/onboarding")
  return { supabase, user, business }
}

export async function getUserBusiness() {
  const { supabase, user } = await requireUser()
  const result = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle()
  const business = result.data as Business | null
  return { supabase, user, business }
}
