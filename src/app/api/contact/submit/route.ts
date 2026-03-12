import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for contact form
const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().nullable(),
  organisation: z.string().optional().nullable(),
  message: z.string().min(1, "Message is required"),
  consentFlag: z.boolean().refine((val) => val === true, {
    message: "You must consent to data processing",
  }),
})

// Helper to hash IP for privacy
function hashIp(ip: string): string {
  let hash = 0
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(16)
}

// POST /api/contact/submit - Submit contact form
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validationResult = contactFormSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { name, email, phone, organisation, message, consentFlag } = validationResult.data

    // Get request metadata
    const headers = request.headers
    const userAgent = headers.get("user-agent") || undefined
    const forwardedFor = headers.get("x-forwarded-for")
    const realIp = headers.get("x-real-ip")
    const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown"
    const ipHash = ip !== "unknown" ? hashIp(ip) : undefined

    // Create direct enquiry record
    await prisma.directEnquiry.create({
      data: {
        name,
        email,
        phone: phone || undefined,
        organisation: organisation || undefined,
        message,
        consentFlag,
      },
    })

    // Also create a pipeline lead for CRM tracking
    await prisma.leadPipeline.create({
      data: {
        source: "DIRECT_ENQUIRY",
        contactName: name,
        email,
        organisation: organisation || undefined,
        topicInterest: "General Inquiry",
        status: "NEW",
      },
    })

    // Track analytics event
    await prisma.analyticsEvent.create({
      data: {
        eventType: "contact_submit",
        eventData: { hasOrganisation: !!organisation },
        userAgent,
        ipHash,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error submitting contact form:", error)
    return NextResponse.json(
      { error: "Failed to submit message" },
      { status: 500 }
    )
  }
}
