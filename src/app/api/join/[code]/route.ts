import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { registrationSchema } from "@/lib/validations/registration"
import { checkRateLimit } from "@/lib/utils/rate-limit"

// GET /api/join/[code] - Get class info by join code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    const classItem = await prisma.class.findUnique({
      where: { joinCode: code },
      select: {
        id: true,
        title: true,
        clientName: true,
        topicCategory: true,
        mode: true,
        location: true,
        startDatetime: true,
        endDatetime: true,
        status: true,
        joinEnabled: true,
        _count: {
          select: { registrations: true },
        },
      },
    })

    if (!classItem) {
      return NextResponse.json(
        { error: "Invalid join code. This class does not exist." },
        { status: 404 }
      )
    }

    if (!classItem.joinEnabled) {
      return NextResponse.json(
        { error: "Registration is currently closed for this class." },
        { status: 403 }
      )
    }

    if (classItem.status === "COMPLETED" || classItem.status === "CANCELLED") {
      return NextResponse.json(
        { error: `This class has been ${classItem.status.toLowerCase()}.` },
        { status: 403 }
      )
    }

    return NextResponse.json({
      class: classItem,
    })
  } catch (error) {
    console.error("Error fetching class by join code:", error)
    return NextResponse.json(
      { error: "Failed to fetch class information" },
      { status: 500 }
    )
  }
}

// POST /api/join/[code] - Submit registration
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown"

    if (!checkRateLimit(`registration:${ip}`, 10, 60 * 60 * 1000)) {
      return NextResponse.json(
        {
          error: "Too many registration attempts. Please try again later.",
        },
        { status: 429 }
      )
    }

    const classItem = await prisma.class.findUnique({
      where: { joinCode: code },
    })

    if (!classItem) {
      return NextResponse.json(
        { error: "Invalid join code. This class does not exist." },
        { status: 404 }
      )
    }

    if (!classItem.joinEnabled) {
      return NextResponse.json(
        { error: "Registration is currently closed for this class." },
        { status: 403 }
      )
    }

    if (classItem.status === "COMPLETED" || classItem.status === "CANCELLED") {
      return NextResponse.json(
        { error: `This class has been ${classItem.status.toLowerCase()}.` },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = registrationSchema.parse(body)

    const existingRegistration = await prisma.registration.findFirst({
      where: {
        classId: classItem.id,
        email: validatedData.email.toLowerCase(),
      },
    })

    if (existingRegistration) {
      return NextResponse.json(
        {
          error: "This email is already registered for this class.",
        },
        { status: 409 }
      )
    }

    const registration = await prisma.registration.create({
      data: {
        classId: classItem.id,
        fullName: validatedData.fullName,
        email: validatedData.email.toLowerCase(),
        phone: validatedData.phone || null,
        organization: validatedData.organization || null,
        consentFlag: validatedData.consentFlag,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful!",
        registration: {
          id: registration.id,
          fullName: registration.fullName,
          email: registration.email,
        },
        class: {
          title: classItem.title,
          startDatetime: classItem.startDatetime,
          location: classItem.location,
          mode: classItem.mode,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error creating registration:", error)

    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to submit registration" },
      { status: 500 }
    )
  }
}
