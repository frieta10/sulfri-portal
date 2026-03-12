import { z } from "zod"

export const eventRegistrationSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(200),
  email: z.string().email("Invalid email address").max(255),
  phone: z.string().min(1, "Phone number is required").max(20),
  organisation: z.string().max(200).optional().nullable(),
  jobTitle: z.string().max(200).optional().nullable(),
  courseIds: z.array(z.string()).min(1, "Please select at least one course"),
  consentFlag: z.boolean().refine((val) => val === true, {
    message: "You must consent to data collection and usage",
  }),
  utmSource: z.string().max(100).optional().nullable(),
})

export type EventRegistrationFormData = z.infer<typeof eventRegistrationSchema>

// Schema for course creation/update
export const eventCourseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  shortDescription: z.string().max(500).optional().nullable(),
  fullDescription: z.string().optional().nullable(),
  deliveryMode: z.enum(["ONLINE", "PHYSICAL", "HYBRID"]),
  startDate: z.string().optional().nullable().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: "Invalid start date",
  }),
  endDate: z.string().optional().nullable().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: "Invalid end date",
  }),
  location: z.string().max(255).optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "COMPLETED", "RETIRED"]).default("DRAFT"),
  visibility: z.enum(["PUBLIC", "HIDDEN"]).default("PUBLIC"),
  displayOrder: z.number().int().default(0),
})

export type EventCourseFormData = z.infer<typeof eventCourseSchema>

// Schema for event settings
export const eventSettingsSchema = z.object({
  yayasanNoticeText: z.string().max(1000),
  registrationPageTitle: z.string().max(200),
  registrationPageTagline: z.string().max(500),
  duplicateCooldownHours: z.number().int().min(1).max(168).default(24),
})

export type EventSettingsFormData = z.infer<typeof eventSettingsSchema>
