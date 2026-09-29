import { createSupabaseServerClient } from "@/lib/supabase"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Send, Clock, MousePointerClick, Mail } from "lucide-react"

export default async function DashboardPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null // Layout shows the setup screen
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Check whether the user has completed business setup
  const { data: business }: { data: { id: string; name: string } | null } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("owner_id", user.id)
    .maybeSingle()

  if (!business) {
    redirect("/app/onboarding")
  }

  // Placeholder stats (real data will come in Phase 6)
  const stats = [
    { label: "Requests sent (30 days)", value: "0", icon: Send },
    { label: "Click rate", value: "—", icon: MousePointerClick },
    { label: "Reminders sent", value: "0", icon: Clock },
    { label: "Confirmed reviews", value: "0", icon: Mail },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {business.name}.</p>
        </div>
        <Button size="lg">
          <Send className="mr-2 h-4 w-4" />
          Send a request
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-md bg-primary/10 p-2">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-semibold">{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent activity placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>
            Customer activity and review request status will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-12 text-center">
            <Badge variant="secondary" className="mb-3">
              Phase 1
            </Badge>
            <p className="text-sm text-muted-foreground">
              Customers, requests, and activity are coming in later phases. Start by
              inviting a test customer once sending is built (Phase 4).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
