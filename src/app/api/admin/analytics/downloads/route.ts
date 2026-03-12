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

// GET /api/admin/analytics/downloads - Get PDF download logs with pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = (searchParams.get("range") || "30d") as DateRange
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const pdfType = searchParams.get("pdfType") || undefined

    if (!validRanges.includes(range)) {
      return NextResponse.json(
        { error: "Invalid range. Must be one of: 7d, 30d, 90d, all" },
        { status: 400 }
      )
    }

    const cutoffDate = getDateFilter(range)
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      ...(cutoffDate && { downloadedAt: { gte: cutoffDate } }),
      ...(pdfType && { pdfType }),
    }

    // Fetch downloads with pagination
    const [downloads, totalCount] = await Promise.all([
      prisma.pdfDownloadLog.findMany({
        where,
        orderBy: { downloadedAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          pdfType: true,
          referrerPage: true,
          userAgent: true,
          ipHash: true,
          downloadedAt: true,
        },
      }),
      prisma.pdfDownloadLog.count({ where }),
    ])

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit)
    const hasMore = page < totalPages

    // Format downloads for response
    const formattedDownloads = downloads.map((download) => ({
      id: download.id,
      pdfType: download.pdfType,
      referrerPage: download.referrerPage,
      userAgent: download.userAgent 
        ? download.userAgent.split(" ")[0].substring(0, 50) // Truncate for display
        : null,
      ipHash: download.ipHash 
        ? `${download.ipHash.substring(0, 8)}...` // Mask for privacy
        : null,
      downloadedAt: download.downloadedAt.toISOString(),
    }))

    // Get summary stats
    const [summaryCount, fullCount] = await Promise.all([
      prisma.pdfDownloadLog.count({
        where: {
          ...where,
          pdfType: "summary",
        },
      }),
      prisma.pdfDownloadLog.count({
        where: {
          ...where,
          pdfType: "full",
        },
      }),
    ])

    return NextResponse.json({
      downloads: formattedDownloads,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore,
      },
      summary: {
        summary: summaryCount,
        full: fullCount,
        total: totalCount,
      },
      range,
    })
  } catch (error) {
    console.error("Error fetching download logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch download logs" },
      { status: 500 }
    )
  }
}
