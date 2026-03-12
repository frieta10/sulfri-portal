import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/event/settings
 * Returns public-safe event settings
 */
export async function GET(request: NextRequest) {
  try {
    let settings = await prisma.eventSettings.findUnique({
      where: { id: "singleton" },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.eventSettings.create({
        data: {
          id: "singleton",
        },
      });
    }

    return NextResponse.json({
      yayasanNoticeText: settings.yayasanNoticeText,
      registrationPageTitle: settings.registrationPageTitle,
      registrationPageTagline: settings.registrationPageTagline,
    });
  } catch (error) {
    console.error("Error fetching event settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}
