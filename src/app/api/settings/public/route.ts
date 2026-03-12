import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/settings/public - Get public-safe SEO settings
export async function GET() {
  try {
    const settings = await prisma.portalSettings.findUnique({
      where: { id: "singleton" },
    })

    if (!settings) {
      // Return default values if settings don't exist
      return NextResponse.json({
        // SEO Settings
        seoHomepageTitle: "MSH Corporate Trainer | Professional Training & Consulting",
        seoHomepageDescription: "Professional corporate training and consulting services in project management, digital transformation, and leadership development.",
        ogImageUrl: null,

        // WhatsApp Configuration
        whatsappNumber: null,
        whatsappPrefillMessage: "Hi, I'm interested in your training services.",

        // Sticky CTA
        stickyCtaEnabled: true,

        // Google Analytics (only return if configured)
        ga4MeasurementId: null,

        // Proposal Settings
        proposalDuplicateCooldownHours: 48,
      })
    }

    // Return only public-safe settings
    return NextResponse.json({
      // SEO Settings
      seoHomepageTitle: settings.seoHomepageTitle,
      seoHomepageDescription: settings.seoHomepageDescription,
      ogImageUrl: settings.ogImageUrl,

      // WhatsApp Configuration
      whatsappNumber: settings.whatsappNumber,
      whatsappPrefillMessage: settings.whatsappPrefillMessage,

      // Sticky CTA
      stickyCtaEnabled: settings.stickyCtaEnabled,

      // Google Analytics (only return if configured)
      ga4MeasurementId: settings.ga4MeasurementId,

      // Proposal Settings
      proposalDuplicateCooldownHours: settings.proposalDuplicateCooldownHours,
    })
  } catch (error) {
    console.error("Error fetching public settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}
