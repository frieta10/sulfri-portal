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

// Helper to generate daily trend data
async function getDownloadsTrend(range: DateRange) {
  const cutoffDate = getDateFilter(range)
  
  const downloads = await prisma.pdfDownloadLog.findMany({
    where: cutoffDate ? { downloadedAt: { gte: cutoffDate } } : {},
    orderBy: { downloadedAt: "asc" },
    select: { downloadedAt: true, pdfType: true },
  })

  // Group by date
  const grouped = new Map<string, { date: string; summary: number; full: number; total: number }>()
  
  downloads.forEach((download) => {
    const date = download.downloadedAt.toISOString().split("T")[0]
    const existing = grouped.get(date) || { date, summary: 0, full: 0, total: 0 }
    
    if (download.pdfType === "summary") {
      existing.summary++
    } else {
      existing.full++
    }
    existing.total++
    grouped.set(date, existing)
  })

  return Array.from(grouped.values())
}

// Helper to get proposal topics breakdown
async function getTopTopics(range: DateRange, limit: number = 10) {
  const cutoffDate = getDateFilter(range)
  
  const proposals = await prisma.proposalRequest.findMany({
    where: cutoffDate ? { submittedAt: { gte: cutoffDate } } : {},
    select: { topicInterest: true },
  })

  const topicCounts = new Map<string, number>()
  proposals.forEach((proposal) => {
    const count = topicCounts.get(proposal.topicInterest) || 0
    topicCounts.set(proposal.topicInterest, count + 1)
  })

  return Array.from(topicCounts.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

// Helper to get lead sources breakdown
async function getLeadSources(range: DateRange) {
  const cutoffDate = getDateFilter(range)
  
  const [eventLeads, proposalLeads, directEnquiries] = await Promise.all([
    prisma.eventLead.count({
      where: cutoffDate ? { registeredAt: { gte: cutoffDate } } : {},
    }),
    prisma.proposalRequest.count({
      where: cutoffDate ? { submittedAt: { gte: cutoffDate } } : {},
    }),
    prisma.directEnquiry.count({
      where: cutoffDate ? { submittedAt: { gte: cutoffDate } } : {},
    }),
  ])

  return [
    { source: "Event Registration", count: eventLeads, color: "#22c55e" },
    { source: "Proposal Request", count: proposalLeads, color: "#3b82f6" },
    { source: "Direct Enquiry", count: directEnquiries, color: "#f59e0b" },
  ].filter((s) => s.count > 0)
}

// Helper to get daily page views (simulated from analytics events)
async function getDailyPageViews(range: DateRange) {
  const cutoffDate = getDateFilter(range)
  
  const events = await prisma.analyticsEvent.findMany({
    where: {
      eventType: "page_view",
      ...(cutoffDate && { createdAt: { gte: cutoffDate } }),
    },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  })

  const grouped = new Map<string, number>()
  events.forEach((event) => {
    const date = event.createdAt.toISOString().split("T")[0]
    grouped.set(date, (grouped.get(date) || 0) + 1)
  })

  return Array.from(grouped.entries())
    .map(([date, views]) => ({ date, views }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// Helper to calculate unique visitors (approximated by unique IP hashes)
async function getUniqueVisitors(range: DateRange) {
  const cutoffDate = getDateFilter(range)
  
  const uniqueIps = await prisma.analyticsEvent.groupBy({
    by: ["ipHash"],
    where: {
      ipHash: { not: null },
      ...(cutoffDate && { createdAt: { gte: cutoffDate } }),
    },
    _count: { ipHash: true },
  })

  return uniqueIps.length
}

// Helper to get WhatsApp CTA clicks
async function getWhatsAppClicks(range: DateRange) {
  const cutoffDate = getDateFilter(range)
  
  return await prisma.analyticsEvent.count({
    where: {
      eventType: "whatsapp_click",
      ...(cutoffDate && { createdAt: { gte: cutoffDate } }),
    },
  })
}

// Helper to get badge wallet views
async function getBadgeWalletViews(range: DateRange) {
  const cutoffDate = getDateFilter(range)
  
  return await prisma.analyticsEvent.count({
    where: {
      eventType: "badge_view",
      ...(cutoffDate && { createdAt: { gte: cutoffDate } }),
    },
  })
}

// GET /api/admin/analytics/summary - Get analytics summary
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

    // Fetch all metrics in parallel
    const [
      totalPageViews,
      uniqueVisitors,
      pdfDownloads,
      proposalRequests,
      eventRegistrations,
      whatsappClicks,
      badgeWalletViews,
      downloadsTrend,
      topTopics,
      leadSources,
      dailyPageViews,
    ] = await Promise.all([
      // Total Page Views
      prisma.analyticsEvent.count({
        where: {
          eventType: "page_view",
          ...(cutoffDate && { createdAt: { gte: cutoffDate } }),
        },
      }),
      // Unique Visitors
      getUniqueVisitors(range),
      // PDF Downloads
      prisma.pdfDownloadLog.count({
        where: cutoffDate ? { downloadedAt: { gte: cutoffDate } } : {},
      }),
      // Proposal Requests
      prisma.proposalRequest.count({
        where: cutoffDate ? { submittedAt: { gte: cutoffDate } } : {},
      }),
      // Event Registrations
      prisma.eventLead.count({
        where: cutoffDate ? { registeredAt: { gte: cutoffDate } } : {},
      }),
      // WhatsApp CTA Clicks
      getWhatsAppClicks(range),
      // Badge Wallet Views
      getBadgeWalletViews(range),
      // Downloads Trend
      getDownloadsTrend(range),
      // Top Topics
      getTopTopics(range),
      // Lead Sources
      getLeadSources(range),
      // Daily Page Views
      getDailyPageViews(range),
    ])

    // Calculate PDF download breakdown
    const pdfSummaryDownloads = await prisma.pdfDownloadLog.count({
      where: {
        pdfType: "summary",
        ...(cutoffDate && { downloadedAt: { gte: cutoffDate } }),
      },
    })

    const pdfFullDownloads = await prisma.pdfDownloadLog.count({
      where: {
        pdfType: "full",
        ...(cutoffDate && { downloadedAt: { gte: cutoffDate } }),
      },
    })

    // Calculate conversion rate (proposals + event leads) / unique visitors
    const totalConversions = proposalRequests + eventRegistrations
    const conversionRate = uniqueVisitors > 0 
      ? Number(((totalConversions / uniqueVisitors) * 100).toFixed(2))
      : 0

    // Get recent activity
    const recentActivity = await Promise.all([
      prisma.analyticsEvent.findMany({
        where: cutoffDate ? { createdAt: { gte: cutoffDate } } : {},
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          eventType: true,
          eventData: true,
          createdAt: true,
        },
      }),
      prisma.pdfDownloadLog.findMany({
        where: cutoffDate ? { downloadedAt: { gte: cutoffDate } } : {},
        orderBy: { downloadedAt: "desc" },
        take: 10,
        select: {
          id: true,
          pdfType: true,
          downloadedAt: true,
        },
      }),
    ])

    // Combine and sort recent activity
    const combinedActivity = [
      ...recentActivity[0].map((e) => ({
        id: e.id,
        type: e.eventType,
        data: e.eventData,
        timestamp: e.createdAt,
      })),
      ...recentActivity[1].map((d) => ({
        id: d.id,
        type: `pdf_download_${d.pdfType}`,
        data: null,
        timestamp: d.downloadedAt,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20)

    return NextResponse.json({
      metrics: {
        totalPageViews,
        uniqueVisitors,
        pdfDownloads: {
          total: pdfDownloads,
          summary: pdfSummaryDownloads,
          full: pdfFullDownloads,
        },
        proposalRequests,
        eventRegistrations,
        conversionRate,
        whatsappClicks,
        badgeWalletViews,
      },
      charts: {
        downloadsTrend,
        topTopics,
        leadSources,
        dailyPageViews,
      },
      recentActivity: combinedActivity,
      range,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching analytics summary:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics summary" },
      { status: 500 }
    )
  }
}
