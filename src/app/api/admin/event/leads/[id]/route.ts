import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { LeadStatus } from "@prisma/client"

// GET /api/admin/event/leads/[id] - Get single lead with course selections
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const lead = await prisma.eventLead.findUnique({
      where: { id },
      include: {
        selections: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                shortDescription: true,
                deliveryMode: true,
                startDate: true,
                endDate: true,
                location: true,
                status: true,
              },
            },
          },
          orderBy: { selectedAt: "asc" },
        },
      },
    })

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    // Transform to match frontend interface
    const transformedLead = {
      id: lead.id,
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      organisation: lead.organisation,
      jobTitle: lead.jobTitle,
      courses: lead.selections.map((s) => ({
        id: s.course.id,
        title: s.course.title,
      })),
      utmSource: lead.utmSource,
      consentGiven: lead.consentFlag,
      notes: lead.adminNotes,
      status: lead.status,
      createdAt: lead.registeredAt,
      updatedAt: lead.updatedAt,
    }

    return NextResponse.json(transformedLead)
  } catch (error: any) {
    console.error("Error fetching lead:", error)
    return NextResponse.json(
      { error: "Failed to fetch lead" },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/event/leads/[id] - Update lead status and admin notes
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

    // Validate status if provided
    if (body.status && !Object.values(LeadStatus).includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: any = {}
    
    if (body.status !== undefined) {
      updateData.status = body.status
    }
    
    if (body.adminNotes !== undefined) {
      updateData.adminNotes = body.adminNotes
    }

    const lead = await prisma.eventLead.update({
      where: { id },
      data: updateData,
      include: {
        selections: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                shortDescription: true,
              },
            },
          },
        },
      },
    })

    // Transform to match frontend interface
    const transformedLead = {
      id: lead.id,
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      organisation: lead.organisation,
      jobTitle: lead.jobTitle,
      courses: lead.selections.map((s) => ({
        id: s.course.id,
        title: s.course.title,
      })),
      utmSource: lead.utmSource,
      consentGiven: lead.consentFlag,
      notes: lead.adminNotes,
      status: lead.status,
      createdAt: lead.registeredAt,
      updatedAt: lead.updatedAt,
    }

    return NextResponse.json(transformedLead)
  } catch (error: any) {
    console.error("Error updating lead:", error)
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    )
  }
}
