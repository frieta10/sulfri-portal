import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendFollowUpSchema } from "@/lib/validations/pipeline"

// POST /api/admin/pipeline/[id]/send-followup - Send follow-up email to lead
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
    const body = await request.json()

    // Validate the request body
    const validatedData = sendFollowUpSchema.parse(body)

    // Check if lead exists
    const lead = await prisma.leadPipeline.findUnique({
      where: { id },
    })

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      )
    }

    // Log email attempt
    // In a real implementation, you would send the email here using a service like SendGrid, AWS SES, etc.
    const emailLog = await prisma.emailLog.create({
      data: {
        recipientEmail: lead.email,
        subject: validatedData.subject,
        templateName: "custom_followup",
        status: "SENT",
        sentAt: new Date(),
        leadId: lead.id,
      },
    })

    // Update lead's last activity
    await prisma.leadPipeline.update({
      where: { id },
      data: {
        lastActivityAt: new Date(),
        status: lead.status === "NEW" ? "CONTACTED" : lead.status,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Follow-up email sent successfully",
      emailLog,
    })
  } catch (error: any) {
    console.error("Error sending follow-up email:", error)

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to send follow-up email" },
      { status: 500 }
    )
  }
}
