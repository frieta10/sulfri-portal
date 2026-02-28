import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Helper to clean empty strings
function cleanValue(value: unknown): string | null {
  if (value === "" || value === undefined || value === null) return null
  return String(value)
}

// GET /api/profile - Get profile settings (public)
export async function GET() {
  try {
    console.log("Fetching profile...")
    
    let profile = await prisma.profileSettings.findUnique({
      where: { id: "singleton" },
    })

    if (!profile) {
      console.log("Creating default profile...")
      profile = await prisma.profileSettings.create({
        data: {
          id: "singleton",
          displayName: "Mohd Sulfri Mohd Harris",
          headline: "Senior Corporate Trainer & Project Management Expert",
        },
      })
    }

    console.log("Profile fetched successfully:", profile.displayName)
    return NextResponse.json(profile)
    
  } catch (error: any) {
    console.error("Error fetching profile:", error.message, error.code)
    
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

// PUT /api/profile - Update profile settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    console.log("Updating profile...")
    
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log("Unauthorized update attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Update data received:", Object.keys(body))

    // Build update data - only include defined fields
    const updateData: Record<string, string | null> = {}
    
    if (body.displayName !== undefined) updateData.displayName = cleanValue(body.displayName) || "Sulfri Trainer"
    if (body.headline !== undefined) updateData.headline = cleanValue(body.headline)
    if (body.bio !== undefined) updateData.bio = cleanValue(body.bio)
    if (body.email !== undefined) updateData.email = cleanValue(body.email)
    if (body.phone !== undefined) updateData.phone = cleanValue(body.phone)
    if (body.linkedinUrl !== undefined) updateData.linkedinUrl = cleanValue(body.linkedinUrl)
    if (body.locationBase !== undefined) updateData.locationBase = cleanValue(body.locationBase)
    if (body.profilePhotoUrl !== undefined) updateData.profilePhotoUrl = cleanValue(body.profilePhotoUrl)

    console.log("Prepared update data:", Object.keys(updateData))

    const profile = await prisma.profileSettings.upsert({
      where: { id: "singleton" },
      update: updateData,
      create: {
        id: "singleton",
        displayName: updateData.displayName || "Sulfri Trainer",
        ...updateData,
      },
    })

    console.log("Profile updated successfully")
    return NextResponse.json(profile)
    
  } catch (error: any) {
    console.error("Error updating profile:", error.message, error.code)

    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    )
  }
}
