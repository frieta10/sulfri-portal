import { z } from "zod"

// Valid event types for analytics tracking
export const validEventTypes = [
  "pdf_download",
  "whatsapp_click",
  "proposal_submit",
  "page_view",
  "button_click",
  "link_click",
  "contact_click",
  "badge_view",
  "skill_view",
  "case_study_view",
  "testimonial_view",
] as const

export type EventType = typeof validEventTypes[number]

// Helper for enum validation using union of literals (more compatible with Zod 4)
const eventTypeSchema = z.union([
  z.literal("pdf_download"),
  z.literal("whatsapp_click"),
  z.literal("proposal_submit"),
  z.literal("page_view"),
  z.literal("button_click"),
  z.literal("link_click"),
  z.literal("contact_click"),
  z.literal("badge_view"),
  z.literal("skill_view"),
  z.literal("case_study_view"),
  z.literal("testimonial_view"),
])

// Analytics event tracking schema
export const analyticsEventSchema = z.object({
  eventType: eventTypeSchema,
  eventData: z.record(z.string(), z.unknown()).optional().nullable(),
  referrerUrl: z.string()
    .max(1000, "Referrer URL must be less than 1000 characters")
    .optional()
    .nullable(),
})

export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>

// Analytics event response schema
export const analyticsEventResponseSchema = z.object({
  id: z.string(),
  eventType: eventTypeSchema,
  eventData: z.record(z.string(), z.unknown()).nullable(),
  referrerUrl: z.string().nullable(),
  userAgent: z.string().nullable(),
  ipHash: z.string().nullable(),
  createdAt: z.string().datetime(),
})

export type AnalyticsEventResponse = z.infer<typeof analyticsEventResponseSchema>
