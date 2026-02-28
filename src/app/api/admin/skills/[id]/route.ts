import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { skillUpdateSchema } from "@/lib/validations/skill"

// GET /api/admin/skills/[id] - Get single skill (admin only)
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

    const skill = await prisma.skill.findUnique({
      where: { id },
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
              },
            },
          },
        },
        _count: {
          select: {
            badgeSkills: true,
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

    // Transform to include badge count
    const skillWithCount = {
      ...skill,
      badgeCount: skill._count.badgeSkills,
      badges: skill.badgeSkills.map(bs => bs.badge),
      badgeSkills: undefined,
      _count: undefined,
    }

    return NextResponse.json(skillWithCount)
  } catch (error) {
    console.error("Error fetching skill:", error)
    return NextResponse.json(
      { error: "Failed to fetch skill" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/skills/[id] - Update skill (admin only)
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
    const validationResult = skillUpdateSchema.safeParse({ ...body, id })
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if skill exists
    const existingSkill = await prisma.skill.findUnique({
      where: { id },
    })

    if (!existingSkill) {
      return NextResponse.json(
        { error: "Skill not found" },
        { status: 404 }
      )
    }

    // Check for slug conflict if slug is being updated
    if (data.slug && data.slug !== existingSkill.slug) {
      const slugConflict = await prisma.skill.findUnique({
        where: { slug: data.slug },
      })
      if (slugConflict) {
        return NextResponse.json(
          { error: "A skill with this slug already exists" },
          { status: 409 }
        )
      }
    }

    // Check for name conflict if name is being updated
    if (data.name && data.name !== existingSkill.name) {
      const nameConflict = await prisma.skill.findUnique({
        where: { name: data.name },
      })
      if (nameConflict) {
        return NextResponse.json(
          { error: "A skill with this name already exists" },
          { status: 409 }
        )
      }
    }

    const skill = await prisma.skill.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        visibility: data.visibility,
        displayOrder: data.displayOrder,
      },
      include: {
        _count: {
          select: {
            badgeSkills: true,
          },
        },
      },
    })

    // Transform to include badge count
    const skillWithCount = {
      ...skill,
      badgeCount: skill._count.badgeSkills,
      _count: undefined,
    }

    return NextResponse.json(skillWithCount)
  } catch (error: any) {
    console.error("Error updating skill:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update skill" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/skills/[id] - Delete skill (admin only)
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

    // Check if skill exists
    const existingSkill = await prisma.skill.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            badgeSkills: true,
          },
        },
      },
    })

    if (!existingSkill) {
      return NextResponse.json(
        { error: "Skill not found" },
        { status: 404 }
      )
    }

    // Check if skill has associated badges
    if (existingSkill._count.badgeSkills > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete skill with associated badges",
          details: {
            badgeCount: existingSkill._count.badgeSkills,
            message: "Please remove this skill from all badges before deleting.",
          },
        },
        { status: 409 }
      )
    }

    await prisma.skill.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting skill:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete skill" },
      { status: 500 }
    )
  }
}
