import { z } from "zod"

// Testimonial creation schema
export const testimonialCreateSchema = z.object({
  quote: z.string()
    .min(1, "Quote is required")
    .max(2000, "Quote must be less than 2000 characters"),
  authorName: z.string()
    .min(1, "Author name is required")
    .max(100, "Author name must be less than 100 characters"),
  authorTitle: z.string()
    .max(100, "Author title must be less than 100 characters")
    .optional()
    .nullable(),
  authorOrganisation: z.string()
    .max(100, "Author organisation must be less than 100 characters")
    .optional()
    .nullable(),
  photoUrl: z.string()
    .url("Invalid photo URL")
    .max(500, "Photo URL must be less than 500 characters")
    .optional()
    .nullable(),
  rating: z.number()
    .int("Rating must be a whole number")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5")
    .optional()
    .nullable(),
  visibility: z.enum(["PUBLIC", "HIDDEN"]).default("PUBLIC"),
  displayOrder: z.number().int().default(0),
})

export type TestimonialCreateInput = z.infer<typeof testimonialCreateSchema>

// Testimonial update schema
export const testimonialUpdateSchema = testimonialCreateSchema.partial().extend({
  id: z.string().min(1, "Testimonial ID is required"),
})

export type TestimonialUpdateInput = z.infer<typeof testimonialUpdateSchema>
