import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createClassSchema } from "@/lib/validations/class"
import { generateUniqueJoinCode } from "@/lib/utils/generate-code"

// GET /api/classes - List all classes with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    const where: any = {}

    // Filter by status if provided
    if (status && status !== "all") {
      where.status = status
    }

    // Search by title or client name
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { clientName: { contains: search, mode: "insensitive" } },
      ]
    }

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        include: {
          _count: {
            select: { registrations: true },
          },
          sessions: {
            orderBy: { displayOrder: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.class.count({ where }),
    ])

    return NextResponse.json({
      classes,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Error fetching classes:", error)
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    )
  }
}

// Helper function to convert session date and time to DateTime
function sessionToDateTime(sessionDate: string, time: string): Date {
  const date = new Date(sessionDate)
  const [hours, minutes] = time.split(":").map(Number)
  date.setHours(hours, minutes, 0, 0)
  return date
}

// POST /api/classes - Create a new class
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate the request body
    const validatedData = createClassSchema.parse(body)

    // Generate a unique join code
    const joinCode = await generateUniqueJoinCode(prisma)

    // Prepare base class data
    const classData: any = {
      title: validatedData.title,
      clientName: validatedData.clientName,
      clientType: validatedData.clientType,
      topicCategory: validatedData.topicCategory,
      mode: validatedData.mode,
      location: validatedData.location,
      dateType: validatedData.dateType,
      numberOfDays: validatedData.numberOfDays,
      notes: validatedData.notes,
      status: validatedData.status,
      joinEnabled: validatedData.joinEnabled,
      showOnPublicProfile: validatedData.showOnPublicProfile,
      joinCode,
    }

    // Handle dates based on date type
    if (validatedData.dateType === "STRAIGHT") {
      // For straight dates, use provided start and end datetimes
      classData.startDatetime = new Date(validatedData.startDatetime)
      classData.endDatetime = new Date(validatedData.endDatetime)
    } else if (validatedData.dateType === "SEGREGATED" && validatedData.sessions) {
      // For segregated dates, calculate start and end from sessions
      const sortedSessions = [...validatedData.sessions].sort((a, b) => 
        new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime()
      )
      
      const firstSession = sortedSessions[0]
      const lastSession = sortedSessions[sortedSessions.length - 1]
      
      classData.startDatetime = sessionToDateTime(firstSession.sessionDate, firstSession.startTime)
      classData.endDatetime = sessionToDateTime(lastSession.sessionDate, lastSession.endTime)
      
      // Prepare sessions for creation
      classData.sessions = {
        create: sortedSessions.map((session, index) => ({
          sessionDate: new Date(session.sessionDate),
          startTime: session.startTime,
          endTime: session.endTime,
          displayOrder: index,
        })),
      }
    }

    // Create the class
    const newClass = await prisma.class.create({
      data: classData,
      include: {
        _count: {
          select: { registrations: true },
        },
        sessions: {
          orderBy: { displayOrder: "asc" },
        },
      },
    })

    return NextResponse.json(newClass, { status: 201 })
  } catch (error: any) {
    console.error("Error creating class:", error)

    if (error.name === "ZodError") {
      console.error("Zod validation errors:", JSON.stringify(error.errors, null, 2))
      return NextResponse.json(
        { message: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: error.message || "Failed to create class" },
      { status: 500 }
    )
  }
}
