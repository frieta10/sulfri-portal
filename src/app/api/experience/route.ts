import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/experience - Get completed public classes for teaching experience
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year")
    const topic = searchParams.get("topic")

    const where: any = {
      status: "COMPLETED",
      showOnPublicProfile: true,
    }

    // Filter by year
    if (year && year !== "all") {
      const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`)
      const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`)
      where.startDatetime = {
        gte: startOfYear,
        lte: endOfYear,
      }
    }

    // Filter by topic
    if (topic && topic !== "all") {
      where.topicCategory = topic
    }

    const classes = await prisma.class.findMany({
      where,
      select: {
        id: true,
        title: true,
        clientName: true,
        clientType: true,
        topicCategory: true,
        mode: true,
        location: true,
        startDatetime: true,
        endDatetime: true,
      },
      orderBy: { startDatetime: "desc" },
    })

    // Get distinct years and topics for filter options
    const allClasses = await prisma.class.findMany({
      where: {
        status: "COMPLETED",
        showOnPublicProfile: true,
      },
      select: {
        startDatetime: true,
        topicCategory: true,
      },
    })

    const years = [
      ...new Set(
        allClasses.map((c) => new Date(c.startDatetime).getFullYear().toString())
      ),
    ].sort((a, b) => b.localeCompare(a))

    const topics = [
      ...new Set(allClasses.map((c) => c.topicCategory)),
    ].sort()

    return NextResponse.json({
      classes,
      total: classes.length,
      filters: { years, topics },
    })
  } catch (error) {
    console.error("Error fetching experience:", error)
    return NextResponse.json(
      { error: "Failed to fetch experience" },
      { status: 500 }
    )
  }
}
