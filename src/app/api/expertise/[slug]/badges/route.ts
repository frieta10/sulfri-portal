import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/expertise/[slug]/badges - Get badges linked to an expertise node
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Find the expertise node
    const node = await prisma.expertiseNode.findUnique({
      where: { 
        slug,
        visibility: "PUBLIC"
      },
    })

    if (!node) {
      return NextResponse.json({ error: "Expertise node not found" }, { status: 404 })
    }

    // Get all badge mappings for this node
    const mappings = await prisma.badgeExpertiseMap.findMany({
      where: { expertiseNodeId: node.id },
    })

    // Get the actual badge data for each mapping
    const badgeIds = mappings.map((m) => m.badgeId)
    
    const badges = await prisma.badge.findMany({
      where: { 
        id: { in: badgeIds },
        visibility: "PUBLIC"
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        issuer: true,
        issueDate: true,
        expiryDate: true,
        fallbackImageUrl: true,
        verificationUrl: true,
        embedCode: true,
        credlyHost: true,
        credlyBadgeId: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(badges)
  } catch (error: any) {
    console.error("Error fetching badges for expertise node:", error)
    return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 })
  }
}
