import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for proposal request
const proposalRequestSchema = z.object({
  contactName: z.string().min(1, "Contact name is required"),
  organisation: z.string().min(1, "Organisation is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  industrySector: z.string().optional().nullable(),
  topicInterest: z.string().min(1, "Topic of interest is required"),
  groupSize: z.enum(["UNDER_20", "BETWEEN_20_50", "BETWEEN_50_100", "OVER_100"]),
  deliveryMode: z.enum(["ONLINE", "PHYSICAL", "HYBRID"]),
  preferredTimeline: z.string().optional().nullable(),
  additionalNotes: z.string().optional().nullable(),
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

// POST /api/proposals - Submit proposal request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validationResult = proposalRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check for duplicate submissions (cooldown)
    const settings = await prisma.portalSettings.findUnique({
      where: { id: "singleton" },
    })
    const cooldownHours = settings?.proposalDuplicateCooldownHours || 48
    const cooldownMs = cooldownHours * 60 * 60 * 1000

    const recentSubmission = await prisma.proposalRequest.findFirst({
      where: {
        email: data.email,
        submittedAt: {
          gte: new Date(Date.now() - cooldownMs),
        },
      },
      orderBy: { submittedAt: "desc" },
    })

    if (recentSubmission) {
      const hoursSince = Math.floor(
        (Date.now() - recentSubmission.submittedAt.getTime()) / (1000 * 60 * 60)
      )
      const hoursRemaining = cooldownHours - hoursSince

      return NextResponse.json(
        {
          error: `You have already submitted a proposal request recently. Please wait ${hoursRemaining} hours before submitting another.`,
        },
        { status: 429 }
      )
    }

    // Get request metadata
    const headers = request.headers
    const userAgent = headers.get("user-agent") || undefined
    const forwardedFor = headers.get("x-forwarded-for")
    const realIp = headers.get("x-real-ip")
    const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown"
    const ipHash = ip !== "unknown" ? hashIp(ip) : undefined

    // Create proposal request
    const proposal = await prisma.proposalRequest.create({
      data: {
        contactName: data.contactName,
        organisation: data.organisation,
        email: data.email,
        phone: data.phone,
        industrySector: data.industrySector || undefined,
        topicInterest: data.topicInterest,
        groupSize: data.groupSize,
        deliveryMode: data.deliveryMode,
        preferredTimeline: data.preferredTimeline || undefined,
        additionalNotes: data.additionalNotes || undefined,
        consentFlag: data.consentFlag,
      },
    })

    // Create pipeline lead
    await prisma.leadPipeline.create({
      data: {
        source: "PROPOSAL",
        sourceRecordId: proposal.id,
        contactName: data.contactName,
        email: data.email,
        organisation: data.organisation,
        topicInterest: data.topicInterest,
        status: "NEW",
      },
    })

    // Track analytics event
    await prisma.analyticsEvent.create({
      data: {
        eventType: "proposal_submit",
        eventData: {
          groupSize: data.groupSize,
          deliveryMode: data.deliveryMode,
        },
        userAgent,
        ipHash,
      },
    })

    return NextResponse.json({ success: true, id: proposal.id })
  } catch (error) {
    console.error("Error submitting proposal:", error)
    return NextResponse.json(
      { error: "Failed to submit proposal" },
      { status: 500 }
    )
  }
}
