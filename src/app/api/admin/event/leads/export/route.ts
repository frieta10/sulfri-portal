import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { LeadStatus } from "@prisma/client"
import { generateCSV } from "@/lib/utils/csv-export"

// GET /api/admin/event/leads/export - Export leads to CSV
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Filter params (same as list endpoint)
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

    // Get all matching leads (no pagination for export)
    const leads = await prisma.eventLead.findMany({
      where,
      orderBy: { registeredAt: "desc" },
      include: {
        selections: {
          include: {
            course: {
              select: {
                title: true,
              },
            },
          },
          orderBy: { selectedAt: "asc" },
        },
      },
    })

    // Format data for CSV export
    const exportData = leads.map((lead) => ({
      id: lead.id,
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      organisation: lead.organisation || "",
      jobTitle: lead.jobTitle || "",
      courses: lead.selections.map((s) => s.course.title).join("; "),
      status: lead.status,
      utmSource: lead.utmSource || "",
      consentFlag: lead.consentFlag ? "Yes" : "No",
      adminNotes: lead.adminNotes || "",
      registeredAt: lead.registeredAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    }))

    // Generate CSV
    const csv = generateCSV(exportData, [
      { key: "id", header: "ID" },
      { key: "fullName", header: "Full Name" },
      { key: "email", header: "Email" },
      { key: "phone", header: "Phone" },
      { key: "organisation", header: "Organisation" },
      { key: "jobTitle", header: "Job Title" },
      { key: "courses", header: "Selected Courses" },
      { key: "status", header: "Status" },
      { key: "utmSource", header: "UTM Source" },
      { key: "consentFlag", header: "Consent Given" },
      { key: "adminNotes", header: "Admin Notes" },
      { key: "registeredAt", header: "Registered At" },
      { key: "updatedAt", header: "Updated At" },
    ])

    // Add BOM for Excel UTF-8 compatibility
    const csvWithBOM = "\uFEFF" + csv

    // Return CSV as downloadable file
    return new NextResponse(csvWithBOM, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leads-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error: any) {
    console.error("Error exporting leads:", error)
    return NextResponse.json(
      { error: "Failed to export leads" },
      { status: 500 }
    )
  }
}
