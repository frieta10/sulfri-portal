import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateCSV } from "@/lib/utils/csv-export"
import {
  getIndustrySectorLabel,
  getGroupSizeLabel,
  getDeliveryModeLabel,
  getTimelineLabel,
  getProposalStatusLabel,
} from "@/lib/validations/proposal"

// GET /api/admin/proposals/export - Export proposals to CSV
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

    const where: any = {}

    // Apply same filters as list endpoint
    if (status && status !== "ALL") {
      where.status = status
    }
    if (topic && topic !== "ALL") {
      where.topicInterest = topic
    }
    if (search) {
      where.OR = [
        { contactName: { contains: search, mode: "insensitive" } },
        { organisation: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }
    if (dateFrom || dateTo) {
      where.submittedAt = {}
      if (dateFrom) {
        where.submittedAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.submittedAt.lte = new Date(dateTo + "T23:59:59.999Z")
      }
    }

    const proposals = await prisma.proposalRequest.findMany({
      where,
      orderBy: { submittedAt: "desc" },
    })

    // Transform data for CSV
    const csvData = proposals.map((p) => ({
      id: p.id,
      contactName: p.contactName,
      organisation: p.organisation,
      email: p.email,
      phone: p.phone,
      industrySector: p.industrySector ? getIndustrySectorLabel(p.industrySector) : "",
      topicInterest: p.topicInterest,
      groupSize: getGroupSizeLabel(p.groupSize),
      deliveryMode: getDeliveryModeLabel(p.deliveryMode),
      preferredTimeline: getTimelineLabel(p.preferredTimeline),
      additionalNotes: p.additionalNotes || "",
      status: getProposalStatusLabel(p.status),
      adminNotes: p.adminNotes || "",
      submittedAt: p.submittedAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }))

    const columns = [
      { key: "id", header: "ID" },
      { key: "contactName", header: "Contact Name" },
      { key: "organisation", header: "Organisation" },
      { key: "email", header: "Email" },
      { key: "phone", header: "Phone" },
      { key: "industrySector", header: "Industry Sector" },
      { key: "topicInterest", header: "Training Topic" },
      { key: "groupSize", header: "Group Size" },
      { key: "deliveryMode", header: "Delivery Mode" },
      { key: "preferredTimeline", header: "Preferred Timeline" },
      { key: "additionalNotes", header: "Additional Notes" },
      { key: "status", header: "Status" },
      { key: "adminNotes", header: "Admin Notes" },
      { key: "submittedAt", header: "Submitted At" },
      { key: "updatedAt", header: "Updated At" },
    ]

    const csv = generateCSV(csvData, columns)

    // Return CSV as downloadable file
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="proposals-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting proposals:", error)
    return NextResponse.json(
      { error: "Failed to export proposals" },
      { status: 500 }
    )
  }
}
