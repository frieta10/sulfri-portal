#!/usr/bin/env node
/**
 * Fix Admin Login - Check/Create Admin User
 * Run: node scripts/fix-admin-login.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('========================================');
  console.log('Admin Login Diagnostic & Fix');
  console.log('========================================\n');

  // Check if admin_users table exists
  try {
    const tableCheck = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admin_users'
      );
    `;
    
    if (!tableCheck[0]?.exists) {
      console.log('❌ admin_users table does NOT exist!');
      console.log('Creating admin_users table...\n');
      
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "admin_users" (
          "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "name" TEXT NOT NULL,
          "email" TEXT NOT NULL UNIQUE,
          "password_hash" TEXT NOT NULL,
          "role" TEXT NOT NULL DEFAULT 'admin',
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ admin_users table created\n');
    } else {
      console.log('✅ admin_users table exists\n');
    }
  } catch (e) {
    console.log('❌ Error checking table:', e.message);
  }

  // List existing admin users
  console.log('Checking existing admin users...\n');
  try {
    const users = await prisma.adminUser.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });
    
    if (users.length === 0) {
      console.log('⚠️  No admin users found!\n');
    } else {
      console.log(`Found ${users.length} admin user(s):\n`);
      users.forEach(u => {
        console.log(`  - ${u.name} (${u.email})`);
        console.log(`    Role: ${u.role}, Created: ${u.createdAt}`);
      });
      console.log('');
    }
  } catch (e) {
    console.log('❌ Error fetching users:', e.message, '\n');
  }

  // Create default admin if none exists
  console.log('Creating default admin user...\n');
  
  const defaultEmail = 'admin@sulfri.com';
  const defaultPassword = 'Sulfri2024!';
  
  try {
    // Check if default admin exists
    const existing = await prisma.adminUser.findUnique({
      where: { email: defaultEmail }
    });
    
    if (existing) {
      console.log(`⚠️  Admin user ${defaultEmail} already exists`);
      console.log('Resetting password...\n');
      
      // Update password
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);
      await prisma.adminUser.update({
        where: { email: defaultEmail },
        data: { passwordHash: hashedPassword }
      });
      
      console.log('✅ Password reset successfully!\n');
    } else {
      // Create new admin
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);
      
      await prisma.adminUser.create({
        data: {
          name: 'Admin User',
          email: defaultEmail,
          passwordHash: hashedPassword,
          role: 'admin'
        }
      });
      
      console.log('✅ Admin user created successfully!\n');
    }
    
    console.log('========================================');
    console.log('Login Credentials:');
    console.log('========================================');
    console.log(`Email:    ${defaultEmail}`);
    console.log(`Password: ${defaultPassword}`);
    console.log('========================================\n');
    
  } catch (e) {
    console.log('❌ Error creating admin:', e.message, '\n');
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
