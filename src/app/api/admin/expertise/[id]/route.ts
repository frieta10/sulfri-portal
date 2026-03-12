import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/expertise/[id] - Get single expertise node (admin only)
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

    const node = await prisma.expertiseNode.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, title: true, slug: true },
        },
        children: {
          select: { id: true, title: true, slug: true },
          orderBy: { displayOrder: "asc" },
        },
        badgeMappings: {
          include: {
            badge: {
              select: { id: true, title: true, slug: true, fallbackImageUrl: true },
            },
          },
        },
        assets: true,
      },
    })

    if (!node) {
      return NextResponse.json({ error: "Expertise node not found" }, { status: 404 })
    }

    return NextResponse.json(node)
  } catch (error: any) {
    console.error("Error fetching expertise node:", error)
    return NextResponse.json({ error: "Failed to fetch expertise node" }, { status: 500 })
  }
}

// PATCH /api/admin/expertise/[id] - Update expertise node (admin only)
export async function PATCH(
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

    // Calculate new depth if parent changed
    let depth = body.depth
    if (body.parentId !== undefined) {
      if (body.parentId) {
        const parent = await prisma.expertiseNode.findUnique({
          where: { id: body.parentId },
          select: { depth: true },
        })
        if (parent) {
          depth = parent.depth + 1
        }
      } else {
        depth = 1
      }
    }

    const node = await prisma.expertiseNode.update({
      where: { id },
      data: {
        title: body.title,
        slug: body.slug,
        description: body.description,
        parentId: body.parentId,
        domain: body.domain,
        depth,
        proficiencyLevel: body.proficiencyLevel,
        visibility: body.visibility,
        displayOrder: body.displayOrder,
      },
    })

    return NextResponse.json(node)
  } catch (error: any) {
    console.error("Error updating expertise node:", error)
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A node with this slug already exists" }, { status: 409 })
    }
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Expertise node not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to update expertise node" }, { status: 500 })
  }
}

// DELETE /api/admin/expertise/[id] - Delete expertise node (admin only)
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

    await prisma.expertiseNode.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting expertise node:", error)
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Expertise node not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to delete expertise node" }, { status: 500 })
  }
}
