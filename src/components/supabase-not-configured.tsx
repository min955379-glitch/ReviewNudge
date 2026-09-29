import { AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function SupabaseNotConfigured() {
  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <div className="mb-2 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <CardTitle>Supabase is not configured</CardTitle>
        </div>
        <CardDescription>
          Connect a Supabase project to enable authentication and the dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
          <li>
            Create a project at{" "}
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline"
            >
              supabase.com/dashboard
            </a>
            .
          </li>
          <li>
            Copy <code className="rounded bg-muted px-1">.env.example</code> to{" "}
            <code className="rounded bg-muted px-1">.env.local</code>.
          </li>
          <li>
            Fill in <code className="rounded bg-muted px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="rounded bg-muted px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> from
            your Supabase project&apos;s API settings.
          </li>
          <li>
            Apply the migration in{" "}
            <code className="rounded bg-muted px-1">supabase/migrations/00001_initial_schema.sql</code>{" "}
            via the Supabase SQL editor.
          </li>
          <li>Restart the dev server.</li>
        </ol>
      </CardContent>
    </Card>
  )
}
