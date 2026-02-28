import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/badges - Get all public badges
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const featured = searchParams.get("featured")
    const skillSlug = searchParams.get("skill")
    const search = searchParams.get("search")
    const sortBy = searchParams.get("sort") || "newest" // newest, featured, alphabetical
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10), 100) // Max 100 per page

    // Build where clause
    const where: any = {
      visibility: "PUBLIC",
    }

    // Filter by featured
    if (featured === "true") {
      where.featured = true
    }

    // Filter by skill
    if (skillSlug) {
      where.badgeSkills = {
        some: {
          skill: {
            slug: skillSlug,
            visibility: "PUBLIC",
          },
        },
      }
    }

    // Search by title or issuer
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { issuer: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    // Build order by
    let orderBy: any = {}
    switch (sortBy) {
      case "featured":
        orderBy = [{ featured: "desc" }, { displayOrder: "asc" }, { createdAt: "desc" }]
        break
      case "alphabetical":
        orderBy = { title: "asc" }
        break
      case "newest":
      default:
        orderBy = [{ issueDate: "desc" }, { createdAt: "desc" }]
        break
    }

    // Get total count
    const totalCount = await prisma.badge.count({ where })

    // Get badges with pagination
    const badges = await prisma.badge.findMany({
      where,
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
              },
            },
          },
          orderBy: {
            skill: { name: "asc" }
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    })

    // Transform to match expected format
    const badgesWithSkills = badges.map(badge => ({
      ...badge,
      skills: badge.badgeSkills.map(bs => bs.skill),
      badgeSkills: undefined,
    }))

    return NextResponse.json({
      badges: badgesWithSkills,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount,
      },
    })
  } catch (error) {
    console.error("Error fetching badges:", error)
    return NextResponse.json(
      { error: "Failed to fetch badges" },
      { status: 500 }
    )
  }
}
