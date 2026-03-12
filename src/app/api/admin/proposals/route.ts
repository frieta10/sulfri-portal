import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { proposalUpdateSchema } from "@/lib/validations/proposal"

// GET /api/admin/proposals - List all proposals with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const topic = searchParams.get("topic")
    const search = searchParams.get("search")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const where: any = {}

    // Filter by status
    if (status && status !== "ALL") {
      where.status = status
    }

    // Filter by topic
    if (topic && topic !== "ALL") {
      where.topicInterest = topic
    }

    // Search by contact name, organisation, or email
    if (search) {
      where.OR = [
        { contactName: { contains: search, mode: "insensitive" } },
        { organisation: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      where.submittedAt = {}
      if (dateFrom) {
        where.submittedAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.submittedAt.lte = new Date(dateTo + "T23:59:59.999Z")
      }
    }

    const [proposals, total] = await Promise.all([
      prisma.proposalRequest.findMany({
        where,
        orderBy: { submittedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.proposalRequest.count({ where }),
    ])

    // Get unique topics for filter dropdown
    const topics = await prisma.proposalRequest.findMany({
      select: { topicInterest: true },
      distinct: ["topicInterest"],
    })

    return NextResponse.json({
      proposals,
      topics: topics.map((t) => t.topicInterest),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching proposals:", error)
    return NextResponse.json(
      { error: "Failed to fetch proposals" },
      { status: 500 }
    )
  }
}
