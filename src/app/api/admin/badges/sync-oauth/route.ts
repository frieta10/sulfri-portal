import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { fetchUserBadges, refreshAccessToken } from "@/lib/credly-oauth"
import { generateSlug } from "@/lib/validations/badge"

/**
 * POST /api/admin/badges/sync-oauth
 * 
 * Sync badges using OAuth authentication.
 * This works with authenticated API access.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { autoCreateSkills = true } = body

    // Get stored OAuth token
    const tokenRecord = await prisma.$queryRaw<Array<{
      access_token: string
      refresh_token: string
      expires_at: Date
      credly_username: string
    }>>`
      SELECT access_token, refresh_token, expires_at, credly_username
      FROM credly_oauth_tokens
      WHERE user_id = ${session.user.id}
    `

    if (!tokenRecord || tokenRecord.length === 0) {
      return NextResponse.json(
        { 
          error: "Not connected to Credly",
          message: "Please connect your Credly account first",
          action: "connect_oauth"
        },
        { status: 401 }
      )
    }

    let { access_token, refresh_token, expires_at } = tokenRecord[0]

    // Check if token is expired and refresh if needed
    if (new Date() > new Date(expires_at)) {
      console.log("Token expired, refreshing...")
      const refreshResult = await refreshAccessToken(refresh_token)

      if (!refreshResult.success) {
        return NextResponse.json(
          { 
            error: "Token refresh failed",
            message: "Please reconnect your Credly account",
            action: "reconnect_oauth"
          },
          { status: 401 }
        )
      }

      access_token = refreshResult.access_token

      // Update token in database
      const newExpiresAt = new Date(Date.now() + refreshResult.expires_in * 1000)
      await prisma.$executeRaw`
        UPDATE credly_oauth_tokens
        SET access_token = ${access_token}, expires_at = ${newExpiresAt}, updated_at = NOW()
        WHERE user_id = ${session.user.id}
      `
    }

    // Fetch badges with OAuth authentication
    const badgesResult = await fetchUserBadges(access_token)

    if (!badgesResult.success) {
      if (badgesResult.error === "Token expired") {
        return NextResponse.json(
          { 
            error: "Token expired",
            message: "Please reconnect your Credly account",
            action: "reconnect_oauth"
          },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { error: badgesResult.error },
        { status: 502 }
      )
    }

    const credlyBadges = badgesResult.badges

    // Sync results
    const results = {
      created: 0,
      updated: 0,
      archived: 0,
      skillsCreated: 0,
      errors: [] as string[],
    }

    // Get existing badges
    const existingBadges = await prisma.badge.findMany({
      where: { autoSyncEnabled: true },
    })

    const existingBadgeMap = new Map(existingBadges.map(b => [b.credlyBadgeId, b]))
    const processedBadgeIds = new Set<string>()

    // Process each badge from Credly
    for (const credlyBadge of credlyBadges) {
      try {
        const badgeId = credlyBadge.id
        processedBadgeIds.add(badgeId)

        const badgeTemplate = credlyBadge.badge_template
        const title = badgeTemplate?.name || credlyBadge.name || "Unknown Badge"
        const slug = generateSlug(title)
        const description = badgeTemplate?.description || credlyBadge.description || null
        const imageUrl = badgeTemplate?.image_url || credlyBadge.image_url || credlyBadge.image
        const issuedAt = credlyBadge.issued_at_date || credlyBadge.issuedAt
        const issuer = credlyBadge.issuer?.entities?.map((e: any) => e.entity.name).join(", ") || 
                       badgeTemplate?.issuer?.name || 
                       "Unknown"

        // Handle skills
        const skillNames = badgeTemplate?.skills?.map((s: any) => s.name) || []
        const skillIds: string[] = []

        if (autoCreateSkills && skillNames.length > 0) {
          for (const skillName of skillNames) {
            const normalizedName = skillName.trim()
            if (!normalizedName) continue

            const skillSlug = generateSlug(normalizedName)
            
            let skill = await prisma.skill.findUnique({
              where: { slug: skillSlug },
            })

            if (!skill) {
              skill = await prisma.skill.create({
                data: {
                  name: normalizedName,
                  slug: skillSlug,
                  visibility: "PUBLIC",
                },
              })
              results.skillsCreated++
            }

            skillIds.push(skill.id)
          }
        }

        // Check if badge exists
        const existingBadge = existingBadgeMap.get(badgeId)

        if (existingBadge) {
          // Update existing badge
          await prisma.badge.update({
            where: { id: existingBadge.id },
            data: {
              title,
              description,
              issuer,
              issueDate: issuedAt ? new Date(issuedAt) : null,
              fallbackImageUrl: imageUrl,
              verificationUrl: `https://www.credly.com/badges/${badgeId}/public_url`,
              lastSyncedAt: new Date(),
            },
          })

          // Update badge-skills relationships: delete existing and create new
          if (skillIds.length > 0) {
            await prisma.badgeSkill.deleteMany({
              where: { badgeId: existingBadge.id },
            })
            await prisma.badgeSkill.createMany({
              data: skillIds.map(skillId => ({ badgeId: existingBadge.id, skillId })),
            })
          }
          results.updated++
        } else {
          // Check for slug conflict
          const existingSlug = await prisma.badge.findUnique({
            where: { slug },
          })
          const finalSlug = existingSlug ? `${slug}-${badgeId.substring(0, 8)}` : slug

          // Create new badge
          const newBadge = await prisma.badge.create({
            data: {
              title,
              slug: finalSlug,
              description,
              issuer,
              issueDate: issuedAt ? new Date(issuedAt) : null,
              credlyBadgeId: badgeId,
              credlyHost: "https://www.credly.com",
              iframeWidth: 150,
              iframeHeight: 270,
              fallbackImageUrl: imageUrl,
              verificationUrl: `https://www.credly.com/badges/${badgeId}/public_url`,
              visibility: "PUBLIC",
              featured: false,
              autoSyncEnabled: true,
              lastSyncedAt: new Date(),
            },
          })

          // Create badge-skills relationships
          if (skillIds.length > 0) {
            await prisma.badgeSkill.createMany({
              data: skillIds.map(skillId => ({ badgeId: newBadge.id, skillId })),
            })
          }
          results.created++
        }
      } catch (error: any) {
        results.errors.push(`Failed to process badge ${credlyBadge.id}: ${error.message}`)
      }
    }

    // Archive badges that were removed from Credly
    for (const [badgeId, existingBadge] of existingBadgeMap) {
      if (!processedBadgeIds.has(badgeId) && existingBadge.visibility === "PUBLIC") {
        await prisma.badge.update({
          where: { id: existingBadge.id },
          data: {
            visibility: "HIDDEN",
            lastSyncedAt: new Date(),
          },
        })
        results.archived++
      }
    }

    return NextResponse.json({
      success: true,
      results,
      totalFromCredly: credlyBadges.length,
      method: "oauth",
    })

  } catch (error: any) {
    console.error("Error syncing badges with OAuth:", error)
    return NextResponse.json(
      { error: error.message || "Failed to sync badges" },
      { status: 500 }
    )
  }
}
