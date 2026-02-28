#!/usr/bin/env node
/**
 * Database Schema Checker
 * 
 * This script checks if your database has the correct schema for CR-01.
 * 
 * Usage:
 *   node scripts/check-database.js "your-database-url"
 */

const { Client } = require('pg');

async function checkDatabase() {
  const databaseUrl = process.argv[2] || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ Error: Database URL required');
    console.error('Usage: node scripts/check-database.js "postgresql://..."');
    process.exit(1);
  }

  console.log('🔍 Checking database schema...\n');

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check if skills table exists
    const skillsTable = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'skills'
      )
    `);
    console.log(`Skills table: ${skillsTable.rows[0].exists ? '✅ EXISTS' : '❌ MISSING'}`);

    // Check if badge_skills table exists
    const badgeSkillsTable = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'badge_skills'
      )
    `);
    console.log(`Badge_skills table: ${badgeSkillsTable.rows[0].exists ? '✅ EXISTS' : '❌ MISSING'}`);

    // Check badges table columns
    const badgeColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'badges'
      ORDER BY column_name
    `);
    
    console.log('\n📋 Badges table columns:');
    const requiredColumns = ['title', 'slug', 'credly_badge_id', 'visibility', 'featured', 'display_order'];
    const existingColumns = badgeColumns.rows.map(r => r.column_name);
    
    requiredColumns.forEach(col => {
      const exists = existingColumns.includes(col);
      console.log(`   ${exists ? '✅' : '❌'} ${col}`);
    });

    // Check if there are any badges
    const badgeCount = await client.query('SELECT COUNT(*) FROM badges');
    console.log(`\n📊 Total badges in database: ${badgeCount.rows[0].count}`);

    // Check for any badges with null title
    const nullTitleBadges = await client.query(`
      SELECT COUNT(*) FROM badges WHERE title IS NULL OR title = ''
    `);
    if (parseInt(nullTitleBadges.rows[0].count) > 0) {
      console.log(`⚠️  Warning: ${nullTitleBadges.rows[0].count} badges have NULL/empty title`);
    }

    await client.end();
    
    console.log('\n✅ Check complete!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
