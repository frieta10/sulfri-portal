import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/badge-expertise-map - List badge-expertise mappings (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const badgeId = searchParams.get("badgeId")
    const expertiseNodeId = searchParams.get("expertiseNodeId")

    const where: any = {}
    if (badgeId) where.badgeId = badgeId
    if (expertiseNodeId) where.expertiseNodeId = expertiseNodeId

    const mappings = await prisma.badgeExpertiseMap.findMany({
      where,
      include: {
        badge: {
          select: {
            id: true,
            title: true,
            slug: true,
            fallbackImageUrl: true,
          },
        },
        expertiseNode: {
          select: {
            id: true,
            title: true,
            slug: true,
            domain: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(mappings)
  } catch (error: any) {
    console.error("Error fetching badge-expertise mappings:", error)
    return NextResponse.json({ error: "Failed to fetch mappings" }, { status: 500 })
  }
}

// POST /api/admin/badge-expertise-map - Create mapping (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    if (!body.badgeId || !body.expertiseNodeId) {
      return NextResponse.json(
        { error: "badgeId and expertiseNodeId are required" },
        { status: 400 }
      )
    }

    const mapping = await prisma.badgeExpertiseMap.create({
      data: {
        badgeId: body.badgeId,
        expertiseNodeId: body.expertiseNodeId,
        mappingSource: body.mappingSource || "MANUAL",
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
        expertiseNode: {
          select: {
            id: true,
            title: true,
            slug: true,
            domain: true,
          },
        },
      },
    })

    return NextResponse.json(mapping, { status: 201 })
  } catch (error: any) {
    console.error("Error creating badge-expertise mapping:", error)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "This badge is already mapped to this expertise node" },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: "Failed to create mapping" }, { status: 500 })
  }
}

// DELETE /api/admin/badge-expertise-map - Delete mapping (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const badgeId = searchParams.get("badgeId")
    const expertiseNodeId = searchParams.get("expertiseNodeId")

    if (!badgeId || !expertiseNodeId) {
      return NextResponse.json(
        { error: "badgeId and expertiseNodeId are required" },
        { status: 400 }
      )
    }

    await prisma.badgeExpertiseMap.delete({
      where: {
        badgeId_expertiseNodeId: {
          badgeId,
          expertiseNodeId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting badge-expertise mapping:", error)
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Mapping not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to delete mapping" }, { status: 500 })
  }
}
