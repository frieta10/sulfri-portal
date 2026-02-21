import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/classes/[id]/registrations - List registrations for a class
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if class exists
    const classItem = await prisma.class.findUnique({
      where: { id: params.id },
      select: { id: true, title: true, joinCode: true },
    })

    if (!classItem) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")

    const where: any = { classId: params.id }

    // Search by name or email
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { organization: { contains: search, mode: "insensitive" } },
      ]
    }

    const registrations = await prisma.registration.findMany({
      where,
      orderBy: { registeredAt: "desc" },
    })

    return NextResponse.json({
      class: classItem,
      registrations,
      total: registrations.length,
    })
  } catch (error) {
    console.error("Error fetching registrations:", error)
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 }
    )
  }
}
