import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { proposalSubmitSchema } from "@/lib/validations/proposal"
import { sendProposalEmails } from "@/lib/email/service"
import { generateProposalPDF } from "@/lib/proposal/pdf-generator"
import { uploadFile } from "@/lib/storage"

// POST /api/proposal/submit - Submit a new proposal request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate the request body
    const validatedData = proposalSubmitSchema.parse(body)

    // Check for duplicate submission within 48 hours
    const cooldownHours = 48
    const cooldownDate = new Date(Date.now() - cooldownHours * 60 * 60 * 1000)

    const existingProposal = await prisma.proposalRequest.findFirst({
      where: {
        email: {
          equals: validatedData.email,
          mode: "insensitive",
        },
        submittedAt: {
          gte: cooldownDate,
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    })

    if (existingProposal) {
      const hoursSince = Math.floor(
        (Date.now() - existingProposal.submittedAt.getTime()) / (1000 * 60 * 60)
      )
      const hoursRemaining = cooldownHours - hoursSince

      return NextResponse.json(
        {
          error: "Duplicate submission",
          message: `You have already submitted a proposal request ${hoursSince} hours ago. Please wait ${hoursRemaining} more hours before submitting again.`,
          cooldownRemaining: hoursRemaining,
        },
        { status: 429 }
      )
    }

    // Create the proposal request
    const proposal = await prisma.proposalRequest.create({
      data: {
        contactName: validatedData.contactName,
        organisation: validatedData.organisation,
        email: validatedData.email,
        phone: validatedData.phone,
        industrySector: validatedData.industrySector,
        topicInterest: validatedData.topicInterest,
        groupSize: validatedData.groupSize,
        deliveryMode: validatedData.deliveryMode,
        preferredTimeline: validatedData.preferredTimeline,
        additionalNotes: validatedData.additionalNotes,
        consentFlag: validatedData.consentFlag,
        status: "NEW",
      },
    })

    // Generate PDF
    let pdfUrl: string | null = null
    try {
      const pdfBuffer = await generateProposalPDF({
        id: proposal.id,
        contactName: proposal.contactName,
        organisation: proposal.organisation,
        email: proposal.email,
        phone: proposal.phone,
        industrySector: proposal.industrySector,
        topicInterest: proposal.topicInterest,
        groupSize: proposal.groupSize,
        deliveryMode: proposal.deliveryMode,
        preferredTimeline: proposal.preferredTimeline,
        additionalNotes: proposal.additionalNotes,
        submittedAt: proposal.submittedAt,
      })

      // Upload PDF to storage
      const pdfFileName = `proposal-${proposal.id}-${Date.now()}.pdf`
      const pdfArray = new Uint8Array(pdfBuffer)
      const pdfBlob = new Blob([pdfArray], { type: "application/pdf" })
      const pdfFile = new File([pdfBlob], pdfFileName, { type: "application/pdf" })
      pdfUrl = await uploadFile(pdfFile)

      // Update proposal with PDF URL
      await prisma.proposalRequest.update({
        where: { id: proposal.id },
        data: { generatedPdfUrl: pdfUrl },
      })
    } catch (pdfError) {
      console.error("Error generating/uploading PDF:", pdfError)
      // Continue without PDF - don't fail the submission
    }

    // Send emails
    try {
      await sendProposalEmails({
        proposal: {
          id: proposal.id,
          contactName: proposal.contactName,
          organisation: proposal.organisation,
          email: proposal.email,
          phone: proposal.phone,
          industrySector: proposal.industrySector,
          topicInterest: proposal.topicInterest,
          groupSize: proposal.groupSize,
          deliveryMode: proposal.deliveryMode,
          preferredTimeline: proposal.preferredTimeline,
          additionalNotes: proposal.additionalNotes,
          submittedAt: proposal.submittedAt,
        },
        pdfUrl,
      })
    } catch (emailError) {
      console.error("Error sending proposal emails:", emailError)
      // Continue - don't fail the submission if email fails
    }

    // Track analytics event
    try {
      await prisma.analyticsEvent.create({
        data: {
          eventType: "proposal_submit",
          eventData: {
            topic: validatedData.topicInterest,
            groupSize: validatedData.groupSize,
            deliveryMode: validatedData.deliveryMode,
            industry: validatedData.industrySector,
          },
          referrerUrl: request.headers.get("referer") || null,
          userAgent: request.headers.get("user-agent") || null,
          ipHash: await hashIp(getClientIp(request)),
        },
      })
    } catch (analyticsError) {
      console.error("Error tracking analytics:", analyticsError)
      // Non-critical - don't fail the request
    }

    return NextResponse.json(
      {
        success: true,
        proposal: {
          id: proposal.id,
          contactName: proposal.contactName,
          organisation: proposal.organisation,
          email: proposal.email,
          status: proposal.status,
          submittedAt: proposal.submittedAt,
        },
        message: "Proposal request submitted successfully. You will receive a confirmation email shortly.",
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error submitting proposal:", error)

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to submit proposal request" },
      { status: 500 }
    )
  }
}

// Helper function to hash IP for privacy
async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(ip)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

// Helper function to get client IP
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  
  if (forwarded) {
    return forwarded.split(",")[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  return "unknown"
}
