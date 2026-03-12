import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { eventRegistrationSchema } from "@/lib/validations/event-registration";
import { checkRateLimit } from "@/lib/utils/rate-limit";

/**
 * POST /api/event/register
 * Submits participant registration form
 * Rate limited: 10 submissions per IP per hour
 */
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";
    
    // Check rate limit (10 submissions per IP per hour)
    if (!checkRateLimit(`event_register_ip:${clientIp}`, 10, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validationResult = eventRegistrationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid form data", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { fullName, email, phone, organisation, jobTitle, courseIds, consentFlag, utmSource } = validationResult.data;

    // Check for duplicate submission within cooldown period
    const settings = await prisma.eventSettings.findUnique({
      where: { id: "singleton" },
    });
    const cooldownHours = settings?.duplicateCooldownHours ?? 24;
    const cooldownDate = new Date(Date.now() - cooldownHours * 60 * 60 * 1000);

    const existingLead = await prisma.eventLead.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        registeredAt: {
          gte: cooldownDate,
        },
      },
    });

    if (existingLead) {
      return NextResponse.json(
        { 
          error: "You have already registered recently. Please wait before submitting again.",
          cooldownHours,
        },
        { status: 409 }
      );
    }

    // Verify all course IDs exist and are published
    const courses = await prisma.eventCourse.findMany({
      where: {
        id: { in: courseIds },
        status: "PUBLISHED",
        visibility: "PUBLIC",
      },
    });

    if (courses.length !== courseIds.length) {
      return NextResponse.json(
        { error: "One or more selected courses are not available" },
        { status: 400 }
      );
    }

    // Create the lead and course selections in a transaction
    const lead = await prisma.$transaction(async (tx) => {
      // Create the lead
      const newLead = await tx.eventLead.create({
        data: {
          fullName: fullName.trim(),
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
          organisation: organisation?.trim() || null,
          jobTitle: jobTitle?.trim() || null,
          consentFlag,
          utmSource: utmSource?.trim() || null,
          status: "NEW",
        },
      });

      // Create course selections
      await tx.leadCourseSelection.createMany({
        data: courseIds.map((courseId) => ({
          leadId: newLead.id,
          courseId,
        })),
      });

      return newLead;
    });

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      message: "Registration successful",
    });
  } catch (error) {
    console.error("Error processing event registration:", error);
    return NextResponse.json(
      { error: "Failed to process registration" },
      { status: 500 }
    );
  }
}
