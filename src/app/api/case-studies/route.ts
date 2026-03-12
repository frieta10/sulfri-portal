import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/case-studies - List all visible case studies (public)
export async function GET() {
  try {
    const caseStudies = await prisma.caseStudy.findMany({
      where: {
        visibility: "PUBLIC",
      },
      orderBy: [
        { displayOrder: "asc" },
        { studyDate: "desc" },
        { createdAt: "desc" },
      ],
    })

    return NextResponse.json(caseStudies)
  } catch (error) {
    console.error("Error fetching case studies:", error)
    return NextResponse.json(
      { error: "Failed to fetch case studies" },
      { status: 500 }
    )
  }
}
