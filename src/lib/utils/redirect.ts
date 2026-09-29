import { redirect } from "next/navigation"

/**
 * Redirect with a query param message (type=error|success, message=...).
 */
export function encodedRedirect(
  type: "error" | "success",
  path: string,
  message: string
): never {
  const params = new URLSearchParams({ [type]: message })
  return redirect(`${path}?${params.toString()}`)
}
