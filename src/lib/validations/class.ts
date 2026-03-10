import { z } from "zod"

// Schema for individual session dates (for segregated dates)
export const classSessionSchema = z.object({
  sessionDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid session date",
  }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Invalid time format (HH:MM)",
  }),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Invalid time format (HH:MM)",
  }),
})

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
  
  // New date scheduling fields
  dateType: z.enum(["STRAIGHT", "SEGREGATED"]).default("STRAIGHT"),
  numberOfDays: z.number().int().min(1, "Must have at least 1 day").max(30, "Maximum 30 days").default(1),
  
  // For straight dates - start and end datetime
  startDatetime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid start date",
  }),
  endDatetime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid end date",
  }),
  
  // For segregated dates - array of sessions
  sessions: z.array(classSessionSchema).optional(),
  
  notes: z.string().optional().nullable(),
  status: z.enum(["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"]).default("UPCOMING"),
  joinEnabled: z.boolean().default(true),
  showOnPublicProfile: z.boolean().default(true),
})

export const classSchema = classBaseSchema.refine(
  (data) => {
    // For straight dates, validate start < end
    if (data.dateType === "STRAIGHT") {
      const start = new Date(data.startDatetime)
      const end = new Date(data.endDatetime)
      return end > start
    }
    // For segregated dates, validate sessions count matches numberOfDays
    if (data.dateType === "SEGREGATED") {
      return data.sessions && data.sessions.length === data.numberOfDays
    }
    return true
  },
  {
    message: "End date must be after start date",
    path: ["endDatetime"],
  }
).refine(
  (data) => {
    // For segregated dates, validate all sessions have valid dates
    if (data.dateType === "SEGREGATED" && data.sessions) {
      return data.sessions.length === data.numberOfDays
    }
    return true
  },
  {
    message: "Number of sessions must match number of days",
    path: ["sessions"],
  }
)

export type ClassFormData = z.input<typeof classSchema>
export type ClassSessionData = z.input<typeof classSessionSchema>

// Schema for creating a class (without generated fields)
export const createClassSchema = classSchema

// Schema for updating a class (all fields optional)
export const updateClassSchema = classBaseSchema.partial()
