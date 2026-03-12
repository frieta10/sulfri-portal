import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for updating QR code
const updateQRCodeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  eventStartDate: z.string().datetime().optional().nullable(),
  eventEndDate: z.string().datetime().optional().nullable(),
  status: z.enum(["ACTIVE", "EXPIRED", "CLOSED"]).optional(),
})

// PATCH /api/admin/event/qr/[id] - Update QR code
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validation = updateQRCodeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { name, eventStartDate, eventEndDate, status } = validation.data

    // Build update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (eventStartDate !== undefined) updateData.eventStartDate = eventStartDate ? new Date(eventStartDate) : null
    if (eventEndDate !== undefined) updateData.eventEndDate = eventEndDate ? new Date(eventEndDate) : null
    if (status !== undefined) updateData.status = status

    const qrCode = await prisma.eventQRCode.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      qrCode,
      message: "QR code updated successfully",
    })
  } catch (error: any) {
    console.error("Error updating QR code:", error)
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "QR code not found" },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: error.message || "Failed to update QR code" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/event/qr/[id] - Delete QR code
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await prisma.eventQRCode.delete({
      where: { id },
    })

    return NextResponse.json({
      message: "QR code deleted successfully",
    })
  } catch (error: any) {
    console.error("Error deleting QR code:", error)
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "QR code not found" },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: error.message || "Failed to delete QR code" },
      { status: 500 }
    )
  }
}
