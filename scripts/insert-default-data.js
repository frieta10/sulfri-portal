#!/usr/bin/env node
/**
 * Insert default data for settings and stats
 * Run: node scripts/insert-default-data.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Inserting default data...\n');

  // Event Settings
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "event_settings" ("id", "updated_at") 
      VALUES ('singleton', CURRENT_TIMESTAMP)
      ON CONFLICT ("id") DO NOTHING;
    `);
    console.log('✅ Event settings created');
  } catch (e) {
    console.log('⚠️ Event settings:', e.message);
  }

  // Showcase Stats
  const stats = [
    { key: 'classes_completed', label: 'Classes Completed' },
    { key: 'hours_delivered', label: 'Training Hours Delivered' },
    { key: 'participants_trained', label: 'Participants Trained' },
    { key: 'unique_clients', label: 'Unique Client Organisations' },
  ];

  for (const stat of stats) {
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "showcase_stats" ("id", "stat_key", "stat_value", "label", "updated_at")
        VALUES (gen_random_uuid()::text, '${stat.key}', 0, '${stat.label}', CURRENT_TIMESTAMP)
        ON CONFLICT ("stat_key") DO NOTHING;
      `);
      console.log(`✅ Stat '${stat.key}' created`);
    } catch (e) {
      console.log(`⚠️ Stat '${stat.key}': ${e.message}`);
    }
  }

  // Portal Settings
  try {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "portal_settings" ("id", "updated_at")
      VALUES ('singleton', CURRENT_TIMESTAMP)
      ON CONFLICT ("id") DO NOTHING;
    `);
    console.log('✅ Portal settings created');
  } catch (e) {
    console.log('⚠️ Portal settings:', e.message);
  }

  console.log('\n✅ Default data insertion complete!');
  await prisma.$disconnect();
}

main();
