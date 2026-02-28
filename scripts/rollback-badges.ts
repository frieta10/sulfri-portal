#!/usr/bin/env tsx
/**
 * Rollback Script: CR-01 Badge Schema Rollback
 * 
 * ⚠️ WARNING: This script reverts badge data to the old schema format.
 * Only run this if you need to rollback CR-01 migration.
 * 
 * Usage:
 *   npx tsx scripts/rollback-badges.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function rollbackBadges() {
  console.log('========================================')
  console.log('CR-01 Badge Rollback Started')
  console.log('⚠️  This will revert badges to old schema')
  console.log('========================================\n')

  const confirm = process.argv.includes('--yes')
  
  if (!confirm) {
    console.log('This script will:')
    console.log('1. Revert badge names from "title" to "name"')
    console.log('2. Remove skill relationships')
    console.log('3. Clear new schema fields (credlyBadgeId, embedCode, etc.)')
    console.log('')
    console.log('To proceed, run with --yes flag:')
    console.log('  npx tsx scripts/rollback-badges.ts --yes')
    console.log('')
    console.log('Note: Consider restoring from database backup instead!')
    process.exit(0)
  }

  try {
    // Get all badges with new schema
    const badges = await prisma.badge.findMany({
      include: {
        badgeSkills: { include: { skill: true } },
      },
    })

    console.log(`Found ${badges.length} badges to rollback\n`)

    for (const badge of badges) {
      try {
        console.log(`Rolling back: ${badge.title || badge.id}`)

        // Disconnect all skills
        if (badge.badgeSkills.length > 0) {
          await prisma.badgeSkill.deleteMany({
            where: { badgeId: badge.id },
          })
        }

        // Revert to old schema via raw SQL
        await prisma.$executeRaw`
          UPDATE badges 
          SET 
            name = ${badge.title},
            title = NULL,
            slug = NULL,
            description = ${badge.description},
            image_url = ${badge.fallbackImageUrl},
            issue_date = ${badge.issueDate},
            skills = ${badge.badgeSkills.map(bs => bs.skill.name)},
            category = 'Other',
            credential_url = ${badge.verificationUrl},
            sort_order = ${badge.displayOrder},
            is_visible = ${badge.visibility === 'PUBLIC'},
            credly_badge_id = NULL,
            credly_host = NULL,
            iframe_width = NULL,
            iframe_height = NULL,
            verification_url = NULL,
            featured = NULL,
            visibility = NULL,
            display_order = NULL,
            fallback_image_url = NULL,
            embed_code = NULL,
            auto_sync_enabled = NULL,
            last_synced_at = NULL
          WHERE id = ${badge.id}
        `

        console.log(`  ✓ Rolled back: ${badge.title}`)

      } catch (error) {
        console.error(`  ✗ Failed to rollback badge ${badge.id}:`, error)
      }
    }

    console.log('\n========================================')
    console.log('Rollback Complete!')
    console.log('========================================')
    console.log('Next steps:')
    console.log('1. Revert Prisma schema changes')
    console.log('2. Run: npx prisma generate')
    console.log('3. Redeploy application')

  } catch (error) {
    console.error('\n✗ Rollback failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

rollbackBadges()
