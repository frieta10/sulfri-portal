import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { badgeUpdateSchema } from "@/lib/validations/badge"

// GET /api/admin/badges/[id] - Get single badge (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const badge = await prisma.badge.findUnique({
      where: { id },
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

// PUT /api/admin/badges/[id] - Update badge (admin only)
export async function PUT(
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

    // Validate input
    const validationResult = badgeUpdateSchema.safeParse({ ...body, id })
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if badge exists
    const existingBadge = await prisma.badge.findUnique({
      where: { id },
    })

    if (!existingBadge) {
      return NextResponse.json(
        { error: "Badge not found" },
        { status: 404 }
      )
    }

    // Check for slug conflict if slug is being updated
    if (data.slug && data.slug !== existingBadge.slug) {
      const slugConflict = await prisma.badge.findUnique({
        where: { slug: data.slug },
      })
      if (slugConflict) {
        return NextResponse.json(
          { error: "A badge with this slug already exists" },
          { status: 409 }
        )
      }
    }

    // Build update data
    const updateData: any = {}
    
    if (data.title !== undefined) updateData.title = data.title
    if (data.slug !== undefined) updateData.slug = data.slug
    if (data.description !== undefined) updateData.description = data.description
    if (data.issuer !== undefined) updateData.issuer = data.issuer
    if (data.issueDate !== undefined) updateData.issueDate = data.issueDate ? new Date(data.issueDate) : null
    if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null
    if (data.credlyBadgeId !== undefined) updateData.credlyBadgeId = data.credlyBadgeId
    if (data.credlyHost !== undefined) updateData.credlyHost = data.credlyHost
    if (data.iframeWidth !== undefined) updateData.iframeWidth = data.iframeWidth
    if (data.iframeHeight !== undefined) updateData.iframeHeight = data.iframeHeight
    if (data.verificationUrl !== undefined) updateData.verificationUrl = data.verificationUrl
    if (data.featured !== undefined) updateData.featured = data.featured
    if (data.visibility !== undefined) updateData.visibility = data.visibility
    if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder
    if (data.fallbackImageUrl !== undefined) updateData.fallbackImageUrl = data.fallbackImageUrl
    if (data.embedCode !== undefined) updateData.embedCode = data.embedCode

    // Handle skill relationships
    if (data.skillIds !== undefined) {
      // Delete existing relations and create new ones
      await prisma.badgeSkill.deleteMany({
        where: { badgeId: id }
      })
      
      if (data.skillIds.length > 0) {
        await prisma.badgeSkill.createMany({
          data: data.skillIds.map((skillId: string) => ({
            badgeId: id,
            skillId: skillId,
          })),
        })
      }
    }

    const badge = await prisma.badge.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(badgeWithSkills)
  } catch (error: any) {
    console.error("Error updating badge:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update badge" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/badges/[id] - Delete badge (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if badge exists
    const existingBadge = await prisma.badge.findUnique({
      where: { id },
    })

    if (!existingBadge) {
      return NextResponse.json(
        { error: "Badge not found" },
        { status: 404 }
      )
    }

    await prisma.badge.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting badge:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete badge" },
      { status: 500 }
    )
  }
}
