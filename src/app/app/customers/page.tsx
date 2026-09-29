import { redirect } from "next/navigation"
import { requireBusiness } from "@/lib/supabase/require-user"
import type { Database } from "@/lib/supabase/database.types"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CustomersClientWrapper } from "./customers-client"

type Customer = Database["public"]["Tables"]["customers"]["Row"]

export default async function CustomersPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
          <CardDescription>Configure Supabase to access customers.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const { supabase, business } = await requireBusiness()

  if (!business.google_review_url) {
    redirect(`/app/onboarding?step=${business.name ? 2 : 1}`)
  }

  const res = await supabase
    .from("customers")
    .select("*")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })

  const customers = (res.data as Customer[] | null) ?? []

  return <CustomersClientWrapper initialCustomers={customers} />
}
