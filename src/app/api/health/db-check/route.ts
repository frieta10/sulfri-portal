import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/health/db-check
 * 
 * Checks if the database has the required schema for CR-01.
 * This helps debug 500 errors.
 */
export async function GET() {
  try {
    const checks = {
      skillsTable: false,
      badgeSkillsTable: false,
      badgesColumns: {
        title: false,
        slug: false,
        credlyBadgeId: false,
        visibility: false,
      },
      badgeCount: 0,
      errors: [] as string[],
    }

    // Check skills table
    try {
      await prisma.$queryRaw`SELECT 1 FROM skills LIMIT 1`
      checks.skillsTable = true
    } catch (e: any) {
      checks.errors.push(`Skills table: ${e.message}`)
    }

    // Check badge_skills table
    try {
      await prisma.$queryRaw`SELECT 1 FROM badge_skills LIMIT 1`
      checks.badgeSkillsTable = true
    } catch (e: any) {
      checks.errors.push(`Badge_skills table: ${e.message}`)
    }

    // Check badges columns
    try {
      const badges = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'badges'
      `
      const columns = (badges as any[]).map(r => r.column_name)
      checks.badgesColumns.title = columns.includes('title')
      checks.badgesColumns.slug = columns.includes('slug')
      checks.badgesColumns.credlyBadgeId = columns.includes('credly_badge_id')
      checks.badgesColumns.visibility = columns.includes('visibility')
    } catch (e: any) {
      checks.errors.push(`Badges columns check: ${e.message}`)
    }

    // Count badges
    try {
      const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM badges`
      checks.badgeCount = parseInt((count as any[])[0].count)
    } catch (e: any) {
      checks.errors.push(`Badge count: ${e.message}`)
    }

    const allGood = checks.skillsTable && checks.badgeSkillsTable && 
                    Object.values(checks.badgesColumns).every(v => v)

    return NextResponse.json({
      ok: allGood,
      checks,
      message: allGood 
        ? "Database schema is correct for CR-01"
        : "Database schema is missing required tables/columns",
      fix: !allGood ? "Run: npx prisma db push" : undefined,
    })

  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message,
      message: "Failed to check database schema",
    }, { status: 500 })
  }
}
