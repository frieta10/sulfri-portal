import { z } from "zod"

export const IndustrySectorEnum = z.enum([
  "TECHNOLOGY",
  "FINANCE",
  "HEALTHCARE",
  "MANUFACTURING",
  "EDUCATION",
  "GOVERNMENT",
  "RETAIL",
  "ENERGY",
  "CONSTRUCTION",
  "CONSULTING",
  "TELECOMMUNICATIONS",
  "TRANSPORTATION",
  "MEDIA",
  "NONPROFIT",
  "OTHER",
])

export const GroupSizeEnum = z.enum([
  "UNDER_20",
  "BETWEEN_20_50",
  "BETWEEN_50_100",
  "OVER_100",
])

export const DeliveryModeEnum = z.enum([
  "ONLINE",
  "PHYSICAL",
  "HYBRID",
])

export const TimelineEnum = z.enum([
  "ASAP",
  "ONE_MONTH",
  "THREE_MONTHS",
  "FLEXIBLE",
])

export const ProposalStatusEnum = z.enum([
  "NEW",
  "SENT",
  "FOLLOWED_UP",
  "CONVERTED",
  "LOST",
])

// Proposal submission schema
export const proposalSubmitSchema = z.object({
  contactName: z.string()
    .min(1, "Contact name is required")
    .max(200, "Contact name must be less than 200 characters"),
  organisation: z.string()
    .min(1, "Organisation name is required")
    .max(200, "Organisation name must be less than 200 characters"),
  email: z.string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(200, "Email must be less than 200 characters"),
  phone: z.string()
    .min(1, "Phone number is required")
    .max(50, "Phone number must be less than 50 characters"),
  industrySector: IndustrySectorEnum.optional().nullable(),
  topicInterest: z.string()
    .min(1, "Training topic is required")
    .max(200, "Topic must be less than 200 characters"),
  groupSize: GroupSizeEnum,
  deliveryMode: DeliveryModeEnum,
  preferredTimeline: TimelineEnum.optional().nullable(),
  additionalNotes: z.string()
    .max(2000, "Notes must be less than 2000 characters")
    .optional()
    .nullable(),
  consentFlag: z.boolean().refine((val) => val === true, {
    message: "You must consent to data collection and usage",
  }),
})

export type ProposalSubmitInput = z.infer<typeof proposalSubmitSchema>

// Proposal status update schema (admin)
export const proposalUpdateSchema = z.object({
  status: ProposalStatusEnum.optional(),
  adminNotes: z.string()
    .max(2000, "Notes must be less than 200 characters")
    .optional()
    .nullable(),
})

export type ProposalUpdateInput = z.infer<typeof proposalUpdateSchema>

// Check duplicate query schema
export const proposalCheckDuplicateSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export type ProposalCheckDuplicateInput = z.infer<typeof proposalCheckDuplicateSchema>

// Helper functions for display values
export function getIndustrySectorLabel(sector: string): string {
  const labels: Record<string, string> = {
    TECHNOLOGY: "Technology & IT",
    FINANCE: "Finance & Banking",
    HEALTHCARE: "Healthcare & Pharmaceuticals",
    MANUFACTURING: "Manufacturing & Engineering",
    EDUCATION: "Education & Training",
    GOVERNMENT: "Government & Public Sector",
    RETAIL: "Retail & Consumer Goods",
    ENERGY: "Energy & Utilities",
    CONSTRUCTION: "Construction & Real Estate",
    CONSULTING: "Consulting & Professional Services",
    TELECOMMUNICATIONS: "Telecommunications",
    TRANSPORTATION: "Transportation & Logistics",
    MEDIA: "Media & Entertainment",
    NONPROFIT: "Nonprofit & NGO",
    OTHER: "Other",
  }
  return labels[sector] || sector
}

export function getGroupSizeLabel(size: string): string {
  const labels: Record<string, string> = {
    UNDER_20: "Less than 20",
    BETWEEN_20_50: "20 - 50",
    BETWEEN_50_100: "50 - 100",
    OVER_100: "100+",
  }
  return labels[size] || size
}

export function getDeliveryModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    ONLINE: "Online / Virtual",
    PHYSICAL: "Physical / In-Person",
    HYBRID: "Hybrid (Online + Physical)",
  }
  return labels[mode] || mode
}

export function getTimelineLabel(timeline: string | null): string {
  if (!timeline) return "Not specified"
  const labels: Record<string, string> = {
    ASAP: "ASAP (Urgent)",
    ONE_MONTH: "Within 1 month",
    THREE_MONTHS: "Within 3 months",
    FLEXIBLE: "Flexible / TBD",
  }
  return labels[timeline] || timeline
}

export function getProposalStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    NEW: "New",
    SENT: "Proposal Sent",
    FOLLOWED_UP: "Followed Up",
    CONVERTED: "Converted",
    LOST: "Lost",
  }
  return labels[status] || status
}

export function getProposalStatusColor(status: string): string {
  const colors: Record<string, string> = {
    NEW: "bg-blue-100 text-blue-800",
    SENT: "bg-amber-100 text-amber-800",
    FOLLOWED_UP: "bg-purple-100 text-purple-800",
    CONVERTED: "bg-green-100 text-green-800",
    LOST: "bg-slate-100 text-slate-800",
  }
  return colors[status] || "bg-gray-100 text-gray-800"
}
