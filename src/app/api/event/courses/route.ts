import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/event/courses
 * Returns all published and public courses for the event registration form
 */
export async function GET(request: NextRequest) {
  try {
    const courses = await prisma.eventCourse.findMany({
      where: {
        status: "PUBLISHED",
        visibility: "PUBLIC",
      },
      orderBy: {
        displayOrder: "asc",
      },
      select: {
        id: true,
        title: true,
        shortDescription: true,
        deliveryMode: true,
        startDate: true,
        endDate: true,
        location: true,
      },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Error fetching event courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
