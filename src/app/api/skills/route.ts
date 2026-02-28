import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/skills - Get all public skills with their public badges
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    const [skills, total] = await Promise.all([
      prisma.skill.findMany({
        where: {
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
                  fallbackImageUrl: true,
                  issuer: true,
                },
              },
            },
            orderBy: {
              badge: { displayOrder: "asc" }
            },
          },
        },
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        skip,
        take: limit,
      }),
      prisma.skill.count({
        where: { visibility: "PUBLIC" },
      }),
    ])

    // Transform to include badges array
    const skillsWithBadges = skills.map(skill => ({
      ...skill,
      badges: skill.badgeSkills.map(bs => bs.badge),
      badgeSkills: undefined,
      badgeCount: skill.badgeSkills.length,
    }))

    return NextResponse.json({
      skills: skillsWithBadges,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching skills:", error)
    return NextResponse.json(
      { error: "Failed to fetch skills" },
      { status: 500 }
    )
  }
}
