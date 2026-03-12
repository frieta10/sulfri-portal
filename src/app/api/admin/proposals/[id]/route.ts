import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { proposalUpdateSchema } from "@/lib/validations/proposal"
import { generateProposalPDF } from "@/lib/proposal/pdf-generator"
import { uploadFile, deleteFile } from "@/lib/storage"

// GET /api/admin/proposals/[id] - Get single proposal details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const proposal = await prisma.proposalRequest.findUnique({
      where: { id },
    })

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(proposal)
  } catch (error) {
    console.error("Error fetching proposal:", error)
    return NextResponse.json(
      { error: "Failed to fetch proposal" },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/proposals/[id] - Update proposal status and notes
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Validate input
    const validatedData = proposalUpdateSchema.parse(body)

    // Check if proposal exists
    const existingProposal = await prisma.proposalRequest.findUnique({
      where: { id },
    })

    if (!existingProposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      )
    }

    // Update proposal
    const updatedProposal = await prisma.proposalRequest.update({
      where: { id },
      data: {
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.adminNotes !== undefined && { adminNotes: validatedData.adminNotes }),
      },
    })

    return NextResponse.json(updatedProposal)
  } catch (error: any) {
    console.error("Error updating proposal:", error)

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update proposal" },
      { status: 500 }
    )
  }
}

// POST /api/admin/proposals/[id]/regenerate-pdf - Regenerate proposal PDF
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { pathname } = new URL(request.url)
    
    // Only handle regenerate-pdf endpoint
    if (!pathname.endsWith("/regenerate-pdf")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Get proposal
    const proposal = await prisma.proposalRequest.findUnique({
      where: { id },
    })

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      )
    }

    // Delete old PDF if exists
    if (proposal.generatedPdfUrl) {
      try {
        await deleteFile(proposal.generatedPdfUrl)
      } catch (error) {
        console.error("Error deleting old PDF:", error)
        // Continue even if deletion fails
      }
    }

    // Generate new PDF
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

    // Upload new PDF
    const pdfFileName = `proposal-${proposal.id}-${Date.now()}.pdf`
    const pdfArray = new Uint8Array(pdfBuffer)
    const pdfBlob = new Blob([pdfArray], { type: "application/pdf" })
    const pdfFile = new File([pdfBlob], pdfFileName, { type: "application/pdf" })
    const pdfUrl = await uploadFile(pdfFile)

    // Update proposal with new PDF URL
    const updatedProposal = await prisma.proposalRequest.update({
      where: { id },
      data: { generatedPdfUrl: pdfUrl },
    })

    return NextResponse.json({
      success: true,
      proposal: updatedProposal,
      pdfUrl,
    })
  } catch (error) {
    console.error("Error regenerating PDF:", error)
    return NextResponse.json(
      { error: "Failed to regenerate PDF" },
      { status: 500 }
    )
  }
}
