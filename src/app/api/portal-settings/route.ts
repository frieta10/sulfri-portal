import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/portal-settings - Get public portal settings
export async function GET(request: NextRequest) {
  try {
    const settings = await prisma.portalSettings.findUnique({
      where: { id: "singleton" },
    })

    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json({
        whatsappNumber: null,
        whatsappPrefillMessage: "Hi, I'm interested in your training services.",
        stickyCtaEnabled: true,
        ga4MeasurementId: null,
        seoHomepageTitle: "MSH Corporate Trainer | Professional Training & Consulting",
        seoHomepageDescription: null,
        ogImageUrl: null,
      })
    }

    // Return only public-safe settings
    return NextResponse.json({
      whatsappNumber: settings.whatsappNumber,
      whatsappPrefillMessage: settings.whatsappPrefillMessage,
      stickyCtaEnabled: settings.stickyCtaEnabled,
      ga4MeasurementId: settings.ga4MeasurementId,
      seoHomepageTitle: settings.seoHomepageTitle,
      seoHomepageDescription: settings.seoHomepageDescription,
      ogImageUrl: settings.ogImageUrl,
    })
  } catch (error) {
    console.error("Error fetching portal settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch portal settings" },
      { status: 500 }
    )
  }
}
