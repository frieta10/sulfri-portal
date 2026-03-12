import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { proposalCheckDuplicateSchema } from "@/lib/validations/proposal"

// GET /api/proposal/check-duplicate?email=user@example.com
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      )
    }

    // Validate email format
    const validationResult = proposalCheckDuplicateSchema.safeParse({ email })
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Get cooldown period from settings (default 48 hours)
    const settings = await prisma.portalSettings.findUnique({
      where: { id: "singleton" },
    })
    const cooldownHours = settings?.proposalDuplicateCooldownHours || 48
    const cooldownDate = new Date(Date.now() - cooldownHours * 60 * 60 * 1000)

    // Check for recent submission
    const existingProposal = await prisma.proposalRequest.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
        submittedAt: {
          gte: cooldownDate,
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
      select: {
        id: true,
        submittedAt: true,
        status: true,
      },
    })

    if (existingProposal) {
      const hoursSince = Math.floor(
        (Date.now() - existingProposal.submittedAt.getTime()) / (1000 * 60 * 60)
      )
      const hoursRemaining = Math.max(0, cooldownHours - hoursSince)
      const canSubmit = hoursRemaining === 0

      return NextResponse.json({
        canSubmit,
        existingProposal: {
          id: existingProposal.id,
          submittedAt: existingProposal.submittedAt,
          status: existingProposal.status,
        },
        cooldown: {
          totalHours: cooldownHours,
          hoursRemaining,
          hoursSince,
        },
      })
    }

    return NextResponse.json({
      canSubmit: true,
      existingProposal: null,
      cooldown: {
        totalHours: cooldownHours,
        hoursRemaining: 0,
        hoursSince: null,
      },
    })
  } catch (error) {
    console.error("Error checking duplicate proposal:", error)
    return NextResponse.json(
      { error: "Failed to check duplicate status" },
      { status: 500 }
    )
  }
}
