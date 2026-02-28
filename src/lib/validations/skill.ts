import { z } from "zod"

export const VisibilityEnum = z.enum(["PUBLIC", "HIDDEN"])

// Skill creation schema
export const skillCreateSchema = z.object({
  name: z.string()
    .min(1, "Skill name is required")
    .max(100, "Skill name must be less than 100 characters"),
  slug: z.string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string()
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .nullable(),
  visibility: VisibilityEnum.default("PUBLIC"),
  displayOrder: z.number().int().default(0),
})

export type SkillCreateInput = z.infer<typeof skillCreateSchema>

// Skill update schema
export const skillUpdateSchema = skillCreateSchema.partial().extend({
  id: z.string().min(1, "Skill ID is required"),
})

export type SkillUpdateInput = z.infer<typeof skillUpdateSchema>

// Generate slug from skill name
export function generateSkillSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 100)
}

// Normalize skill name (capitalize first letter of each word)
export function normalizeSkillName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

// Skill with badge count (for API responses)
export const skillWithBadgeCountSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  visibility: VisibilityEnum,
  displayOrder: z.number(),
  badgeCount: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type SkillWithBadgeCount = z.infer<typeof skillWithBadgeCountSchema>
