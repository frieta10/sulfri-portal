import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema for settings update
const settingsUpdateSchema = z.object({
  seoHomepageTitle: z.string().optional().nullable(),
  seoHomepageDescription: z.string().optional().nullable(),
  ogImageUrl: z.string().optional().nullable(),
  whatsappNumber: z.string().optional().nullable(),
  whatsappPrefillMessage: z.string().optional().nullable(),
  stickyCtaEnabled: z.boolean().optional(),
  ga4MeasurementId: z.string().optional().nullable(),
  proposalDuplicateCooldownHours: z.number().int().min(1).max(168).optional(),
  followUpTriggerDays: z.number().int().min(1).max(30).optional(),
  emailConfirmationSubject: z.string().optional().nullable(),
  emailConfirmationBody: z.string().optional().nullable(),
  emailFollowupSubject: z.string().optional().nullable(),
  emailFollowupBody: z.string().optional().nullable(),
  pdfIncludeCertifications: z.boolean().optional(),
  pdfIncludeExpertise: z.boolean().optional(),
  pdfIncludeClients: z.boolean().optional(),
  pdfIncludeExperience: z.boolean().optional(),
})

// GET /api/admin/settings - Get all portal settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if prisma is connected
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (dbError) {
      console.error("Database connection error:", dbError)
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      )
    }

    let settings = await prisma.portalSettings.findUnique({
      where: { id: "singleton" },
    })

    // Create default settings if they don't exist
    if (!settings) {
      try {
        settings = await prisma.portalSettings.create({
          data: { id: "singleton" },
        })
      } catch (createError) {
        console.error("Error creating default settings:", createError)
        // Return default settings without saving
        return NextResponse.json({
          id: "singleton",
          whatsappNumber: null,
          whatsappPrefillMessage: "Hi, I'm interested in your training services.",
          stickyCtaEnabled: true,
          ga4MeasurementId: null,
          seoHomepageTitle: "MSH Corporate Trainer | Professional Training & Consulting",
          seoHomepageDescription: null,
          ogImageUrl: null,
          proposalDuplicateCooldownHours: 48,
          followUpTriggerDays: 3,
          emailConfirmationSubject: "Thank you for your interest",
          emailConfirmationBody: null,
          emailFollowupSubject: "Following up on your training inquiry",
          emailFollowupBody: null,
          pdfIncludeCertifications: true,
          pdfIncludeExpertise: true,
          pdfIncludeClients: true,
          pdfIncludeExperience: true,
          updatedAt: new Date(),
        })
      }
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/settings - Update portal settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = settingsUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if settings exist first
    const existingSettings = await prisma.portalSettings.findUnique({
      where: { id: "singleton" },
    })

    let settings
    if (!existingSettings) {
      // Create new settings
      settings = await prisma.portalSettings.create({
        data: {
          id: "singleton",
          ...data,
        },
      })
    } else {
      // Update existing settings
      settings = await prisma.portalSettings.update({
        where: { id: "singleton" },
        data,
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json(
      { error: "Failed to update settings", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
