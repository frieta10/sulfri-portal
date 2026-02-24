import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Helper to clean empty strings
function cleanValue(value: unknown): string | null | undefined {
  if (value === "") return null
  if (value === undefined) return undefined
  return value as string | null
}

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
          displayName: "Mohd Sulfri Mohd Harris",
          headline: "Senior Corporate Trainer & Project Management Expert",
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

    // Build update data, cleaning empty strings
    const updateData: Record<string, string | null | undefined> = {}
    
    if (body.displayName !== undefined) updateData.displayName = body.displayName
    if (body.headline !== undefined) updateData.headline = cleanValue(body.headline)
    if (body.bio !== undefined) updateData.bio = cleanValue(body.bio)
    if (body.email !== undefined) updateData.email = cleanValue(body.email)
    if (body.phone !== undefined) updateData.phone = cleanValue(body.phone)
    if (body.linkedinUrl !== undefined) updateData.linkedinUrl = cleanValue(body.linkedinUrl)
    if (body.locationBase !== undefined) updateData.locationBase = cleanValue(body.locationBase)
    if (body.profilePhotoUrl !== undefined) updateData.profilePhotoUrl = cleanValue(body.profilePhotoUrl)
    if (body.credlyUsername !== undefined) updateData.credlyUsername = cleanValue(body.credlyUsername)

    const profile = await prisma.profileSettings.upsert({
      where: { id: "singleton" },
      update: updateData,
      create: {
        id: "singleton",
        displayName: updateData.displayName || "Sulfri Trainer",
        ...updateData,
      },
    })

    return NextResponse.json(profile)
  } catch (error: any) {
    console.error("Error updating profile:", error)

    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}
