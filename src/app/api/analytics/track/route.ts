import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { analyticsEventSchema } from "@/lib/validations/analytics"
import crypto from "crypto"

// POST /api/analytics/track - Track client-side events
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()

    // Validate input with Zod schema
    const validationResult = analyticsEventSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request data", 
          details: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      )
    }

    const { eventType, eventData, referrerUrl } = validationResult.data

    // Get IP address and hash it for privacy
    const ipAddress = request.headers.get("x-forwarded-for") || 
                      request.headers.get("x-real-ip") || 
                      "unknown"
    
    // Hash IP address using SHA-256 for privacy compliance
    const ipHash = ipAddress !== "unknown" 
      ? crypto.createHash("sha256").update(ipAddress).digest("hex")
      : null

    // Get user agent
    const userAgent = request.headers.get("user-agent")

    // Store analytics event in database
    const analyticsEvent = await prisma.analyticsEvent.create({
      data: {
        eventType,
        eventData: eventData ? (eventData as any) : undefined,
        referrerUrl: referrerUrl || null,
        userAgent: userAgent || null,
        ipHash,
      },
    })

    return NextResponse.json({
      success: true,
      id: analyticsEvent.id,
    }, { status: 201 })

  } catch (error) {
    console.error("Error tracking analytics event:", error)
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    )
  }
}
