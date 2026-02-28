import { z } from "zod"

export const VisibilityEnum = z.enum(["PUBLIC", "HIDDEN"])

// Schema for extracting Credly embed code data
export const credlyEmbedSchema = z.object({
  embedCode: z.string().min(1, "Embed code is required"),
})

export type CredlyEmbedInput = z.infer<typeof credlyEmbedSchema>

// Helper function to extract badge data from Credly embed code
export function extractCredlyEmbedData(embedCode: string) {
  // Extract data-share-badge-id
  const badgeIdMatch = embedCode.match(/data-share-badge-id="([^"]+)"/)
  const badgeId = badgeIdMatch?.[1] || ""

  // Extract width
  const widthMatch = embedCode.match(/data-iframe-width="([^"]+)"/)
  const width = parseInt(widthMatch?.[1] || "150", 10)

  // Extract height
  const heightMatch = embedCode.match(/data-iframe-height="([^"]+)"/)
  const height = parseInt(heightMatch?.[1] || "270", 10)

  // Extract host
  const hostMatch = embedCode.match(/data-share-badge-host="([^"]+)"/)
  const host = hostMatch?.[1] || "https://www.credly.com"

  // Validate extracted data
  if (!badgeId) {
    throw new Error("Could not extract badge ID from embed code. Make sure the embed code contains data-share-badge-id.")
  }

  // Security: Validate host is from allowed domains
  const allowedHosts = ["https://www.credly.com", "https://cdn.credly.com"]
  if (!allowedHosts.some(allowed => host.includes(allowed))) {
    throw new Error("Invalid host domain. Only Credly domains are allowed.")
  }

  return {
    badgeId,
    width,
    height,
    host,
  }
}

// Badge creation schema (manual mode)
export const badgeCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  slug: z.string().min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional().nullable(),
  issuer: z.string().min(1, "Issuer is required").max(200, "Issuer must be less than 200 characters"),
  issueDate: z.string().datetime().optional().nullable(),
  expiryDate: z.string().datetime().optional().nullable(),
  credlyBadgeId: z.string().min(1, "Credly Badge ID is required").max(100),
  credlyHost: z.string().url().default("https://www.credly.com"),
  iframeWidth: z.number().int().min(50).max(500).default(150),
  iframeHeight: z.number().int().min(100).max(600).default(270),
  verificationUrl: z.string().url().optional().nullable(),
  featured: z.boolean().default(false),
  visibility: VisibilityEnum.default("PUBLIC"),
  displayOrder: z.number().int().default(0),
  fallbackImageUrl: z.string().url().optional().nullable(),
  embedCode: z.string().optional().nullable(),
  skillIds: z.array(z.string()).default([]),
})

export type BadgeCreateInput = z.infer<typeof badgeUpdateSchema>

// Badge update schema
export const badgeUpdateSchema = badgeCreateSchema.partial().extend({
  id: z.string().min(1, "Badge ID is required"),
})

export type BadgeUpdateInput = z.infer<typeof badgeUpdateSchema>

// Batch import schema
export const badgeBatchImportSchema = z.object({
  embedCodes: z.array(z.string().min(1, "Embed code cannot be empty")).min(1, "At least one embed code is required"),
  defaultVisibility: VisibilityEnum.default("PUBLIC"),
  defaultFeatured: z.boolean().default(false),
})

export type BadgeBatchImportInput = z.infer<typeof badgeBatchImportSchema>

// Badge from embed code schema
export const badgeFromEmbedSchema = z.object({
  embedCode: z.string().min(1, "Embed code is required"),
  title: z.string().min(1, "Title is required").optional(),
  issuer: z.string().min(1, "Issuer is required").optional(),
  description: z.string().optional().nullable(),
  issueDate: z.string().datetime().optional().nullable(),
  expiryDate: z.string().datetime().optional().nullable(),
  verificationUrl: z.string().url().optional().nullable(),
  featured: z.boolean().default(false),
  visibility: VisibilityEnum.default("PUBLIC"),
  displayOrder: z.number().int().default(0),
  fallbackImageUrl: z.string().url().optional().nullable(),
  skillIds: z.array(z.string()).default([]),
})

export type BadgeFromEmbedInput = z.infer<typeof badgeFromEmbedSchema>

// Auto-sync configuration schema
export const credlySyncConfigSchema = z.object({
  credlyUserId: z.string().min(1, "Credly User ID is required").max(100),
  syncInterval: z.enum(["MANUAL", "DAILY", "WEEKLY"]).default("MANUAL"),
  autoCreateSkills: z.boolean().default(true),
})

export type CredlySyncConfigInput = z.infer<typeof credlySyncConfigSchema>

// Credly API response schemas
export const credlyApiBadgeSchema = z.object({
  id: z.string(),
  image_url: z.string().url(),
  issued_at_date: z.string().datetime(),
  badge_template: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    image_url: z.string().url(),
    skills: z.array(z.object({
      id: z.string().optional(),
      name: z.string(),
    })).optional(),
    issuer: z.object({
      name: z.string(),
    }).optional(),
  }),
  issuer: z.object({
    entities: z.array(z.object({
      entity: z.object({
        name: z.string(),
      }),
    })),
  }).optional(),
})

export type CredlyApiBadge = z.infer<typeof credlyApiBadgeSchema>

export const credlyApiResponseSchema = z.object({
  data: z.array(credlyApiBadgeSchema),
  metadata: z.object({
    total_count: z.number().optional(),
    current_page: z.number().optional(),
    total_pages: z.number().optional(),
  }).optional(),
})

export type CredlyApiResponse = z.infer<typeof credlyApiResponseSchema>

// Generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 100)
}

// Validate Credly User ID format
export function validateCredlyUserId(userId: string): boolean {
  // Credly user IDs typically contain letters, numbers, hyphens
  return /^[a-zA-Z0-9-]+$/.test(userId) && userId.length >= 3 && userId.length <= 50
}
