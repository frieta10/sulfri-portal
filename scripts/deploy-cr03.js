#!/usr/bin/env node

/**
 * CR-03 Deployment Helper Script
 * 
 * This script helps deploy CR-03 database changes to production.
 * Run this after deploying to Vercel to ensure database tables are created.
 * 
 * Usage:
 *   node scripts/deploy-cr03.js
 * 
 * Or set up as a Vercel deploy hook.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load .env.local file if it exists
const envLocalPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
  console.log('Loaded environment from .env.local');
}

console.log('\n');
console.log('==============================================================');
console.log('     CR-03 Event Registration Module - Deploy Helper         ');
console.log('==============================================================');
console.log('\n');

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set!');
  console.log('\nPlease run first:');
  console.log('  npx vercel env pull .env.local');
  console.log('\nOr set it manually:');
  console.log('  set DATABASE_URL=postgresql://user:pass@host:port/dbname');
  process.exit(1);
}

console.log('DATABASE_URL is set');
const dbHostMatch = process.env.DATABASE_URL.match(/@([^/]+)/);
console.log('Database host: ' + (dbHostMatch ? dbHostMatch[1] : 'unknown'));
console.log('\n');

// Confirm before proceeding
console.log('WARNING: This will modify your production database!');
console.log('New tables that will be created:');
console.log('  - event_courses');
console.log('  - event_leads');
console.log('  - lead_course_selections');
console.log('  - event_settings');
console.log('\n');

// Check for --force flag
const force = process.argv.includes('--force');

if (!force) {
  console.log('To proceed, run with --force flag:');
  console.log('  npm run deploy:cr03');
  console.log('\n');
  process.exit(0);
}

console.log('Deploying CR-03 database changes...\n');

try {
  // Run prisma db push
  console.log('Running Prisma db push...');
  console.log('(Accepting data loss for schema changes)\n');
  execSync('npx prisma db push --accept-data-loss', { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  
  console.log('\nDatabase migration completed successfully!');
  console.log('\nNext steps:');
  console.log('  1. Verify tables: npx prisma studio');
  console.log('  2. Go to /admin/courses and try bulk upload');
  console.log('  3. Test event registration at /event-register');
  console.log('\n');
  
} catch (error) {
  console.error('\nMigration failed!');
  console.error('Error:', error.message);
  console.log('\nTroubleshooting:');
  console.log('  1. Check DATABASE_URL is correct');
  console.log('  2. Ensure network access to database');
  console.log('  3. Check database user has CREATE TABLE permissions');
  console.log('\n');
  process.exit(1);
}
