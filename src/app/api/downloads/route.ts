import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { validateFile, uploadFile } from "@/lib/storage"

// GET /api/downloads - List downloads
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const publicOnly = searchParams.get("public") === "true"

    const where: any = {}

    if (!session || publicOnly) {
      where.isPublic = true
    }

    const downloads = await prisma.download.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({ downloads })
  } catch (error) {
    console.error("Error fetching downloads:", error)
    return NextResponse.json(
      { error: "Failed to fetch downloads" },
      { status: 500 }
    )
  }
}

// POST /api/downloads - Upload a new file
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const title = formData.get("title") as string | null
    const isPublic = formData.get("isPublic") === "true"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const validationError = validateFile(file)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    // Upload file (Vercel Blob in production, local disk in development)
    const fileUrl = await uploadFile(file)

    const download = await prisma.download.create({
      data: {
        title: title.trim(),
        fileUrl,
        isPublic,
      },
    })

    return NextResponse.json(download, { status: 201 })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}
