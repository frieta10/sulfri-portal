import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { badgeBatchImportSchema, extractCredlyEmbedData, generateSlug } from "@/lib/validations/badge"

// POST /api/admin/badges/batch-import - Batch import badges from embed codes
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = badgeBatchImportSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { embedCodes, defaultVisibility, defaultFeatured } = validationResult.data

    const results = {
      success: [] as any[],
      failed: [] as { embedCode: string; error: string }[],
    }

    // Get current max display order
    const lastBadge = await prisma.badge.findFirst({
      orderBy: { displayOrder: "desc" },
    })
    let nextOrder = (lastBadge?.displayOrder || 0) + 1

    for (const embedCode of embedCodes) {
      try {
        // Extract data from embed code
        const embedData = extractCredlyEmbedData(embedCode)

        // Generate title from badge ID (can be updated later)
        const title = `Badge ${embedData.badgeId.substring(0, 8)}`
        const slug = `${generateSlug(title)}-${embedData.badgeId.substring(0, 8)}`

        // Check for duplicate credlyBadgeId
        const existingBadge = await prisma.badge.findFirst({
          where: { credlyBadgeId: embedData.badgeId },
        })

        if (existingBadge) {
          results.failed.push({
            embedCode: embedCode.substring(0, 100) + "...",
            error: `Badge with ID ${embedData.badgeId} already exists`,
          })
          continue
        }

        // Check for slug conflict
        const existingSlug = await prisma.badge.findUnique({
          where: { slug },
        })

        const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug

        // Create badge
        const badge = await prisma.badge.create({
          data: {
            title,
            slug: finalSlug,
            issuer: "Unknown", // Can be updated by admin later
            credlyBadgeId: embedData.badgeId,
            credlyHost: embedData.host,
            iframeWidth: embedData.width,
            iframeHeight: embedData.height,
            embedCode, // Store original for reference
            visibility: defaultVisibility,
            featured: defaultFeatured,
            displayOrder: nextOrder++,
            verificationUrl: `https://www.credly.com/badges/${embedData.badgeId}/public_url`,
          },
        })

        results.success.push(badge)
      } catch (error: any) {
        results.failed.push({
          embedCode: embedCode.substring(0, 100) + "...",
          error: error.message || "Failed to process embed code",
        })
      }
    }

    return NextResponse.json({
      imported: results.success.length,
      failed: results.failed.length,
      badges: results.success,
      errors: results.failed,
    })
  } catch (error: any) {
    console.error("Error batch importing badges:", error)
    return NextResponse.json(
      { error: error.message || "Failed to import badges" },
      { status: 500 }
    )
  }
}
