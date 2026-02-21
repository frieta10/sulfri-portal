import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateClassSchema } from "@/lib/validations/class"

// GET /api/classes/[id] - Get a single class
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const classItem = await prisma.class.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    })

    if (!classItem) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    return NextResponse.json(classItem)
  } catch (error) {
    console.error("Error fetching class:", error)
    return NextResponse.json(
      { error: "Failed to fetch class" },
      { status: 500 }
    )
  }
}

// PUT /api/classes/[id] - Update a class
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate the request body
    const validatedData = updateClassSchema.parse(body)

    // Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id: params.id },
    })

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = { ...validatedData }

    // Convert date strings to Date objects if provided
    if (validatedData.startDatetime) {
      updateData.startDatetime = new Date(validatedData.startDatetime)
    }
    if (validatedData.endDatetime) {
      updateData.endDatetime = new Date(validatedData.endDatetime)
    }

    // Update the class
    const updatedClass = await prisma.class.update({
      where: { id: params.id },
      data: updateData,
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    })

    return NextResponse.json(updatedClass)
  } catch (error: any) {
    console.error("Error updating class:", error)

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update class" },
      { status: 500 }
    )
  }
}

// DELETE /api/classes/[id] - Delete a class
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id: params.id },
    })

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Delete the class (registrations will be cascade deleted)
    await prisma.class.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Class deleted successfully" })
  } catch (error) {
    console.error("Error deleting class:", error)
    return NextResponse.json(
      { error: "Failed to delete class" },
      { status: 500 }
    )
  }
}
