import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Helper to hash IP for privacy
function hashIp(ip: string): string {
  // Simple hash function for demonstration
  // In production, use a proper crypto hash
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(16)
}

// POST /api/analytics/events - Track analytics event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Simple validation
    if (!body.eventType || typeof body.eventType !== "string") {
      return NextResponse.json(
        { error: "Invalid input: eventType is required" },
        { status: 400 }
      )
    }

    const { eventType, eventData } = body

    // Get request metadata
    const headers = request.headers
    const userAgent = headers.get("user-agent") || undefined
    const forwardedFor = headers.get("x-forwarded-for")
    const realIp = headers.get("x-real-ip")
    const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown"
    const ipHash = ip !== "unknown" ? hashIp(ip) : undefined
    const referrerUrl = headers.get("referer") || undefined

    // Store the event
    await prisma.analyticsEvent.create({
      data: {
        eventType,
        eventData: eventData || {},
        referrerUrl,
        userAgent,
        ipHash,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error tracking analytics event:", error)
    // Return 200 even on error to not break client functionality
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
