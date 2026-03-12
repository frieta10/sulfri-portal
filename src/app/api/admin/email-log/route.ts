import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/email-log - List all email logs
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

    // Filter by status
    if (status && status !== "all") {
      where.status = status
    }

    // Search by recipient email or subject
    if (search) {
      where.OR = [
        { recipientEmail: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
      ]
    }

    // Fetch emails first
    const [emails, total, statusCounts] = await Promise.all([
      prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.emailLog.count({ where }),
      prisma.emailLog.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
    ])

    // Get unique lead IDs from emails
    const leadIds = [...new Set(emails.map((e) => e.leadId).filter(Boolean))] as string[]

    // Fetch leads for those IDs
    let leadMap: Record<string, string> = {}
    if (leadIds.length > 0) {
      const leads = await prisma.leadPipeline.findMany({
        where: {
          id: {
            in: leadIds,
          },
        },
        select: {
          id: true,
          contactName: true,
        },
      })
      leadMap = leads.reduce((acc, curr) => {
        acc[curr.id] = curr.contactName
        return acc
      }, {} as Record<string, string>)
    }

    // Add contact name to emails
    const emailsWithLeads = emails.map((email) => ({
      ...email,
      lead: email.leadId ? { contactName: leadMap[email.leadId] || null } : null,
    }))

    // Convert status counts to a more usable format
    const countsByStatus = statusCounts.reduce((acc, curr) => {
      acc[curr.status] = curr._count.status
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      emails: emailsWithLeads,
      total,
      limit,
      offset,
      countsByStatus,
    })
  } catch (error) {
    console.error("Error fetching email logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch email logs" },
      { status: 500 }
    )
  }
}
