import { z } from "zod"

export const registrationSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(200),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  organization: z.string().optional().nullable(),
  consentFlag: z.boolean().refine((val) => val === true, {
    message: "You must consent to data collection and usage",
  }),
})

export type RegistrationFormData = z.infer<typeof registrationSchema>
