import { z } from "zod"

export const downloadSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  isPublic: z.boolean().default(false),
})

export type DownloadFormData = z.infer<typeof downloadSchema>
