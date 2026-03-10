import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateClassSchema } from "@/lib/validations/class"

// Helper function to convert session date and time to DateTime
function sessionToDateTime(sessionDate: string, time: string): Date {
  const date = new Date(sessionDate)
  const [hours, minutes] = time.split(":").map(Number)
  date.setHours(hours, minutes, 0, 0)
  return date
}

// GET /api/classes/[id] - Get a single class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const classItem = await prisma.class.findUnique({
      where: { id },
      include: {
        _count: {
          select: { registrations: true },
        },
        sessions: {
          orderBy: { displayOrder: "asc" },
        },
      },
    })

    if (!classItem) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    return NextResponse.json(classItem)
  } catch (error) {
    console.error("Error fetching class:", error)
    return NextResponse.json(
      { error: "Failed to fetch class" },
      { status: 500 }
    )
  }
}

// PUT /api/classes/[id] - Update a class
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
    const validatedData = updateClassSchema.parse(body)

    const existingClass = await prisma.class.findUnique({
      where: { id },
      include: { sessions: true },
    })

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}

    // Copy basic fields
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.clientName !== undefined) updateData.clientName = validatedData.clientName
    if (validatedData.clientType !== undefined) updateData.clientType = validatedData.clientType
    if (validatedData.topicCategory !== undefined) updateData.topicCategory = validatedData.topicCategory
    if (validatedData.mode !== undefined) updateData.mode = validatedData.mode
    if (validatedData.location !== undefined) updateData.location = validatedData.location
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.joinEnabled !== undefined) updateData.joinEnabled = validatedData.joinEnabled
    if (validatedData.showOnPublicProfile !== undefined) updateData.showOnPublicProfile = validatedData.showOnPublicProfile

    // Handle date type and number of days
    if (validatedData.dateType !== undefined) updateData.dateType = validatedData.dateType
    if (validatedData.numberOfDays !== undefined) updateData.numberOfDays = validatedData.numberOfDays

    // Handle dates based on date type
    if (validatedData.dateType === "STRAIGHT") {
      // For straight dates, use provided start and end datetimes
      if (validatedData.startDatetime) {
        updateData.startDatetime = new Date(validatedData.startDatetime)
      }
      if (validatedData.endDatetime) {
        updateData.endDatetime = new Date(validatedData.endDatetime)
      }
      
      // Delete all existing sessions since we're using straight dates
      if (existingClass.sessions.length > 0) {
        await prisma.classSession.deleteMany({
          where: { classId: id },
        })
      }
    } else if (validatedData.dateType === "SEGREGATED" && validatedData.sessions) {
      // For segregated dates, calculate start and end from sessions
      const sortedSessions = [...validatedData.sessions].sort((a, b) => 
        new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime()
      )
      
      const firstSession = sortedSessions[0]
      const lastSession = sortedSessions[sortedSessions.length - 1]
      
      updateData.startDatetime = sessionToDateTime(firstSession.sessionDate, firstSession.startTime)
      updateData.endDatetime = sessionToDateTime(lastSession.sessionDate, lastSession.endTime)
      
      // Delete existing sessions and create new ones
      await prisma.classSession.deleteMany({
        where: { classId: id },
      })
      
      updateData.sessions = {
        create: sortedSessions.map((session, index) => ({
          sessionDate: new Date(session.sessionDate),
          startTime: session.startTime,
          endTime: session.endTime,
          displayOrder: index,
        })),
      }
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { registrations: true },
        },
        sessions: {
          orderBy: { displayOrder: "asc" },
        },
      },
    })

    return NextResponse.json(updatedClass)
  } catch (error: any) {
    console.error("Error updating class:", error)

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update class" },
      { status: 500 }
    )
  }
}

// DELETE /api/classes/[id] - Delete a class
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

    const existingClass = await prisma.class.findUnique({
      where: { id },
    })

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    await prisma.class.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Class deleted successfully" })
  } catch (error) {
    console.error("Error deleting class:", error)
    return NextResponse.json(
      { error: "Failed to delete class" },
      { status: 500 }
    )
  }
}
