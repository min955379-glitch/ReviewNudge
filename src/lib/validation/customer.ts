import { z } from "zod"

export const addCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .max(255)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  phone: z.string().max(30).optional().or(z.literal("").transform(() => undefined)),
  consent_confirmed: z
    .union([z.literal("on"), z.literal("true"), z.boolean()])
    .refine((v) => v === "on" || v === "true" || v === true, {
      message: "You must confirm you have permission to contact this customer.",
    }),
})

export type AddCustomerInput = z.infer<typeof addCustomerSchema>

export const bulkImportSchema = z.object({
  consent_confirmed: z
    .union([z.literal("on"), z.literal("true"), z.boolean()])
    .refine((v) => v === "on" || v === "true" || v === true, {
      message:
        "You must confirm you have permission to contact all customers in this file.",
    }),
})
