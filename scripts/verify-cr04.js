#!/usr/bin/env node
/**
 * Verify CR-04 tables exist
 * Run: node scripts/verify-cr04.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying CR-04 tables...\n');

  const tables = [
    { name: 'testimonials', label: 'Testimonials' },
    { name: 'case_studies', label: 'Case Studies' },
    { name: 'showcase_stats', label: 'Showcase Stats' },
    { name: 'proposal_requests', label: 'Proposal Requests' },
    { name: 'leads_pipeline', label: 'Leads Pipeline' },
    { name: 'portal_settings', label: 'Portal Settings' },
    { name: 'email_log', label: 'Email Log' },
    { name: 'analytics_events', label: 'Analytics Events' },
    { name: 'pdf_download_logs', label: 'PDF Download Logs' },
  ];

  let allGood = true;

  for (const table of tables) {
    try {
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table.name}
        );
      `;
      const exists = result[0]?.exists;
      console.log(`${exists ? '✅' : '❌'} ${table.label}`);
      if (!exists) allGood = false;
    } catch (e) {
      console.log(`❌ ${table.label}: ERROR`);
      allGood = false;
    }
  }

  console.log('\n📊 Checking default data...\n');

  try {
    const stats = await prisma.$queryRaw`SELECT * FROM showcase_stats;`;
    console.log(`✅ Showcase stats: ${stats.length} records`);
    stats.forEach(s => console.log(`   - ${s.stat_key}: ${s.stat_value}`));
  } catch (e) {
    console.log('❌ Showcase stats: ERROR');
    allGood = false;
  }

  try {
    const settings = await prisma.$queryRaw`SELECT id FROM portal_settings WHERE id = 'singleton';`;
    console.log(`✅ Portal settings: ${settings.length > 0 ? 'exists' : 'missing'}`);
  } catch (e) {
    console.log('❌ Portal settings: ERROR');
    allGood = false;
  }

  console.log('\n' + (allGood ? '✅ All CR-04 tables are ready!' : '⚠️  Some issues found'));

  await prisma.$disconnect();
}

main();
