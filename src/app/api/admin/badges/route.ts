import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { badgeCreateSchema, generateSlug } from "@/lib/validations/badge"

// GET /api/admin/badges - Get all badges (admin only, includes hidden)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Fetching badges for user:", session.user?.email)

    // Fetch badges with their skills through the explicit junction table
    const badges = await prisma.badge.findMany({
      include: {
        badgeSkills: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    })

    console.log(`Found ${badges.length} badges`)

    // Transform to match the expected format (skills array)
    const badgesWithSkills = badges.map(badge => ({
      ...badge,
      skills: badge.badgeSkills.map(bs => bs.skill),
      badgeSkills: undefined, // Remove the raw junction data
    }))

    return NextResponse.json(badgesWithSkills)
  } catch (error: any) {
    console.error("Error fetching badges:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch badges",
        details: error.message,
        code: error.code
      },
      { status: 500 }
    )
  }
}

// POST /api/admin/badges - Create new badge (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Creating badge:", body.title)

    // Validate input
    const validationResult = badgeCreateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Generate slug if not provided
    const slug = data.slug || generateSlug(data.title)

    // Check for duplicate slug
    const existingBadge = await prisma.badge.findUnique({
      where: { slug },
    })

    if (existingBadge) {
      return NextResponse.json(
        { error: "A badge with this slug already exists" },
        { status: 409 }
      )
    }

    // Create badge with skill connections through junction table
    const badge = await prisma.badge.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        issuer: data.issuer,
        issueDate: data.issueDate ? new Date(data.issueDate) : null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        credlyBadgeId: data.credlyBadgeId,
        credlyHost: data.credlyHost,
        iframeWidth: data.iframeWidth,
        iframeHeight: data.iframeHeight,
        verificationUrl: data.verificationUrl,
        featured: data.featured,
        visibility: data.visibility,
        displayOrder: data.displayOrder,
        fallbackImageUrl: data.fallbackImageUrl,
        embedCode: data.embedCode,
        badgeSkills: data.skillIds?.length > 0 ? {
          create: data.skillIds.map(skillId => ({
            skill: { connect: { id: skillId } }
          })),
        } : undefined,
      },
      include: {
        badgeSkills: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    // Transform response
    const badgeWithSkills = {
      ...badge,
      skills: badge.badgeSkills.map(bs => bs.skill),
      badgeSkills: undefined,
    }

    console.log("Badge created:", badge.id)
    return NextResponse.json(badgeWithSkills, { status: 201 })
  } catch (error: any) {
    console.error("Error creating badge:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create badge" },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/badges - Bulk update badge order (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Handle bulk reorder
    if (body.badges && Array.isArray(body.badges)) {
      const updates = body.badges.map((badge: { id: string; displayOrder: number }) =>
        prisma.badge.update({
          where: { id: badge.id },
          data: { displayOrder: badge.displayOrder },
        })
      )

      await prisma.$transaction(updates)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: "Invalid request format. Expected badges array." },
      { status: 400 }
    )
  } catch (error: any) {
    console.error("Error updating badge order:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update badge order" },
      { status: 500 }
    )
  }
}
