/**
 * Super Admin Management Script
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts create   - Create a new super admin
 *   npx tsx scripts/create-admin.ts reset    - Reset super admin password
 *   npx tsx scripts/create-admin.ts list     - List all admin users
 *
 * Environment variables (set in .env.local or pass inline):
 *   SUPER_ADMIN_EMAIL    - Admin email address
 *   SUPER_ADMIN_PASSWORD - Admin password (min 8 chars)
 *   SUPER_ADMIN_NAME     - Admin display name (optional)
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as readline from 'readline'

const prisma = new PrismaClient()

function prompt(question: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function createAdmin() {
  console.log('\n--- Create Super Admin ---\n')

  const email = process.env.SUPER_ADMIN_EMAIL || await prompt('Email: ')
  const name = process.env.SUPER_ADMIN_NAME || await prompt('Name: ')
  const password = process.env.SUPER_ADMIN_PASSWORD || await prompt('Password (min 8 chars): ')

  if (!email || !password) {
    console.error('Error: Email and password are required.')
    process.exit(1)
  }

  if (password.length < 8) {
    console.error('Error: Password must be at least 8 characters.')
    process.exit(1)
  }

  // Check if email already exists
  const existing = await prisma.adminUser.findUnique({ where: { email } })
  if (existing) {
    console.error(`Error: An admin with email "${email}" already exists.`)
    console.error('Use "reset" command to update the password instead.')
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const admin = await prisma.adminUser.create({
    data: {
      email,
      name: name || 'Super Admin',
      passwordHash,
      role: 'superadmin',
    },
  })

  console.log(`\nSuper admin created successfully!`)
  console.log(`  Email: ${admin.email}`)
  console.log(`  Name:  ${admin.name}`)
  console.log(`  Role:  ${admin.role}`)
}

async function resetPassword() {
  console.log('\n--- Reset Admin Password ---\n')

  const email = process.env.SUPER_ADMIN_EMAIL || await prompt('Admin email: ')
  const password = process.env.SUPER_ADMIN_PASSWORD || await prompt('New password (min 8 chars): ')

  if (!email || !password) {
    console.error('Error: Email and password are required.')
    process.exit(1)
  }

  if (password.length < 8) {
    console.error('Error: Password must be at least 8 characters.')
    process.exit(1)
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } })
  if (!existing) {
    console.error(`Error: No admin found with email "${email}".`)
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.adminUser.update({
    where: { email },
    data: { passwordHash },
  })

  console.log(`\nPassword reset successfully for: ${email}`)
}

async function listAdmins() {
  console.log('\n--- Admin Users ---\n')

  const admins = await prisma.adminUser.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  if (admins.length === 0) {
    console.log('No admin users found.')
    return
  }

  console.log(`Found ${admins.length} admin(s):\n`)
  admins.forEach((admin, i) => {
    console.log(`  ${i + 1}. ${admin.email}`)
    console.log(`     Name: ${admin.name}`)
    console.log(`     Role: ${admin.role}`)
    console.log(`     Created: ${admin.createdAt.toISOString()}`)
    console.log()
  })
}

async function main() {
  const command = process.argv[2]

  switch (command) {
    case 'create':
      await createAdmin()
      break
    case 'reset':
      await resetPassword()
      break
    case 'list':
      await listAdmins()
      break
    default:
      console.log('Super Admin Management Script')
      console.log('')
      console.log('Usage:')
      console.log('  npx tsx scripts/create-admin.ts create   Create a new super admin')
      console.log('  npx tsx scripts/create-admin.ts reset    Reset admin password')
      console.log('  npx tsx scripts/create-admin.ts list     List all admin users')
      console.log('')
      console.log('You can also set env vars: SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_NAME')
      break
  }
}

main()
  .catch((e) => {
    console.error('Error:', e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
