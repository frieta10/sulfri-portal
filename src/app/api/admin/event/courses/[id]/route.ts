import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { eventCourseSchema } from "@/lib/validations/event-registration"

// PATCH /api/admin/event/courses/[id] - Update a course (admin only)
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

    // Check if course exists
    const existingCourse = await prisma.eventCourse.findUnique({
      where: { id },
    })

    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Validate input (partial validation for PATCH)
    const validationResult = eventCourseSchema.partial().safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Build update data, converting date strings to Date objects if provided
    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription
    if (data.fullDescription !== undefined) updateData.fullDescription = data.fullDescription
    if (data.deliveryMode !== undefined) updateData.deliveryMode = data.deliveryMode
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null
    if (data.location !== undefined) updateData.location = data.location
    if (data.status !== undefined) updateData.status = data.status
    if (data.visibility !== undefined) updateData.visibility = data.visibility
    if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder

    const course = await prisma.eventCourse.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(course)
  } catch (error: any) {
    console.error("Error updating course:", error)
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 })
  }
}

// DELETE /api/admin/event/courses/[id] - Soft delete (retire) a course (admin only)
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

    // Check if course exists
    const existingCourse = await prisma.eventCourse.findUnique({
      where: { id },
    })

    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Soft delete by updating status to RETIRED
    const course = await prisma.eventCourse.update({
      where: { id },
      data: {
        status: "RETIRED",
        visibility: "HIDDEN",
      },
    })

    return NextResponse.json({ success: true, course })
  } catch (error: any) {
    console.error("Error retiring course:", error)
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to retire course" }, { status: 500 })
  }
}
