import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { 
  parseOB3Credentials, 
  convertOB3ToBadge, 
  validateOB3Credential,
  isOB3Format,
} from "@/lib/openbadges3"
import { generateSlug } from "@/lib/validations/badge"

/**
 * POST /api/admin/badges/import-ob3
 * 
 * Import badges from Open Badges 3.0 JSON file
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { jsonContent, autoCreateSkills = true } = body

    if (!jsonContent || typeof jsonContent !== 'string') {
      return NextResponse.json(
        { error: "JSON content is required" },
        { status: 400 }
      )
    }

    // Check if it looks like OB3 format
    if (!isOB3Format(jsonContent)) {
      return NextResponse.json(
        { 
          error: "Invalid format",
          message: "The file doesn't appear to be in Open Badges 3.0 format. Please ensure you're uploading a valid OB3 JSON file exported from Credly."
        },
        { status: 400 }
      )
    }

    // Parse OB3 credentials
    const credentials = parseOB3Credentials(jsonContent)

    if (credentials.length === 0) {
      return NextResponse.json(
        { error: "No valid badges found in the file" },
        { status: 400 }
      )
    }

    // Results tracking
    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
      skillsCreated: 0,
      badges: [] as any[],
    }

    // Process each credential
    for (const credential of credentials) {
      try {
        // Validate credential
        if (!validateOB3Credential(credential)) {
          results.errors.push(`Invalid credential: ${credential.id || 'unknown'}`)
          results.skipped++
          continue
        }

        // Convert to our format
        const badgeData = convertOB3ToBadge(credential)

        // Generate unique slug
        let slug = badgeData.slug
        let counter = 1
        while (await prisma.badge.findUnique({ where: { slug } })) {
          slug = `${badgeData.slug}-${counter}`
          counter++
        }

        // Process skills
        const skillIds: string[] = []
        if (autoCreateSkills && badgeData.skills.length > 0) {
          for (const skillName of badgeData.skills) {
            const skillSlug = generateSlug(skillName)
            
            let skill = await prisma.skill.findUnique({
              where: { slug: skillSlug },
            })

            if (!skill) {
              skill = await prisma.skill.create({
                data: {
                  name: skillName,
                  slug: skillSlug,
                  visibility: "PUBLIC",
                },
              })
              results.skillsCreated++
            }

            skillIds.push(skill.id)
          }
        }

        // Check for duplicate (same title + issuer + issue date)
        const existingBadge = await prisma.badge.findFirst({
          where: {
            title: badgeData.title,
            issuer: badgeData.issuer,
            issueDate: badgeData.issueDate,
          },
        })

        if (existingBadge) {
          results.skipped++
          continue
        }

        // Create badge - ensure all required fields have values
        const credlyBadgeId = credential.id 
          ? credential.id.split('/').pop() || `ob3-${Date.now()}`
          : `ob3-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        // Ensure issueDate is a valid Date
        let issueDate = badgeData.issueDate
        if (!issueDate || isNaN(issueDate.getTime())) {
          issueDate = new Date()
        }

        const badge = await prisma.badge.create({
          data: {
            title: badgeData.title || 'Untitled Badge',
            slug,
            description: badgeData.description,
            issuer: badgeData.issuer || 'Unknown',
            issueDate: issueDate,
            expiryDate: badgeData.expiryDate,
            credlyBadgeId: credlyBadgeId,
            credlyHost: "https://www.credly.com",
            iframeWidth: 150,
            iframeHeight: 270,
            fallbackImageUrl: badgeData.fallbackImageUrl,
            verificationUrl: badgeData.verificationUrl,
            visibility: "PUBLIC",
            featured: false,
            autoSyncEnabled: false,
          },
        })

        // Create badge-skills relationships
        if (skillIds.length > 0) {
          await prisma.badgeSkill.createMany({
            data: skillIds.map(skillId => ({ badgeId: badge.id, skillId })),
          })
        }

        // Fetch the badge with skills
        const badgeWithSkills = await prisma.badge.findUnique({
          where: { id: badge.id },
          include: {
            badgeSkills: {
              include: {
                skill: true,
              },
            },
          },
        })

        results.imported++
        results.badges.push(badgeWithSkills)

      } catch (error: any) {
        results.errors.push(`Failed to import ${credential.id}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      results,
      totalFound: credentials.length,
    })

  } catch (error: any) {
    console.error("Error importing OB3 badges:", error)
    return NextResponse.json(
      { error: error.message || "Failed to import badges" },
      { status: 500 }
    )
  }
}

/**
 * Validate OB3 file without importing
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { jsonContent } = body

    if (!jsonContent) {
      return NextResponse.json(
        { error: "JSON content is required" },
        { status: 400 }
      )
    }

    const isValid = isOB3Format(jsonContent)
    const credentials = isValid ? parseOB3Credentials(jsonContent) : []

    return NextResponse.json({
      valid: isValid,
      badgeCount: credentials.length,
      sample: credentials.length > 0 ? {
        title: credentials[0].credentialSubject.achievement.name,
        issuer: typeof credentials[0].issuer === 'string' 
          ? credentials[0].issuer 
          : credentials[0].issuer.name,
      } : null,
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
