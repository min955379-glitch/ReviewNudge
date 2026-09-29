import Link from "next/link"
import { redirect } from "next/navigation"
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  Mail,
  Settings,
  Users,
  Send,
} from "lucide-react"
import { createSupabaseServerClient } from "@/lib/supabase"
import { signOut } from "../(auth)/actions/auth"
import { Button } from "@/components/ui/button"
import { SupabaseNotConfigured } from "@/components/supabase-not-configured"

const navItems = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/customers", label: "Customers", icon: Users },
  { href: "/app/requests", label: "Requests", icon: Send },
  { href: "/app/templates", label: "Templates", icon: Mail },
  { href: "/app/settings", label: "Settings", icon: Settings },
]

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Gracefully show a setup screen if Supabase env vars aren't configured yet.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <SupabaseNotConfigured />
      </div>
    )
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-2 border-b px-6 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BarChart3 className="h-4 w-4" />
          </div>
          <span>ReviewNudge</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-4">
          <div className="mb-2 px-2 text-xs text-muted-foreground">{user.email}</div>
          <form>
            <Button
              formAction={signOut}
              variant="outline"
              className="w-full justify-start gap-2"
              size="sm"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex h-16 items-center justify-between border-b px-4 md:px-6">
          <Link href="/app" className="flex items-center gap-2 font-semibold md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BarChart3 className="h-4 w-4" />
            </div>
            <span>ReviewNudge</span>
          </Link>
          <nav className="flex gap-2 overflow-x-auto md:hidden">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex min-w-fit items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-4 md:flex">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <form>
              <Button formAction={signOut} variant="ghost" size="sm">
                <LogOut className="mr-1 h-4 w-4" />
                Log out
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8">{children}</main>
      </div>
    </div>
  )
}
