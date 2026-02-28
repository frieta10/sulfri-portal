import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/badges/[slug] - Get single public badge by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const badge = await prisma.badge.findUnique({
      where: { 
        slug,
        visibility: "PUBLIC",
      },
      include: {
        badgeSkills: {
          where: {
            skill: { visibility: "PUBLIC" }
          },
          include: {
            skill: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
              },
            },
          },
          orderBy: {
            skill: { name: "asc" }
          },
        },
      },
    })

    if (!badge) {
      return NextResponse.json(
        { error: "Badge not found" },
        { status: 404 }
      )
    }

    // Transform response
    const badgeWithSkills = {
      ...badge,
      skills: badge.badgeSkills.map(bs => bs.skill),
      badgeSkills: undefined,
    }

    return NextResponse.json(badgeWithSkills)
  } catch (error) {
    console.error("Error fetching badge:", error)
    return NextResponse.json(
      { error: "Failed to fetch badge" },
      { status: 500 }
    )
  }
}
