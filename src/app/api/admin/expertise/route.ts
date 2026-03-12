import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/expertise - List all expertise nodes (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const nodes = await prisma.expertiseNode.findMany({
      orderBy: [{ domain: "asc" }, { displayOrder: "asc" }, { title: "asc" }],
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
              select: { id: true, title: true, slug: true },
            },
          },
        },
        assets: true,
      },
    })

    return NextResponse.json(nodes)
  } catch (error: any) {
    console.error("Error fetching expertise nodes:", error)
    return NextResponse.json({ error: "Failed to fetch expertise nodes" }, { status: 500 })
  }
}

// POST /api/admin/expertise - Create new expertise node (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    
    // Generate slug if not provided
    const slug = body.slug || generateSlug(body.title)
    
    // Calculate depth based on parent
    let depth = 1
    if (body.parentId) {
      const parent = await prisma.expertiseNode.findUnique({
        where: { id: body.parentId },
        select: { depth: true },
      })
      if (parent) {
        depth = parent.depth + 1
      }
    }

    const node = await prisma.expertiseNode.create({
      data: {
        title: body.title,
        slug,
        description: body.description,
        parentId: body.parentId,
        domain: body.domain,
        depth,
        proficiencyLevel: body.proficiencyLevel || "FOUNDATION",
        visibility: body.visibility || "PUBLIC",
        displayOrder: body.displayOrder || 0,
      },
    })

    return NextResponse.json(node, { status: 201 })
  } catch (error: any) {
    console.error("Error creating expertise node:", error)
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A node with this slug already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create expertise node" }, { status: 500 })
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}
