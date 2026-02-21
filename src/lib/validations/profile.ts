import { z } from "zod"

export const profileSchema = z.object({
  displayName: z.string().min(1, "Display name is required").max(200),
  headline: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  linkedinUrl: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  locationBase: z.string().optional().nullable(),
  profilePhotoUrl: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
})

export type ProfileFormData = z.infer<typeof profileSchema>
