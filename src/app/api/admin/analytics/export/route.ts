import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Valid date ranges
const validRanges = ["7d", "30d", "90d", "all"] as const
type DateRange = typeof validRanges[number]

// Helper to get date filter based on range
function getDateFilter(range: DateRange): Date | undefined {
  if (range === "all") return undefined

  const days = parseInt(range.replace("d", ""))
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  return cutoffDate
}

// Format date for CSV
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

// Escape CSV field
function escapeCSV(field: string | number | null): string {
  if (field === null || field === undefined) return ""
  const stringField = String(field)
  if (stringField.includes(",") || stringField.includes("\"") || stringField.includes("\n")) {
    return `"${stringField.replace(/"/g, "\"\"")}"`
  }
  return stringField
}

// Generate CSV content
function generateCSV(data: Record<string, string | number | null>[]): string {
  if (data.length === 0) return ""
  
  const headers = Object.keys(data[0])
  const headerRow = headers.map(escapeCSV).join(",")
  const rows = data.map((row) => headers.map((h) => escapeCSV(row[h])).join(","))
  
  return [headerRow, ...rows].join("\n")
}

// GET /api/admin/analytics/export - Export analytics to CSV
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = (searchParams.get("range") || "30d") as DateRange

    if (!validRanges.includes(range)) {
      return NextResponse.json(
        { error: "Invalid range. Must be one of: 7d, 30d, 90d, all" },
        { status: 400 }
      )
    }

    const cutoffDate = getDateFilter(range)

    // Fetch all data for export
    const [
      analyticsEvents,
      pdfDownloads,
      proposalRequests,
      eventLeads,
      directEnquiries,
    ] = await Promise.all([
      prisma.analyticsEvent.findMany({
        where: cutoffDate ? { createdAt: { gte: cutoffDate } } : {},
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          eventType: true,
          eventData: true,
          referrerUrl: true,
          createdAt: true,
        },
      }),
      prisma.pdfDownloadLog.findMany({
        where: cutoffDate ? { downloadedAt: { gte: cutoffDate } } : {},
        orderBy: { downloadedAt: "desc" },
        select: {
          id: true,
          pdfType: true,
          referrerPage: true,
          downloadedAt: true,
        },
      }),
      prisma.proposalRequest.findMany({
        where: cutoffDate ? { submittedAt: { gte: cutoffDate } } : {},
        orderBy: { submittedAt: "desc" },
        select: {
          id: true,
          contactName: true,
          organisation: true,
          email: true,
          topicInterest: true,
          groupSize: true,
          deliveryMode: true,
          status: true,
          submittedAt: true,
        },
      }),
      prisma.eventLead.findMany({
        where: cutoffDate ? { registeredAt: { gte: cutoffDate } } : {},
        orderBy: { registeredAt: "desc" },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          organisation: true,
          jobTitle: true,
          utmSource: true,
          status: true,
          registeredAt: true,
        },
      }),
      prisma.directEnquiry.findMany({
        where: cutoffDate ? { submittedAt: { gte: cutoffDate } } : {},
        orderBy: { submittedAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          organisation: true,
          message: true,
          submittedAt: true,
        },
      }),
    ])

    // Calculate summary metrics
    const summaryDownloads = pdfDownloads.filter((d) => d.pdfType === "summary").length
    const fullDownloads = pdfDownloads.filter((d) => d.pdfType === "full").length
    const uniqueVisitors = new Set(analyticsEvents.map((e) => e.id)).size
    const totalConversions = proposalRequests.length + eventLeads.length
    const conversionRate = uniqueVisitors > 0 ? ((totalConversions / uniqueVisitors) * 100).toFixed(2) : "0"

    // Build summary section
    const summaryData = [
      {
        metric: "Report Period",
        value: range === "all" ? "All Time" : `Last ${range}`,
        generated_at: formatDate(new Date()),
      },
      {
        metric: "Total Page Views",
        value: analyticsEvents.filter((e) => e.eventType === "page_view").length,
        generated_at: "",
      },
      {
        metric: "Unique Visitors",
        value: uniqueVisitors,
        generated_at: "",
      },
      {
        metric: "PDF Downloads (Summary)",
        value: summaryDownloads,
        generated_at: "",
      },
      {
        metric: "PDF Downloads (Full)",
        value: fullDownloads,
        generated_at: "",
      },
      {
        metric: "Proposal Requests",
        value: proposalRequests.length,
        generated_at: "",
      },
      {
        metric: "Event Registrations",
        value: eventLeads.length,
        generated_at: "",
      },
      {
        metric: "Conversion Rate (%)",
        value: conversionRate,
        generated_at: "",
      },
      {
        metric: "Direct Enquiries",
        value: directEnquiries.length,
        generated_at: "",
      },
    ]

    // Build detailed data sections
    const analyticsData = analyticsEvents.map((e) => ({
      id: e.id,
      event_type: e.eventType,
      event_data: e.eventData ? JSON.stringify(e.eventData) : "",
      referrer_url: e.referrerUrl || "",
      created_at: formatDate(e.createdAt),
    }))

    const pdfData = pdfDownloads.map((d) => ({
      id: d.id,
      pdf_type: d.pdfType,
      referrer_page: d.referrerPage || "",
      downloaded_at: formatDate(d.downloadedAt),
    }))

    const proposalData = proposalRequests.map((p) => ({
      id: p.id,
      contact_name: p.contactName,
      organisation: p.organisation,
      email: p.email,
      topic_interest: p.topicInterest,
      group_size: p.groupSize,
      delivery_mode: p.deliveryMode,
      status: p.status,
      submitted_at: formatDate(p.submittedAt),
    }))

    const leadsData = eventLeads.map((l) => ({
      id: l.id,
      full_name: l.fullName,
      email: l.email,
      phone: l.phone || "",
      organisation: l.organisation || "",
      job_title: l.jobTitle || "",
      utm_source: l.utmSource || "",
      status: l.status,
      registered_at: formatDate(l.registeredAt),
    }))

    const enquiryData = directEnquiries.map((e) => ({
      id: e.id,
      name: e.name,
      email: e.email,
      phone: e.phone || "",
      organisation: e.organisation || "",
      message: e.message.substring(0, 200), // Truncate for CSV
      submitted_at: formatDate(e.submittedAt),
    }))

    // Combine all sections into one CSV with section headers
    const csvParts: string[] = []
    
    // Summary section
    csvParts.push("ANALYTICS SUMMARY REPORT")
    csvParts.push(generateCSV(summaryData))
    csvParts.push("")
    csvParts.push("")
    
    // Analytics Events section
    csvParts.push("ANALYTICS EVENTS")
    csvParts.push(generateCSV(analyticsData))
    csvParts.push("")
    csvParts.push("")
    
    // PDF Downloads section
    csvParts.push("PDF DOWNLOADS")
    csvParts.push(generateCSV(pdfData))
    csvParts.push("")
    csvParts.push("")
    
    // Proposal Requests section
    csvParts.push("PROPOSAL REQUESTS")
    csvParts.push(generateCSV(proposalData))
    csvParts.push("")
    csvParts.push("")
    
    // Event Leads section
    csvParts.push("EVENT LEADS")
    csvParts.push(generateCSV(leadsData))
    csvParts.push("")
    csvParts.push("")
    
    // Direct Enquiries section
    csvParts.push("DIRECT ENQUIRIES")
    csvParts.push(generateCSV(enquiryData))

    const csvContent = csvParts.join("\n")

    // Return CSV as downloadable file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="analytics-export-${range}-${formatDate(new Date())}.csv"`,
      },
    })
  } catch (error) {
    console.error("Error exporting analytics:", error)
    return NextResponse.json(
      { error: "Failed to export analytics" },
      { status: 500 }
    )
  }
}
