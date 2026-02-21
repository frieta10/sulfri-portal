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

    // Create the class
    const newClass = await prisma.class.create({
      data: {
        ...validatedData,
        startDatetime: new Date(validatedData.startDatetime),
        endDatetime: new Date(validatedData.endDatetime),
        joinCode,
      },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    })

    return NextResponse.json(newClass, { status: 201 })
  } catch (error: any) {
    console.error("Error creating class:", error)

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create class" },
      { status: 500 }
    )
  }
}
