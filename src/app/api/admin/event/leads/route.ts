import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { LeadStatus } from "@prisma/client"

// GET /api/admin/event/leads - List all leads with pagination, search, and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Pagination params
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "20", 10)
    const skip = (page - 1) * limit
    
    // Filter params
    const search = searchParams.get("search") || ""
    const courseId = searchParams.get("courseId") || undefined
    const status = searchParams.get("status") as LeadStatus | undefined
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { organisation: { contains: search, mode: "insensitive" } },
        { jobTitle: { contains: search, mode: "insensitive" } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (dateFrom || dateTo) {
      where.registeredAt = {}
      if (dateFrom) {
        where.registeredAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.registeredAt.lte = new Date(dateTo)
      }
    }

    if (courseId) {
      where.selections = {
        some: {
          courseId,
        },
      }
    }

    // Get total count for pagination
    const total = await prisma.eventLead.count({ where })

    // Get leads with course selections
    const leads = await prisma.eventLead.findMany({
      where,
      skip,
      take: limit,
      orderBy: { registeredAt: "desc" },
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
          orderBy: { selectedAt: "asc" },
        },
      },
    })

    // Transform leads to match frontend interface
    const transformedLeads = leads.map((lead) => ({
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
    }))

    return NextResponse.json({
      leads: transformedLeads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error("Error fetching leads:", error)
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    )
  }
}
