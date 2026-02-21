import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { profileSchema } from "@/lib/validations/profile"

// GET /api/profile - Get profile settings (public)
export async function GET() {
  try {
    let profile = await prisma.profileSettings.findUnique({
      where: { id: "singleton" },
    })

    if (!profile) {
      // Create default profile if not exists
      profile = await prisma.profileSettings.create({
        data: {
          id: "singleton",
          displayName: "Sulfri Trainer",
          headline: "Professional Trainer & Consultant",
        },
      })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

// PUT /api/profile - Update profile settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = profileSchema.parse(body)

    const profile = await prisma.profileSettings.upsert({
      where: { id: "singleton" },
      update: {
        ...validatedData,
        // Convert empty strings to null
        email: validatedData.email || null,
        linkedinUrl: validatedData.linkedinUrl || null,
        profilePhotoUrl: validatedData.profilePhotoUrl || null,
      },
      create: {
        id: "singleton",
        ...validatedData,
      },
    })

    return NextResponse.json(profile)
  } catch (error: any) {
    console.error("Error updating profile:", error)

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}
