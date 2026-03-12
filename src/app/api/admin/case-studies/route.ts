import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { caseStudyCreateSchema } from "@/lib/validations/case-study"

// GET /api/admin/case-studies - List all case studies (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const caseStudies = await prisma.caseStudy.findMany({
      orderBy: [
        { displayOrder: "asc" },
        { studyDate: "desc" },
        { createdAt: "desc" },
      ],
    })

    return NextResponse.json(caseStudies)
  } catch (error) {
    console.error("Error fetching case studies:", error)
    return NextResponse.json(
      { error: "Failed to fetch case studies" },
      { status: 500 }
    )
  }
}

// POST /api/admin/case-studies - Create new case study (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = caseStudyCreateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const data = validationResult.data

    const caseStudy = await prisma.caseStudy.create({
      data: {
        clientLabel: data.clientLabel,
        trainingTopic: data.trainingTopic,
        participantCount: data.participantCount,
        durationText: data.durationText,
        outcomeSummary: data.outcomeSummary,
        studyDate: data.studyDate,
        visibility: data.visibility,
        displayOrder: data.displayOrder,
      },
    })

    return NextResponse.json(caseStudy, { status: 201 })
  } catch (error: any) {
    console.error("Error creating case study:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create case study" },
      { status: 500 }
    )
  }
}
