import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateProposalPDF } from "@/lib/proposal/pdf-generator"
import { uploadFile, deleteFile } from "@/lib/storage"

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
