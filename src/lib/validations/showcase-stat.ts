import { z } from "zod"

// Valid stat keys
export const validStatKeys = [
  "classes_completed",
  "hours_delivered",
  "participants_trained",
  "unique_clients",
] as const

export type StatKey = typeof validStatKeys[number]

// Showcase stat update schema
export const showcaseStatUpdateSchema = z.object({
  statKey: z.enum(validStatKeys),
  statValue: z.number()
    .int("Stat value must be a whole number")
    .min(0, "Stat value must be non-negative"),
  label: z.string()
    .min(1, "Label is required")
    .max(100, "Label must be less than 100 characters"),
})

export type ShowcaseStatUpdateInput = z.infer<typeof showcaseStatUpdateSchema>

// Showcase stat response schema
export const showcaseStatSchema = z.object({
  id: z.string(),
  statKey: z.enum(validStatKeys),
  statValue: z.number(),
  label: z.string(),
  updatedAt: z.string().datetime(),
})

export type ShowcaseStat = z.infer<typeof showcaseStatSchema>
