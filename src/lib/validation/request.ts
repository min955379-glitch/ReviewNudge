import { z } from "zod"

export const sendRequestSchema = z.object({
  customer_id: z.string().uuid("Invalid customer id"),
})

export const bulkSendSchema = z.object({
  customer_ids: z
    .array(z.string().uuid())
    .min(1, "Select at least one customer")
    .max(500, "Cannot bulk send to more than 500 customers at once"),
})

export const updateTemplateSchema = z.object({
  kind: z.enum(["request", "reminder"]),
  subject: z.string().min(1, "Subject is required").max(200),
  body: z.string().min(1, "Email body is required").max(5000),
})

export const markReviewedSchema = z.object({
  request_id: z.string().uuid(),
})
