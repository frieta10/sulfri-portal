import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Super admin credentials from environment variables
  const adminEmail = process.env.SUPER_ADMIN_EMAIL
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD
  const adminName = process.env.SUPER_ADMIN_NAME || 'Super Admin'

  if (!adminEmail || !adminPassword) {
    console.error('ERROR: SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD environment variables are required.')
    console.error('Set them in your .env.local file or pass them inline:')
    console.error('  SUPER_ADMIN_EMAIL=admin@example.com SUPER_ADMIN_PASSWORD=yourpassword npm run prisma:seed')
    process.exit(1)
  }

  if (adminPassword.length < 8) {
    console.error('ERROR: SUPER_ADMIN_PASSWORD must be at least 8 characters long.')
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12)

  const admin = await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      passwordHash,
      role: 'superadmin',
    },
    create: {
      email: adminEmail,
      name: adminName,
      passwordHash,
      role: 'superadmin',
    }
  })

  console.log('Super admin created/updated:', admin.email)

  // Create default profile settings (empty template, no dummy content)
  const profile = await prisma.profileSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      displayName: adminName,
    }
  })

  console.log('Profile settings initialized:', profile.displayName)
  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
