import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/skills/[slug] - Get single public skill by slug with its public badges
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const skill = await prisma.skill.findUnique({
      where: { 
        slug,
        visibility: "PUBLIC",
      },
      include: {
        badgeSkills: {
          where: {
            badge: { visibility: "PUBLIC" }
          },
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
              },
            },
          },
          orderBy: {
            badge: { displayOrder: "asc" }
          },
        },
      },
    })

    if (!skill) {
      return NextResponse.json(
        { error: "Skill not found" },
        { status: 404 }
      )
    }

    // Transform to include badges array
    const skillWithBadges = {
      ...skill,
      badges: skill.badgeSkills.map(bs => bs.badge),
      badgeSkills: undefined,
      badgeCount: skill.badgeSkills.length,
    }

    return NextResponse.json(skillWithBadges)
  } catch (error) {
    console.error("Error fetching skill:", error)
    return NextResponse.json(
      { error: "Failed to fetch skill" },
      { status: 500 }
    )
  }
}
