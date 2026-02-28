#!/usr/bin/env tsx
/**
 * Data Migration Script: CR-01 Badge Schema Migration
 * 
 * This script migrates existing badges from the old schema to the new CR-01 schema.
 * Run this AFTER applying the Prisma migration.
 * 
 * Usage:
 *   npx tsx scripts/migrate-badges.ts
 * 
 * Or:
 *   npx ts-node scripts/migrate-badges.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

// Generate slug from string
function generateSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 100)
}

// Normalize skill name
function normalizeSkillName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

async function migrateBadges() {
  console.log('========================================')
  console.log('CR-01 Badge Migration Started')
  console.log('========================================\n')

  try {
    // Check if there are any badges using old schema
    const oldBadges = await prisma.$queryRaw<Array<{
      id: string
      name: string
      description: string | null
      image_url: string
      issuer: string
      issue_date: Date
      skills: string[]
      category: string
      credential_url: string | null
      sort_order: number
      is_visible: boolean
    }>>`
      SELECT * FROM badges 
      WHERE title IS NULL OR title = ''
    `

    if (oldBadges.length === 0) {
      console.log('✓ No old-format badges found. Migration not needed.')
      return
    }

    console.log(`Found ${oldBadges.length} badges to migrate\n`)

    let migratedCount = 0
    let errorCount = 0
    let skillsCreated = 0

    for (const badge of oldBadges) {
      try {
        console.log(`\nMigrating: ${badge.name}`)

        // Generate unique slug
        const baseSlug = generateSlug(badge.name)
        let slug = baseSlug
        let counter = 1
        
        while (await prisma.badge.findUnique({ where: { slug } })) {
          slug = `${baseSlug}-${counter}`
          counter++
        }

        // Process skills
        const skillIds: string[] = []
        const skillNames = badge.skills || []

        for (const skillName of skillNames) {
          const normalizedName = normalizeSkillName(skillName)
          if (!normalizedName) continue

          const skillSlug = generateSlug(normalizedName)
          
          // Find or create skill
          let skill = await prisma.skill.findUnique({ 
            where: { slug: skillSlug } 
          })
          
          if (!skill) {
            skill = await prisma.skill.create({
              data: {
                name: normalizedName,
                slug: skillSlug,
                visibility: 'PUBLIC',
                displayOrder: 0,
              },
            })
            skillsCreated++
            console.log(`  + Created skill: ${normalizedName}`)
          }

          skillIds.push(skill.id)
        }

        // Update badge with new schema
        await prisma.badge.update({
          where: { id: badge.id },
          data: {
            title: badge.name,
            slug,
            description: badge.description,
            issuer: badge.issuer,
            issueDate: badge.issue_date,
            credlyBadgeId: `legacy-${badge.id.substring(0, 8)}`,
            credlyHost: 'https://www.credly.com',
            iframeWidth: 150,
            iframeHeight: 270,
            featured: false,
            visibility: badge.is_visible ? 'PUBLIC' : 'HIDDEN',
            displayOrder: badge.sort_order,
            fallbackImageUrl: badge.image_url,
            verificationUrl: badge.credential_url,
            embedCode: null,
            autoSyncEnabled: false,
            lastSyncedAt: null,
          },
        })

        // Create badge-skill associations through join table
        if (skillIds.length > 0) {
          await prisma.badgeSkill.createMany({
            data: skillIds.map(skillId => ({
              badgeId: badge.id,
              skillId: skillId,
            })),
            skipDuplicates: true,
          })
        }

        console.log(`  ✓ Migrated: ${badge.name} (slug: ${slug})`)
        migratedCount++

      } catch (error) {
        console.error(`  ✗ Failed to migrate badge ${badge.id}:`, error)
        errorCount++
      }
    }

    console.log('\n========================================')
    console.log('Migration Complete!')
    console.log('========================================')
    console.log(`Migrated: ${migratedCount} badges`)
    console.log(`Skills created: ${skillsCreated}`)
    console.log(`Errors: ${errorCount}`)

  } catch (error) {
    console.error('\n✗ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateBadges()
