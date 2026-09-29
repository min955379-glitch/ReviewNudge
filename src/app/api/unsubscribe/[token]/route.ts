import { performUnsubscribe } from "@/lib/email/unsubscribe"

// List-Unsubscribe-Post: List-Unsubscribe=One-Click (RFC 8058)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const body: Record<string, string> = {}
  try {
    const text = await request.text()
    const params = new URLSearchParams(text)
    params.forEach((v, k) => { body[k] = v })
  } catch { /* ignore */ }

  if (body["List-Unsubscribe"] !== "One-Click") {
    return new Response("Missing List-Unsubscribe=One-Click", { status: 400 })
  }

  const result = await performUnsubscribe(token)
  if (!result.ok) {
    return new Response("Invalid unsubscribe token", { status: 404 })
  }
  return new Response("Unsubscribed", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
