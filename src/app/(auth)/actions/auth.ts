"use server"

import { encodedRedirect } from "@/lib/utils/redirect"
import { createSupabaseServerClient } from "@/lib/supabase"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

function isSupabaseConfigured() {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

export async function signUp(formData: FormData) {
  if (!isSupabaseConfigured()) {
    return encodedRedirect("error", "/signup", "Supabase is not configured yet.")
  }

  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const origin = (await headers()).get("origin") ?? ""

  if (!email || !password) {
    return encodedRedirect("error", "/signup", "Email and password are required.")
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    console.error(error)
    return encodedRedirect("error", "/signup", error.message)
  }

  return encodedRedirect(
    "success",
    "/signup",
    "Thanks for signing up! Check your email for a confirmation link."
  )
}

export async function signIn(formData: FormData) {
  if (!isSupabaseConfigured()) {
    return encodedRedirect("error", "/login", "Supabase is not configured yet.")
  }

  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    return encodedRedirect("error", "/login", "Email and password are required.")
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return encodedRedirect("error", "/login", error.message)
  }

  redirect("/app")
}

export async function signInWithGoogle() {
  "use server"
  if (!isSupabaseConfigured()) {
    return encodedRedirect("error", "/login", "Supabase is not configured yet.")
  }

  const origin = (await headers()).get("origin") ?? ""
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return encodedRedirect("error", "/login", error.message)
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signOut() {
  "use server"
  if (!isSupabaseConfigured()) {
    redirect("/login")
  }
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function forgotPassword(formData: FormData) {
  if (!isSupabaseConfigured()) {
    return encodedRedirect("error", "/forgot-password", "Supabase is not configured yet.")
  }

  const email = String(formData.get("email") ?? "").trim()
  const origin = (await headers()).get("origin") ?? ""

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required.")
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/app/settings`,
  })

  if (error) {
    return encodedRedirect("error", "/forgot-password", error.message)
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "If an account exists with that email, a password reset link has been sent."
  )
}
