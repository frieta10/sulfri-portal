import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const runtime = "nodejs"
export const maxDuration = 30

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  try {
    console.log("Upload API called")
    
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log("Unauthorized upload attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("User authenticated:", session.user?.email)

    // Check if using Vercel Blob
    const hasVercelBlob = !!process.env.BLOB_READ_WRITE_TOKEN
    console.log("Vercel Blob configured:", hasVercelBlob)

    if (hasVercelBlob) {
      // Use Vercel Blob
      const { put } = await import("@vercel/blob")
      
      const formData = await request.formData()
      const file = formData.get("file") as File

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
      }

      console.log("File received:", file.name, file.type, file.size)

      // Validate
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed." },
          { status: 400 }
        )
      }

      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: "File too large. Maximum size is 5MB." },
          { status: 400 }
        )
      }

      // Upload to Vercel Blob
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
      const filename = `profiles/profile-${Date.now()}.${ext}`
      
      console.log("Uploading to Vercel Blob:", filename)
      
      const blob = await put(filename, file, {
        access: "public",
        addRandomSuffix: false,
      })

      console.log("Upload successful:", blob.url)
      return NextResponse.json({ url: blob.url })
      
    } else {
      // Local disk storage (fallback)
      const { writeFile, mkdir } = await import("fs/promises")
      const path = await import("path")
      const { existsSync } = await import("fs")

      const formData = await request.formData()
      const file = formData.get("file") as File

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
      }

      console.log("File received (local):", file.name, file.type, file.size)

      // Validate
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed." },
          { status: 400 }
        )
      }

      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: "File too large. Maximum size is 5MB." },
          { status: 400 }
        )
      }

      // Create directory
      const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles")
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true })
      }

      // Save file
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
      const filename = `profile-${Date.now()}.${ext}`
      const filepath = path.join(uploadDir, filename)

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filepath, buffer)

      const url = `/uploads/profiles/${filename}`
      console.log("Local upload successful:", url)
      return NextResponse.json({ url })
    }

  } catch (error: any) {
    console.error("Upload API error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    )
  }
}
