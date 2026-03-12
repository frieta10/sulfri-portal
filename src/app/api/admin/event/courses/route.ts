import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { eventCourseSchema } from "@/lib/validations/event-registration"

// GET /api/admin/event/courses - List all courses with registration count (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const courses = await prisma.eventCourse.findMany({
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      include: {
        _count: {
          select: {
            selections: true,
          },
        },
      },
    })

    // Transform to include registration count
    const coursesWithCount = courses.map((course) => ({
      ...course,
      registrationCount: course._count.selections,
      _count: undefined,
    }))

    return NextResponse.json(coursesWithCount)
  } catch (error: any) {
    console.error("Error fetching courses:", error)
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 })
  }
}

// POST /api/admin/event/courses - Create a new course (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = eventCourseSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const data = validationResult.data

    const course = await prisma.eventCourse.create({
      data: {
        title: data.title,
        shortDescription: data.shortDescription,
        fullDescription: data.fullDescription,
        deliveryMode: data.deliveryMode,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        location: data.location,
        status: data.status,
        visibility: data.visibility,
        displayOrder: data.displayOrder,
      },
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error: any) {
    console.error("Error creating course:", error)
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 })
  }
}
