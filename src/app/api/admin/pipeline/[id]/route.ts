import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateLeadSchema } from "@/lib/validations/pipeline"

// PATCH /api/admin/pipeline/[id] - Update lead status, notes, follow-up date
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

    // Validate the request body
    const validatedData = updateLeadSchema.parse(body)

    // Check if lead exists
    const existingLead = await prisma.leadPipeline.findUnique({
      where: { id },
    })

    if (!existingLead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      )
    }

    // Update the lead
    const updatedLead = await prisma.leadPipeline.update({
      where: { id },
      data: {
        ...(validatedData.contactName && { contactName: validatedData.contactName }),
        ...(validatedData.email && { email: validatedData.email }),
        ...(validatedData.organisation !== undefined && { organisation: validatedData.organisation }),
        ...(validatedData.topicInterest !== undefined && { topicInterest: validatedData.topicInterest }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.followUpDate !== undefined && {
          followUpDate: validatedData.followUpDate ? new Date(validatedData.followUpDate) : null,
        }),
        ...(validatedData.adminNotes !== undefined && { adminNotes: validatedData.adminNotes }),
        lastActivityAt: new Date(),
      },
    })

    return NextResponse.json(updatedLead)
  } catch (error: any) {
    console.error("Error updating lead:", error)

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/pipeline/[id] - Delete/archive lead
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

    // Check if lead exists
    const existingLead = await prisma.leadPipeline.findUnique({
      where: { id },
    })

    if (!existingLead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      )
    }

    // Soft delete by archiving
    const archivedLead = await prisma.leadPipeline.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        lastActivityAt: new Date(),
      },
    })

    return NextResponse.json({
      message: "Lead archived successfully",
      lead: archivedLead,
    })
  } catch (error) {
    console.error("Error archiving lead:", error)
    return NextResponse.json(
      { error: "Failed to archive lead" },
      { status: 500 }
    )
  }
}
