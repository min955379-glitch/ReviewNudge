import { redirect } from "next/navigation"
import Link from "next/link"
import { createSupabaseServerClient } from "@/lib/supabase"
import { Check } from "lucide-react"

const steps = [
  { n: 1, label: "Business info" },
  { n: 2, label: "Google review link" },
  { n: 3, label: "Your email template" },
]

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect("/app")
  }
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const bizResult = await supabase
    .from("businesses")
    .select("id, name, google_review_url")
    .eq("owner_id", user.id)
    .maybeSingle()
  const business: { id: string; name: string; google_review_url: string } | null =
    bizResult.data as { id: string; name: string; google_review_url: string } | null

  // Determine the furthest-unlocked step based on what's saved. The page itself
  // handles URL-based ?step= routing and redirects; the layout just needs to know
  // which steps are "done" for the stepper display.
  let current = 1
  if (!business) {
    current = 1
  } else if (!business.google_review_url) {
    current = 2
  } else {
    current = 3
  }

  // Note: the actual current step may be lower than `current` if the user is on a
  // previous step. Since layouts don't have access to searchParams in App Router,
  // we approximate here: the child page will display the correct content, and the
  // stepper shows steps up to the furthest unlocked as active. The stepper also
  // looks reasonable when visiting earlier steps (still shows them as done/active).

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Set up your business</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          It takes about 3 minutes. You can change everything later in Settings.
        </p>
      </div>

      <ol className="flex items-center justify-between gap-2">
        {steps.map((s, i) => {
          const done = s.n < current
          const active = s.n === current
          return (
            <li key={s.n} className="flex flex-1 items-center">
              <div className="flex items-center gap-2">
                <div
                  className={
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold " +
                    (done
                      ? "bg-primary text-primary-foreground"
                      : active
                        ? "border-2 border-primary bg-primary/10 text-primary"
                        : "border-2 border-border text-muted-foreground")
                  }
                >
                  {done ? <Check className="h-4 w-4" /> : s.n}
                </div>
                <span
                  className={
                    "hidden text-sm sm:inline " +
                    (active
                      ? "font-medium text-foreground"
                      : done
                        ? "text-foreground"
                        : "text-muted-foreground")
                  }
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={"mx-2 h-0.5 flex-1 " + (done ? "bg-primary" : "bg-border")} />
              )}
            </li>
          )
        })}
      </ol>

      <div>{children}</div>

      <p className="text-center text-xs text-muted-foreground">
        Need help?{" "}
        <Link
          href="https://support.google.com/business/answer/6216102"
          target="_blank"
          rel="noreferrer"
          className="text-primary underline"
        >
          How to get your Google review link
        </Link>
      </p>
    </div>
  )
}
