import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { eventSettingsSchema } from "@/lib/validations/event-registration"

// GET /api/admin/event/settings - Get event settings (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let settings = await prisma.eventSettings.findUnique({
      where: { id: "singleton" },
    })

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.eventSettings.create({
        data: {
          id: "singleton",
        },
      })
    }

    return NextResponse.json(settings)
    
  } catch (error: any) {
    console.error("Error fetching event settings:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch event settings" },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/event/settings - Update event settings (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = eventSettingsSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Use upsert to handle the singleton pattern
    const settings = await prisma.eventSettings.upsert({
      where: { id: "singleton" },
      update: {
        yayasanNoticeText: data.yayasanNoticeText,
        registrationPageTitle: data.registrationPageTitle,
        registrationPageTagline: data.registrationPageTagline,
        duplicateCooldownHours: data.duplicateCooldownHours,
      },
      create: {
        id: "singleton",
        yayasanNoticeText: data.yayasanNoticeText,
        registrationPageTitle: data.registrationPageTitle,
        registrationPageTagline: data.registrationPageTagline,
        duplicateCooldownHours: data.duplicateCooldownHours,
      },
    })

    return NextResponse.json(settings)
    
  } catch (error: any) {
    console.error("Error updating event settings:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update event settings" },
      { status: 500 }
    )
  }
}
