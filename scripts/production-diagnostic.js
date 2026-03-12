#!/usr/bin/env node
/**
 * Production Database Diagnostic
 * Run: node scripts/production-diagnostic.js
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

// Pull production env first
console.log('Pulling production environment...\n');
try {
  execSync('npx vercel env pull .env.production', { stdio: 'inherit' });
} catch (e) {
  console.log('Warning: Could not pull env, using existing .env.production');
}

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  console.log('\n========================================');
  console.log('Testing Production Database Connection');
  console.log('========================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to production database\n');
    return true;
  } catch (e) {
    console.log('❌ Connection failed:', e.message);
    return false;
  }
}

async function listAllTables() {
  console.log('\n========================================');
  console.log('Listing All Tables');
  console.log('========================================\n');
  
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log(`Found ${tables.length} tables:\n`);
    tables.forEach(t => console.log(`  - ${t.table_name}`));
  } catch (e) {
    console.log('❌ Error:', e.message);
  }
}

async function testPortalSettings() {
  console.log('\n========================================');
  console.log('Testing Portal Settings Table');
  console.log('========================================\n');
  
  try {
    // Check if table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'portal_settings'
      );
    `;
    
    if (!tableExists[0]?.exists) {
      console.log('❌ portal_settings table does NOT exist');
      return;
    }
    
    console.log('✅ portal_settings table exists');
    
    // Try to read
    const settings = await prisma.portalSettings.findUnique({
      where: { id: 'singleton' }
    });
    
    if (settings) {
      console.log('✅ Settings record found:', settings.id);
    } else {
      console.log('⚠️  Settings record NOT found (will be created on first access)');
    }
  } catch (e) {
    console.log('❌ Error accessing portal_settings:', e.message);
  }
}

async function testPDFDownloadFlow() {
  console.log('\n========================================');
  console.log('Testing PDF Download Flow');
  console.log('========================================\n');
  
  // Test 1: Check pdf_download_logs table
  try {
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'pdf_download_logs'
      );
    `;
    
    if (tableExists[0]?.exists) {
      console.log('✅ pdf_download_logs table exists');
    } else {
      console.log('❌ pdf_download_logs table does NOT exist');
    }
  } catch (e) {
    console.log('❌ Error:', e.message);
  }
  
  // Test 2: Check profile settings
  try {
    const profile = await prisma.profileSettings.findUnique({
      where: { id: 'singleton' }
    });
    
    if (profile) {
      console.log('✅ Profile settings found:', profile.displayName || 'No name');
    } else {
      console.log('⚠️  Profile settings NOT found');
    }
  } catch (e) {
    console.log('❌ Error accessing profile_settings:', e.message);
  }
}

async function testMissingTables() {
  console.log('\n========================================');
  console.log('Checking Critical Tables');
  console.log('========================================\n');
  
  const criticalTables = [
    'admin_users',
    'profile_settings',
    'classes',
    'registrations',
    'skills',
    'badges',
    'expertise_nodes',
    'event_courses',
    'event_leads',
    'portal_settings',
    'showcase_stats',
    'testimonials',
    'case_studies',
    'proposal_requests',
    'leads_pipeline',
    'pdf_download_logs',
    'email_log',
  ];
  
  for (const table of criticalTables) {
    try {
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        );
      `;
      const exists = result[0]?.exists;
      console.log(`${exists ? '✅' : '❌'} ${table}`);
    } catch (e) {
      console.log(`❌ ${table}: ERROR`);
    }
  }
}

async function main() {
  const connected = await testConnection();
  if (!connected) {
    console.log('\n❌ Cannot connect to production database');
    console.log('Make sure .env.production has the correct DATABASE_URL');
    process.exit(1);
  }
  
  await listAllTables();
  await testPortalSettings();
  await testPDFDownloadFlow();
  await testMissingTables();
  
  console.log('\n========================================');
  console.log('Diagnostic Complete');
  console.log('========================================');
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
