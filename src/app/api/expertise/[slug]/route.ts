import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/expertise/[slug] - Get single expertise node details
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const node = await prisma.expertiseNode.findUnique({
      where: { 
        slug,
        visibility: "PUBLIC"
      },
      include: {
        parent: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        children: {
          where: { visibility: "PUBLIC" },
          orderBy: [{ displayOrder: "asc" }, { title: "asc" }],
          select: {
            id: true,
            title: true,
            slug: true,
            proficiencyLevel: true,
            description: true,
          },
        },
        badgeMappings: {
          include: {
            badge: {
              select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                issuer: true,
                issueDate: true,
                fallbackImageUrl: true,
                verificationUrl: true,
                embedCode: true,
              },
            },
          },
        },
        assets: true,
      },
    })

    if (!node) {
      return NextResponse.json({ error: "Expertise node not found" }, { status: 404 })
    }

    return NextResponse.json({
      ...node,
      badges: node.badgeMappings.map((mapping) => mapping.badge),
    })
  } catch (error: any) {
    console.error("Error fetching expertise node:", error)
    return NextResponse.json({ error: "Failed to fetch expertise node" }, { status: 500 })
  }
}
