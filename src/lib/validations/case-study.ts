import { z } from "zod"

// Case study creation schema
export const caseStudyCreateSchema = z.object({
  clientLabel: z.string()
    .min(1, "Client label is required")
    .max(100, "Client label must be less than 100 characters"),
  trainingTopic: z.string()
    .min(1, "Training topic is required")
    .max(200, "Training topic must be less than 200 characters"),
  participantCount: z.number()
    .int("Participant count must be a whole number")
    .min(0, "Participant count must be non-negative")
    .optional()
    .nullable(),
  durationText: z.string()
    .max(50, "Duration text must be less than 50 characters")
    .optional()
    .nullable(),
  outcomeSummary: z.string()
    .max(200, "Outcome summary must be less than 200 characters")
    .optional()
    .nullable(),
  studyDate: z.string()
    .datetime()
    .optional()
    .nullable()
    .transform((val) => val ? new Date(val) : null),
  visibility: z.enum(["PUBLIC", "HIDDEN"]).default("PUBLIC"),
  displayOrder: z.number().int().default(0),
})

export type CaseStudyCreateInput = z.infer<typeof caseStudyCreateSchema>

// Case study update schema
export const caseStudyUpdateSchema = caseStudyCreateSchema.partial().extend({
  id: z.string().min(1, "Case study ID is required"),
})

export type CaseStudyUpdateInput = z.infer<typeof caseStudyUpdateSchema>
