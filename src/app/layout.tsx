import type { Metadata } from "next"
import { headers } from "next/headers"
import { AlertCircle } from "lucide-react"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "ReviewNudge — Send review requests in 10 seconds",
    template: "%s | ReviewNudge",
  },
  description:
    "Send Google review requests to your customers in 10 seconds. Automatic reminders, click tracking, and compliance-friendly emails.",
}

async function SetupBanner() {
  const h = await headers()
  if (h.get("x-reviewnudge-needs-setup") !== "1") return null

  const missing = []
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL")
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  if (!missing.length) return null

  return (
    <div className="border-b bg-amber-50 px-4 py-2 text-sm text-amber-900">
      <div className="mx-auto flex max-w-7xl items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">Setup required — Supabase not configured.</p>
          <p className="text-amber-800">
            Copy <code className="rounded bg-amber-100 px-1">.env.example</code> to{" "}
            <code className="rounded bg-amber-100 px-1">.env.local</code> and fill in{" "}
            <code className="rounded bg-amber-100 px-1">{missing.join(", ")}</code>.
            Auth, database, and protected routes will work once a Supabase project is connected.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <SetupBanner />
        {children}
      </body>
    </html>
  )
}
