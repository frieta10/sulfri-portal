import path from "path"
import { writeFile, mkdir, unlink } from "fs/promises"

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
]

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "File type not allowed. Accepted: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG"
  }
  if (file.size > MAX_SIZE) {
    return "File too large. Maximum size is 10MB."
  }
  return null
}

function isVercelBlobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

export async function uploadFile(file: File): Promise<string> {
  if (isVercelBlobConfigured()) {
    return uploadToVercelBlob(file)
  }
  return uploadToLocalDisk(file)
}

export async function deleteFile(fileUrl: string): Promise<void> {
  if (isVercelBlobConfigured() && fileUrl.includes("blob.vercel-storage.com")) {
    return deleteFromVercelBlob(fileUrl)
  }
  return deleteFromLocalDisk(fileUrl)
}

// --- Vercel Blob Storage ---

async function uploadToVercelBlob(file: File): Promise<string> {
  const { put } = await import("@vercel/blob")

  const ext = path.extname(file.name)
  const safeName = file.name
    .replace(ext, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .substring(0, 50)
  const filename = `uploads/${safeName}_${Date.now()}${ext}`

  const blob = await put(filename, file, {
    access: "public",
    addRandomSuffix: false,
  })

  return blob.url
}

async function deleteFromVercelBlob(fileUrl: string): Promise<void> {
  const { del } = await import("@vercel/blob")
  await del(fileUrl)
}

// --- Local Disk Storage (development) ---

async function uploadToLocalDisk(file: File): Promise<string> {
  const uploadsDir = path.join(process.cwd(), "public", "uploads")
  await mkdir(uploadsDir, { recursive: true })

  const ext = path.extname(file.name)
  const safeName = file.name
    .replace(ext, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .substring(0, 50)
  const uniqueName = `${safeName}_${Date.now()}${ext}`
  const filePath = path.join(uploadsDir, uniqueName)

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  await writeFile(filePath, buffer)

  return `/uploads/${uniqueName}`
}

async function deleteFromLocalDisk(fileUrl: string): Promise<void> {
  const filePath = path.join(process.cwd(), "public", fileUrl)
  await unlink(filePath)
}
