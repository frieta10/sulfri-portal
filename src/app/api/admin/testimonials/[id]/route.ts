import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { testimonialUpdateSchema } from "@/lib/validations/testimonial"

// PATCH /api/admin/testimonials/[id] - Update testimonial (admin only)
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

    // Validate input
    const validationResult = testimonialUpdateSchema.safeParse({ ...body, id })
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if testimonial exists
    const existingTestimonial = await prisma.testimonial.findUnique({
      where: { id },
    })

    if (!existingTestimonial) {
      return NextResponse.json(
        { error: "Testimonial not found" },
        { status: 404 }
      )
    }

    const testimonial = await prisma.testimonial.update({
      where: { id },
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

    return NextResponse.json(testimonial)
  } catch (error: any) {
    console.error("Error updating testimonial:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update testimonial" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/testimonials/[id] - Delete testimonial (admin only)
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

    // Check if testimonial exists
    const existingTestimonial = await prisma.testimonial.findUnique({
      where: { id },
    })

    if (!existingTestimonial) {
      return NextResponse.json(
        { error: "Testimonial not found" },
        { status: 404 }
      )
    }

    await prisma.testimonial.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting testimonial:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete testimonial" },
      { status: 500 }
    )
  }
}
