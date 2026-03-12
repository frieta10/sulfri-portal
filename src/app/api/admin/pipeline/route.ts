import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createLeadSchema } from "@/lib/validations/pipeline"

// GET /api/admin/pipeline - List all leads in pipeline
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const source = searchParams.get("source")
    const search = searchParams.get("search")
    const fromDate = searchParams.get("fromDate")
    const toDate = searchParams.get("toDate")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    const where: any = {}

    // Filter by status
    if (status && status !== "all") {
      where.status = status
    }

    // Filter by source
    if (source && source !== "all") {
      where.source = source
    }

    // Search by name, email, or organisation
    if (search) {
      where.OR = [
        { contactName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { organisation: { contains: search, mode: "insensitive" } },
      ]
    }

    // Filter by date range
    if (fromDate || toDate) {
      where.createdAt = {}
      if (fromDate) {
        where.createdAt.gte = new Date(fromDate)
      }
      if (toDate) {
        where.createdAt.lte = new Date(toDate)
      }
    }

    const [leads, total, statusCounts, emailCounts] = await Promise.all([
      prisma.leadPipeline.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.leadPipeline.count({ where }),
      prisma.leadPipeline.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.emailLog.groupBy({
        by: ["leadId"],
        _count: { leadId: true },
        where: {
          leadId: {
            not: null,
          },
        },
      }),
    ])

    // Create email count map
    const emailCountMap = emailCounts.reduce((acc, curr) => {
      if (curr.leadId) {
        acc[curr.leadId] = curr._count.leadId
      }
      return acc
    }, {} as Record<string, number>)

    // Add email count to leads
    const leadsWithCounts = leads.map((lead) => ({
      ...lead,
      _count: {
        emailLogs: emailCountMap[lead.id] || 0,
      },
    }))

    // Convert status counts to a more usable format
    const countsByStatus = statusCounts.reduce((acc, curr) => {
      acc[curr.status] = curr._count.status
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      leads: leadsWithCounts,
      total,
      limit,
      offset,
      countsByStatus,
    })
  } catch (error) {
    console.error("Error fetching pipeline leads:", error)
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    )
  }
}

// POST /api/admin/pipeline - Create a new lead manually
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate the request body
    const validatedData = createLeadSchema.parse(body)

    // Create the lead
    const lead = await prisma.leadPipeline.create({
      data: {
        contactName: validatedData.contactName,
        email: validatedData.email,
        organisation: validatedData.organisation,
        topicInterest: validatedData.topicInterest,
        source: validatedData.source,
        status: validatedData.status,
        followUpDate: validatedData.followUpDate ? new Date(validatedData.followUpDate) : null,
        adminNotes: validatedData.adminNotes,
      },
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (error: any) {
    console.error("Error creating lead:", error)

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    )
  }
}
