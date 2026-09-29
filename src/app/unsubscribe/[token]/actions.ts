"use server"

import { performUnsubscribe } from "@/lib/email/unsubscribe"
import { redirect } from "next/navigation"

export async function confirmUnsubscribe(formData: FormData) {
  const token = String(formData.get("token") ?? "")
  await performUnsubscribe(token)
  redirect(`/unsubscribe/${encodeURIComponent(token)}?done=1`)
}
