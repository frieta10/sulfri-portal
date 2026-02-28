#!/usr/bin/env node
/**
 * Production Database Migration Script for CR-01
 * 
 * This script runs the SQL migration on your production database.
 * 
 * Usage:
 *   node scripts/run-production-migration.js "your-production-database-url"
 * 
 * Or set DATABASE_URL environment variable:
 *   DATABASE_URL="your-url" node scripts/run-production-migration.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  // Get database URL from command line or environment
  const databaseUrl = process.argv[2] || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ Error: Database URL required');
    console.error('Usage: node scripts/run-production-migration.js "postgresql://..."');
    console.error('   or: DATABASE_URL="postgresql://..." node scripts/run-production-migration.js');
    process.exit(1);
  }

  console.log('🔧 Running CR-01 Production Migration...\n');

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false // Required for many cloud providers
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'prisma', 'migrations', '20250301000000_add_badge_wallet_tables', 'migration.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📜 Executing migration SQL...\n');
    
    // Run the migration
    await client.query(migrationSql);

    console.log('✅ Migration completed successfully!\n');

    // Verify tables were created
    const verifyResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('skills', 'badge_skills', 'oauth_states', 'credly_oauth_tokens')
      ORDER BY table_name
    `);

    console.log('📊 Tables created:');
    verifyResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Check badges table columns
    const badgeColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'badges'
      AND column_name IN ('title', 'slug', 'credly_badge_id', 'visibility', 'featured')
      ORDER BY column_name
    `);

    console.log('\n📋 New badges columns:');
    badgeColumns.rows.forEach(row => {
      console.log(`   - ${row.column_name}`);
    });

    console.log('\n🎉 Migration complete! Your production database is now ready for CR-01.');
    console.log('   You can now use the Badge Wallet and Skills Wallet features.');

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n💡 Some objects may already exist. This is OK if you\'re re-running the migration.');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
