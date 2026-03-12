import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { caseStudyUpdateSchema } from "@/lib/validations/case-study"

// PATCH /api/admin/case-studies/[id] - Update case study (admin only)
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

    // Validate input
    const validationResult = caseStudyUpdateSchema.safeParse({ ...body, id })
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if case study exists
    const existingCaseStudy = await prisma.caseStudy.findUnique({
      where: { id },
    })

    if (!existingCaseStudy) {
      return NextResponse.json(
        { error: "Case study not found" },
        { status: 404 }
      )
    }

    const caseStudy = await prisma.caseStudy.update({
      where: { id },
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

    return NextResponse.json(caseStudy)
  } catch (error: any) {
    console.error("Error updating case study:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update case study" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/case-studies/[id] - Delete case study (admin only)
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

    // Check if case study exists
    const existingCaseStudy = await prisma.caseStudy.findUnique({
      where: { id },
    })

    if (!existingCaseStudy) {
      return NextResponse.json(
        { error: "Case study not found" },
        { status: 404 }
      )
    }

    await prisma.caseStudy.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting case study:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete case study" },
      { status: 500 }
    )
  }
}
