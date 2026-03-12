import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/testimonials - List all visible testimonials (public)
export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: {
        visibility: "PUBLIC",
      },
      orderBy: [
        { displayOrder: "asc" },
        { createdAt: "desc" },
      ],
    })

    return NextResponse.json(testimonials)
  } catch (error) {
    console.error("Error fetching testimonials:", error)
    return NextResponse.json(
      { error: "Failed to fetch testimonials" },
      { status: 500 }
    )
  }
}
