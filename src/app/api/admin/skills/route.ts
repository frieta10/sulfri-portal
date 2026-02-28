import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { skillCreateSchema, generateSkillSlug } from "@/lib/validations/skill"

// GET /api/admin/skills - Get all skills (admin only, includes hidden)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Fetching skills for user:", session.user?.email)

    const skills = await prisma.skill.findMany({
      include: {
        _count: {
          select: {
            badgeSkills: true,
          },
        },
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    })

    console.log(`Found ${skills.length} skills`)

    // Transform to include badge count
    const skillsWithCount = skills.map(skill => ({
      ...skill,
      badgeCount: skill._count.badgeSkills,
      _count: undefined,
    }))

    return NextResponse.json(skillsWithCount)
  } catch (error: any) {
    console.error("Error fetching skills:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch skills",
        details: error.message,
        code: error.code
      },
      { status: 500 }
    )
  }
}

// POST /api/admin/skills - Create new skill (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = skillCreateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Generate slug if not provided
    const slug = data.slug || generateSkillSlug(data.name)

    // Check for duplicate slug
    const existingSkill = await prisma.skill.findUnique({
      where: { slug },
    })

    if (existingSkill) {
      return NextResponse.json(
        { error: "A skill with this slug already exists" },
        { status: 409 }
      )
    }

    // Check for duplicate name
    const existingName = await prisma.skill.findUnique({
      where: { name: data.name },
    })

    if (existingName) {
      return NextResponse.json(
        { error: "A skill with this name already exists" },
        { status: 409 }
      )
    }

    const skill = await prisma.skill.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        visibility: data.visibility,
        displayOrder: data.displayOrder,
      },
    })

    return NextResponse.json(skill, { status: 201 })
  } catch (error: any) {
    console.error("Error creating skill:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create skill" },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/skills - Bulk update skill order (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Handle bulk reorder
    if (body.skills && Array.isArray(body.skills)) {
      const updates = body.skills.map((skill: { id: string; displayOrder: number }) =>
        prisma.skill.update({
          where: { id: skill.id },
          data: { displayOrder: skill.displayOrder },
        })
      )

      await prisma.$transaction(updates)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: "Invalid request format. Expected skills array." },
      { status: 400 }
    )
  } catch (error: any) {
    console.error("Error updating skill order:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update skill order" },
      { status: 500 }
    )
  }
}
