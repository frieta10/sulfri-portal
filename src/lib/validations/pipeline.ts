import { z } from "zod"

export const PipelineStatusEnum = z.enum([
  "NEW",
  "CONTACTED",
  "PROPOSAL_SENT",
  "NEGOTIATING",
  "CONVERTED",
  "LOST",
  "ARCHIVED",
])

export const LeadSourceEnum = z.enum([
  "PROPOSAL",
  "EVENT",
  "DIRECT_ENQUIRY",
])

// Schema for creating a new lead manually
export const createLeadSchema = z.object({
  contactName: z.string()
    .min(1, "Contact name is required")
    .max(200, "Contact name must be less than 200 characters"),
  email: z.string()
    .email("Invalid email address")
    .min(1, "Email is required"),
  organisation: z.string()
    .optional()
    .nullable(),
  topicInterest: z.string()
    .optional()
    .nullable(),
  source: LeadSourceEnum.default("DIRECT_ENQUIRY"),
  status: PipelineStatusEnum.default("NEW"),
  followUpDate: z.string()
    .optional()
    .nullable()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Invalid follow-up date",
    }),
  adminNotes: z.string()
    .optional()
    .nullable(),
})

export type CreateLeadInput = z.infer<typeof createLeadSchema>

// Schema for updating a lead
export const updateLeadSchema = z.object({
  contactName: z.string()
    .min(1, "Contact name is required")
    .max(200, "Contact name must be less than 200 characters")
    .optional(),
  email: z.string()
    .email("Invalid email address")
    .optional(),
  organisation: z.string()
    .optional()
    .nullable(),
  topicInterest: z.string()
    .optional()
    .nullable(),
  status: PipelineStatusEnum.optional(),
  followUpDate: z.string()
    .optional()
    .nullable()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Invalid follow-up date",
    }),
  adminNotes: z.string()
    .optional()
    .nullable(),
})

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>

// Schema for sending follow-up email
export const sendFollowUpSchema = z.object({
  subject: z.string()
    .min(1, "Subject is required")
    .max(500, "Subject must be less than 500 characters"),
  message: z.string()
    .min(1, "Message is required")
    .max(10000, "Message must be less than 10000 characters"),
})

export type SendFollowUpInput = z.infer<typeof sendFollowUpSchema>

// Pipeline filter schema
export const pipelineFilterSchema = z.object({
  status: PipelineStatusEnum.optional(),
  source: LeadSourceEnum.optional(),
  search: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
})

export type PipelineFilterInput = z.infer<typeof pipelineFilterSchema>
