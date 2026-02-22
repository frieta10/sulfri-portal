import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { deleteFile } from "@/lib/storage"

// PUT /api/downloads/[id] - Toggle visibility
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const download = await prisma.download.update({
      where: { id },
      data: {
        title: body.title,
        isPublic: body.isPublic,
      },
    })

    return NextResponse.json(download)
  } catch (error) {
    console.error("Error updating download:", error)
    return NextResponse.json(
      { error: "Failed to update download" },
      { status: 500 }
    )
  }
}

// DELETE /api/downloads/[id] - Delete a download
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const download = await prisma.download.findUnique({
      where: { id },
    })

    if (!download) {
      return NextResponse.json({ error: "Download not found" }, { status: 404 })
    }

    try {
      await deleteFile(download.fileUrl)
    } catch (err) {
      console.warn("Could not delete file from storage:", err)
    }

    await prisma.download.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Download deleted successfully" })
  } catch (error) {
    console.error("Error deleting download:", error)
    return NextResponse.json(
      { error: "Failed to delete download" },
      { status: 500 }
    )
  }
}
