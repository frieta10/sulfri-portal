/**
 * Database Cleanup Script
 *
 * Removes dummy/test data from the database:
 * - Removes the old dummy admin user (admin@sulfri.com)
 * - Resets profile settings to clean defaults
 *
 * Usage:
 *   npx tsx scripts/cleanup-db.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database cleanup...\n')

  // 1. Remove dummy admin user
  const dummyAdmin = await prisma.adminUser.findUnique({
    where: { email: 'admin@sulfri.com' },
  })

  if (dummyAdmin) {
    await prisma.adminUser.delete({
      where: { email: 'admin@sulfri.com' },
    })
    console.log('Removed dummy admin user: admin@sulfri.com')
  } else {
    console.log('No dummy admin user found (admin@sulfri.com) - skipping')
  }

  // 2. Check remaining admin users
  const remainingAdmins = await prisma.adminUser.count()
  if (remainingAdmins === 0) {
    console.log('\nWARNING: No admin users remain in the database!')
    console.log('Create a new super admin with: npm run admin:create')
  } else {
    console.log(`\n${remainingAdmins} admin user(s) remain in the database.`)
  }

  // 3. Reset profile settings to clean defaults
  const profile = await prisma.profileSettings.findUnique({
    where: { id: 'singleton' },
  })

  if (profile) {
    await prisma.profileSettings.update({
      where: { id: 'singleton' },
      data: {
        displayName: 'Trainer Name',
        headline: null,
        bio: null,
        email: null,
        phone: null,
        linkedinUrl: null,
        locationBase: null,
        profilePhotoUrl: null,
      },
    })
    console.log('Reset profile settings to clean defaults')
  }

  console.log('\nCleanup completed successfully!')
}

main()
  .catch((e) => {
    console.error('Cleanup error:', e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
