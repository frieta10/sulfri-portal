#!/usr/bin/env node
/**
 * Dashboard Error Diagnostic
 * Run: node scripts/diagnose-dashboard.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  console.log('Testing database connection...\n');
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (e) {
    console.log('❌ Database connection failed:', e.message);
    return false;
  }
  return true;
}

async function testQueries() {
  console.log('\nTesting individual queries...\n');
  
  const tests = [
    { name: 'class.count', fn: () => prisma.class.count() },
    { name: 'registration.count', fn: () => prisma.registration.count() },
    { name: 'eventCourse.count', fn: () => prisma.eventCourse.count() },
    { name: 'eventLead.count', fn: () => prisma.eventLead.count() },
    { name: 'analyticsEvent.count', fn: () => prisma.analyticsEvent.count() },
    { name: 'pdfDownloadLog.count', fn: () => prisma.pdfDownloadLog.count() },
    { name: 'proposalRequest.count', fn: () => prisma.proposalRequest.count() },
    { name: 'portalSettings.findUnique', fn: () => prisma.portalSettings.findUnique({ where: { id: 'singleton' } }) },
  ];

  for (const test of tests) {
    try {
      await test.fn();
      console.log(`✅ ${test.name}`);
    } catch (e) {
      console.log(`❌ ${test.name}: ${e.message}`);
    }
  }
}

async function checkTables() {
  console.log('\nChecking if CR-04 tables exist...\n');
  
  const tables = ['analytics_events', 'pdf_download_logs', 'proposal_requests', 'portal_settings', 'leads_pipeline'];
  
  for (const table of tables) {
    try {
      const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM ${prisma.$queryRawUnsafe(`"${table}"`)}`;
      console.log(`✅ ${table}: exists`);
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
    }
  }
}

async function main() {
  console.log('========================================');
  console.log('Dashboard Error Diagnostic Tool');
  console.log('========================================\n');
  
  const connected = await testConnection();
  if (!connected) {
    console.log('\n❌ Cannot connect to database. Check your DATABASE_URL.');
    process.exit(1);
  }
  
  await testQueries();
  await checkTables();
  
  await prisma.$disconnect();
  
  console.log('\n========================================');
  console.log('Diagnostic complete');
  console.log('========================================');
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
