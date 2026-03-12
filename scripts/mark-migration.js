#!/usr/bin/env node
/**
 * Mark CR-04 migration as applied
 * Run: node scripts/mark-migration.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Check if migration already exists
    const existing = await prisma.$queryRaw`
      SELECT * FROM _prisma_migrations 
      WHERE migration_name = '20250309000000_cr04_client_showcase_bi_module'
      LIMIT 1;
    `;

    if (existing.length > 0) {
      console.log('✅ Migration already marked as applied');
      return;
    }

    // Insert migration record without ON CONFLICT
    await prisma.$executeRaw`
      INSERT INTO _prisma_migrations (
        id, 
        checksum, 
        finished_at, 
        migration_name, 
        logs, 
        started_at, 
        applied_steps_count
      )
      VALUES (
        gen_random_uuid()::text,
        '',
        CURRENT_TIMESTAMP,
        '20250309000000_cr04_client_showcase_bi_module',
        'Applied via manual-migration.js script',
        CURRENT_TIMESTAMP,
        1
      );
    `;

    console.log('✅ Migration marked as applied successfully!');
  } catch (error) {
    console.log('Note: Migration marking skipped (may already exist)');
    console.log('Error:', error.message);
  }

  await prisma.$disconnect();
}

main();
