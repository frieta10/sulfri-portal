import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendFollowUpEmail } from "@/lib/email/service"

// POST /api/admin/proposals/[id]/follow-up - Send follow-up email
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
    const { customMessage } = body || {}

    const result = await sendFollowUpEmail(id, customMessage)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send follow-up email" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Follow-up email sent successfully",
    })
  } catch (error: any) {
    console.error("Error sending follow-up:", error)
    return NextResponse.json(
      { error: "Failed to send follow-up email" },
      { status: 500 }
    )
  }
}
