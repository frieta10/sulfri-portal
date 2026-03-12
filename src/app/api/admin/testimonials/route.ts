import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { testimonialCreateSchema } from "@/lib/validations/testimonial"

// GET /api/admin/testimonials - List all testimonials (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const testimonials = await prisma.testimonial.findMany({
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

// POST /api/admin/testimonials - Create new testimonial (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = testimonialCreateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const data = validationResult.data

    const testimonial = await prisma.testimonial.create({
      data: {
        quote: data.quote,
        authorName: data.authorName,
        authorTitle: data.authorTitle,
        authorOrganisation: data.authorOrganisation,
        photoUrl: data.photoUrl,
        rating: data.rating,
        visibility: data.visibility,
        displayOrder: data.displayOrder,
      },
    })

    return NextResponse.json(testimonial, { status: 201 })
  } catch (error: any) {
    console.error("Error creating testimonial:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create testimonial" },
      { status: 500 }
    )
  }
}
