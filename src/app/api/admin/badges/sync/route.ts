import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { 
  credlySyncConfigSchema, 
  credlyApiResponseSchema, 
  validateCredlyUserId,
  generateSlug,
} from "@/lib/validations/badge"
import { getCredlyErrorMessage, fetchBadgesFromPublicProfile } from "@/lib/credly"

// Sync log entry type
interface SyncLogEntry {
  timestamp: string
  status: "success" | "error" | "warning"
  message: string
  details?: any
}

// In-memory sync log (in production, this should be in database)
const syncLogs: SyncLogEntry[] = []
const MAX_LOG_ENTRIES = 100

function addSyncLog(entry: SyncLogEntry) {
  syncLogs.unshift(entry)
  if (syncLogs.length > MAX_LOG_ENTRIES) {
    syncLogs.pop()
  }
}

// GET /api/admin/badges/sync - Get sync status and logs
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({
      config: {
        credlyUserId: null,
        lastSyncAt: syncLogs[0]?.timestamp || null,
        note: "Credly API now requires authentication. Manual embed code method is recommended.",
      },
      logs: syncLogs.slice(0, 20),
    })
  } catch (error) {
    console.error("Error fetching sync status:", error)
    return NextResponse.json(
      { error: "Failed to fetch sync status" },
      { status: 500 }
    )
  }
}

// POST /api/admin/badges/sync - Trigger manual sync from Credly
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validationResult = credlySyncConfigSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { credlyUserId, autoCreateSkills } = validationResult.data

    // Validate Credly User ID format
    if (!validateCredlyUserId(credlyUserId)) {
      return NextResponse.json(
        { error: "Invalid Credly User ID format" },
        { status: 400 }
      )
    }

    // Security: Only allow HTTPS calls to www.credly.com
    const credlyUrl = `https://www.credly.com/api/v1/users/${credlyUserId}/badges.json`

    // Fetch badges from Credly with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    let response
    try {
      response = await fetch(credlyUrl, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      addSyncLog({
        timestamp: new Date().toISOString(),
        status: "error",
        message: "Failed to connect to Credly API",
        details: fetchError instanceof Error ? fetchError.message : String(fetchError),
      })
      return NextResponse.json(
        { error: "Failed to connect to Credly API. Please check the User ID and try again." },
        { status: 502 }
      )
    }

    // Handle 401 - Credly API now requires authentication
    if (response.status === 401) {
      console.log("Credly API returned 401, trying fallback method...")
      
      // Try fallback method: scrape public profile
      const fallbackResult = await fetchBadgesFromPublicProfile(credlyUserId)
      
      if (fallbackResult.success) {
        // Process badges from fallback
        const results = await processBadgesFromFallback(
          fallbackResult.badges,
          autoCreateSkills
        )
        
        addSyncLog({
          timestamp: new Date().toISOString(),
          status: results.errors.length > 0 ? "warning" : "success",
          message: `Sync completed via fallback: ${results.created} created, ${results.updated} updated`,
          details: results,
        })

        return NextResponse.json({
          success: true,
          results,
          method: "fallback",
          note: "Used fallback method due to Credly API authentication requirements",
        })
      }

      // Fallback also failed
      const errorMessage = getCredlyErrorMessage(401)
      addSyncLog({
        timestamp: new Date().toISOString(),
        status: "error",
        message: errorMessage,
        details: { status: 401, fallbackError: fallbackResult.error },
      })
      
      return NextResponse.json(
        { 
          error: errorMessage,
          suggestion: "Please use the manual embed code method instead. Copy the embed code from your Credly badge page and paste it in the Manual tab.",
          alternative: "manual",
        },
        { status: 401 }
      )
    }

    if (!response.ok) {
      const errorMessage = response.status === 404 
        ? "Credly user not found. Please check the User ID."
        : getCredlyErrorMessage(response.status)
      
      addSyncLog({
        timestamp: new Date().toISOString(),
        status: "error",
        message: errorMessage,
        details: { status: response.status },
      })
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status === 404 ? 404 : 502 }
      )
    }

    const rawData = await response.json()

    // Validate response structure
    const parseResult = credlyApiResponseSchema.safeParse(rawData)
    if (!parseResult.success) {
      addSyncLog({
        timestamp: new Date().toISOString(),
        status: "error",
        message: "Invalid response format from Credly",
        details: parseResult.error.flatten(),
      })
      return NextResponse.json(
        { error: "Invalid response format from Credly" },
        { status: 502 }
      )
    }

    const credlyBadges = parseResult.data.data

    // Process badges
    const results = await processBadgesFromApi(credlyBadges, autoCreateSkills)

    // Log successful sync
    addSyncLog({
      timestamp: new Date().toISOString(),
      status: results.errors.length > 0 ? "warning" : "success",
      message: `Sync completed: ${results.created} created, ${results.updated} updated, ${results.archived} archived`,
      details: results,
    })

    return NextResponse.json({
      success: true,
      results,
      totalFromCredly: credlyBadges.length,
      method: "api",
    })

  } catch (error: any) {
    console.error("Error syncing badges:", error)
    
    addSyncLog({
      timestamp: new Date().toISOString(),
      status: "error",
      message: "Sync failed",
      details: error.message,
    })
    
    return NextResponse.json(
      { error: error.message || "Failed to sync badges" },
      { status: 500 }
    )
  }
}

/**
 * Process badges from API response
 */
async function processBadgesFromApi(
  credlyBadges: any[],
  autoCreateSkills: boolean
) {
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
      const title = badgeTemplate.name
      const slug = generateSlug(title)
      const description = badgeTemplate.description || null
      const imageUrl = badgeTemplate.image_url || credlyBadge.image_url
      const issuedAt = credlyBadge.issued_at_date
      const issuer = credlyBadge.issuer?.entities?.map((e: any) => e.entity.name).join(", ") || 
                     badgeTemplate.issuer?.name || "Unknown"

      // Handle skills
      const skillNames = badgeTemplate.skills?.map((s: any) => s.name) || []
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
        await prisma.badge.update({
          where: { id: existingBadge.id },
          data: {
            title,
            description,
            issuer,
            issueDate: new Date(issuedAt),
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
        const existingSlug = await prisma.badge.findUnique({ where: { slug } })
        const finalSlug = existingSlug ? `${slug}-${badgeId.substring(0, 8)}` : slug

        const newBadge = await prisma.badge.create({
          data: {
            title,
            slug: finalSlug,
            description,
            issuer,
            issueDate: new Date(issuedAt),
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

  return results
}

/**
 * Process badges from fallback method (public profile scraping)
 */
async function processBadgesFromFallback(
  badges: any[],
  autoCreateSkills: boolean
) {
  const results = {
    created: 0,
    updated: 0,
    archived: 0,
    skillsCreated: 0,
    errors: [] as string[],
  }

  for (const badge of badges) {
    try {
      // Skip if missing required fields
      if (!badge.name) {
        results.errors.push(`Skipping badge with missing name`)
        continue
      }

      const title = badge.name
      const slug = generateSlug(title)
      const description = badge.description || null
      const imageUrl = badge.imageUrl || null
      const issuedAt = badge.issuedAt ? new Date(badge.issuedAt) : null
      const issuer = badge.issuer || "Unknown"
      const badgeId = badge.id || `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Check if badge exists by title/issuer
      const existingBadge = await prisma.badge.findFirst({
        where: {
          title,
          issuer,
        },
      })

      if (existingBadge) {
        // Update existing
        await prisma.badge.update({
          where: { id: existingBadge.id },
          data: {
            description,
            fallbackImageUrl: imageUrl || existingBadge.fallbackImageUrl,
            lastSyncedAt: new Date(),
          },
        })
        results.updated++
      } else {
        // Create new
        const existingSlug = await prisma.badge.findUnique({ where: { slug } })
        const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug

        await prisma.badge.create({
          data: {
            title,
            slug: finalSlug,
            description,
            issuer,
            issueDate: issuedAt,
            credlyBadgeId: badgeId,
            credlyHost: "https://www.credly.com",
            iframeWidth: 150,
            iframeHeight: 270,
            fallbackImageUrl: imageUrl,
            verificationUrl: badgeId.startsWith('fallback') 
              ? null 
              : `https://www.credly.com/badges/${badgeId}/public_url`,
            visibility: "PUBLIC",
            featured: false,
            autoSyncEnabled: true,
            lastSyncedAt: new Date(),
          },
        })
        results.created++
      }
    } catch (error: any) {
      results.errors.push(`Failed to process badge: ${error.message}`)
    }
  }

  return results
}
