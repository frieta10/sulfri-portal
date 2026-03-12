import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/expertise/tree - Get complete expertise tree structure
export async function GET() {
  try {
    // Fetch all public expertise nodes with their children
    const nodes = await prisma.expertiseNode.findMany({
      where: { visibility: "PUBLIC" },
      orderBy: [{ domain: "asc" }, { displayOrder: "asc" }, { title: "asc" }],
      include: {
        children: {
          where: { visibility: "PUBLIC" },
          orderBy: [{ displayOrder: "asc" }, { title: "asc" }],
        },
        badgeMappings: true,
      },
    })

    // Build tree structure (only root nodes with their children)
    const rootNodes = nodes.filter((node) => !node.parentId)

    // Transform to include badge count
    const treeData = rootNodes.map((node) => ({
      id: node.id,
      title: node.title,
      slug: node.slug,
      description: node.description,
      domain: node.domain,
      proficiencyLevel: node.proficiencyLevel,
      badgeCount: node.badgeMappings?.length || 0,
      children: (node.children || []).map((child) => ({
        id: child.id,
        title: child.title,
        slug: child.slug,
        description: child.description,
        domain: child.domain,
        proficiencyLevel: child.proficiencyLevel,
        badgeCount: 0, // Will be populated below
        children: [], // Leaf nodes have no children
      })),
    }))

    // Get badge counts for children
    for (const rootNode of treeData) {
      for (const child of rootNode.children) {
        const childNode = nodes.find((n) => n.id === child.id)
        child.badgeCount = childNode?.badgeMappings?.length || 0
      }
    }

    return NextResponse.json(treeData)
  } catch (error: any) {
    console.error("Error fetching expertise tree:", error)
    return NextResponse.json({ error: "Failed to fetch expertise tree", details: error.message }, { status: 500 })
  }
}
