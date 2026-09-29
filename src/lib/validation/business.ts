import { z } from "zod"

/**
 * Acceptable Google review URL patterns.
 * Google offers several ways to get your review link, and they don't all look the same.
 */
const GOOGLE_REVIEW_HOST_PATTERNS = [
  /^https?:\/\/(www\.)?g\.page\//i,                           // g.page short links
  /^https?:\/\/(www\.)?google\.com\/maps\//i,                  // maps links
  /^https?:\/\/(www\.)?search\.google\.com\/local\/writereview/i, // writereview links
  /^https?:\/\/(www\.)?maps\.app\.goo\.gl\//i,                 // maps.app.goo.gl short links
  /^https?:\/\/(www\.)?goo\.gl\/maps\//i,                      // older goo.gl/maps short links
]

export function isValidGoogleReviewUrl(url: string): boolean {
  try {
    const trimmed = url.trim()
    if (!trimmed) return false
    // Must be http(s)
    const u = new URL(trimmed)
    if (u.protocol !== "http:" && u.protocol !== "https:") return false
    return GOOGLE_REVIEW_HOST_PATTERNS.some((re) => re.test(trimmed))
  } catch {
    return false
  }
}

export const businessProfileSchema = z.object({
  name: z.string().min(1, "Business name is required").max(100),
  google_review_url: z
    .string()
    .min(1, "Google review link is required")
    .refine(isValidGoogleReviewUrl, {
      message:
        "That doesn't look like a valid Google review link. It should start with g.page, google.com/maps, search.google.com/local/writereview, or maps.app.goo.gl.",
    }),
  reply_to_email: z
    .string()
    .trim()
    .email("Reply-to email must be a valid email address")
    .max(255)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  contact_line: z.string().max(300).optional().or(z.literal("").transform(() => undefined)),
  mailing_address: z
    .string()
    .min(5, "A physical mailing address is required (CAN-SPAM compliance).")
    .max(500),
  timezone: z.string().min(1).default("Europe/London"),
})

export type BusinessProfileInput = z.infer<typeof businessProfileSchema>

export const onboardingStep1Schema = z.object({
  name: businessProfileSchema.shape.name,
  contact_line: businessProfileSchema.shape.contact_line,
  mailing_address: businessProfileSchema.shape.mailing_address,
  timezone: businessProfileSchema.shape.timezone,
})

export const onboardingStep2Schema = z.object({
  google_review_url: businessProfileSchema.shape.google_review_url,
  reply_to_email: businessProfileSchema.shape.reply_to_email,
})

export const onboardingStep3Schema = z.object({
  request_subject: z.string().min(1, "Subject is required").max(200),
  request_body: z.string().min(1, "Email body is required").max(5000),
})

export const sendTestEmailSchema = z.object({
  to: z.string().email("Please enter a valid email address"),
})
