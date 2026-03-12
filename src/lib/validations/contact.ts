import { z } from "zod"

export const contactFormSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(200, "Name must be less than 200 characters"),
  email: z.string()
    .email("Invalid email address")
    .min(1, "Email is required"),
  phone: z.string()
    .optional()
    .nullable()
    .transform((val) => val === "" ? null : val)
    .pipe(z.string().nullable().optional()),
  organisation: z.string()
    .optional()
    .nullable()
    .transform((val) => val === "" ? null : val)
    .pipe(z.string().nullable().optional()),
  message: z.string()
    .min(1, "Message is required")
    .max(5000, "Message must be less than 5000 characters"),
  consentFlag: z.boolean()
    .refine((val) => val === true, {
      message: "You must consent to data collection and usage",
    }),
})

export type ContactFormData = z.infer<typeof contactFormSchema>
