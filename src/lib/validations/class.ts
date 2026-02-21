import { z } from "zod"

const classBaseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  clientName: z.string().min(1, "Client name is required").max(200),
  clientType: z.enum(["INDIVIDUAL", "CORPORATE", "GOVERNMENT", "ACADEMIC"], {
    message: "Client type is required",
  }),
  topicCategory: z.string().min(1, "Topic category is required").max(200),
  mode: z.enum(["ONLINE", "IN_PERSON", "HYBRID"], {
    message: "Class mode is required",
  }),
  location: z.string().optional().nullable(),
  startDatetime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid start date",
  }),
  endDatetime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid end date",
  }),
  notes: z.string().optional().nullable(),
  status: z.enum(["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"]).default("UPCOMING"),
  joinEnabled: z.boolean().default(true),
  showOnPublicProfile: z.boolean().default(true),
})

export const classSchema = classBaseSchema.refine(
  (data) => {
    const start = new Date(data.startDatetime)
    const end = new Date(data.endDatetime)
    return end > start
  },
  {
    message: "End date must be after start date",
    path: ["endDatetime"],
  }
)

export type ClassFormData = z.input<typeof classSchema>

// Schema for creating a class (without generated fields)
export const createClassSchema = classSchema

// Schema for updating a class (all fields optional)
export const updateClassSchema = classBaseSchema.partial()
