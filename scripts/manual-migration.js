#!/usr/bin/env node
/**
 * Manual Migration Script for CR-04
 * Run: node scripts/manual-migration.js
 */

const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function checkTables() {
  console.log('🔍 Checking CR-04 tables...\n');
  
  const tables = [
    'testimonials',
    'case_studies', 
    'showcase_stats',
    'proposal_requests',
    'leads_pipeline',
    'portal_settings',
    'email_log'
  ];
  
  for (const table of tables) {
    try {
      const result = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        );
      `;
      const exists = result[0]?.exists;
      console.log(`${exists ? '✅' : '❌'} ${table}: ${exists ? 'EXISTS' : 'MISSING'}`);
    } catch (e) {
      console.log(`❌ ${table}: ERROR - ${e.message}`);
    }
  }
}

async function runMigration() {
  console.log('\n🔧 Running CR-04 migration...\n');
  
  try {
    // Create enum types
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProposalStatus') THEN
          CREATE TYPE "ProposalStatus" AS ENUM ('NEW', 'SENT', 'FOLLOWED_UP', 'CONVERTED', 'LOST');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GroupSizeRange') THEN
          CREATE TYPE "GroupSizeRange" AS ENUM ('UNDER_20', 'BETWEEN_20_50', 'BETWEEN_50_100', 'OVER_100');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeadSource') THEN
          CREATE TYPE "LeadSource" AS ENUM ('PROPOSAL', 'EVENT', 'DIRECT_ENQUIRY');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PipelineStatus') THEN
          CREATE TYPE "PipelineStatus" AS ENUM ('NEW', 'CONTACTED', 'PROPOSAL_SENT', 'NEGOTIATING', 'CONVERTED', 'LOST', 'ARCHIVED');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EmailStatus') THEN
          CREATE TYPE "EmailStatus" AS ENUM ('SENT', 'FAILED', 'RETRYING');
        END IF;
      END $$;
    `);
    console.log('✅ Enum types created');

    // Create showcase_stats table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "showcase_stats" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "stat_key" TEXT NOT NULL UNIQUE,
        "stat_value" INTEGER NOT NULL DEFAULT 0,
        "label" TEXT NOT NULL,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ showcase_stats table created');

    // Insert default stats
    await prisma.$executeRawUnsafe(`
      INSERT INTO "showcase_stats" ("id", "stat_key", "stat_value", "label", "updated_at") 
      VALUES 
        (gen_random_uuid()::text, 'classes_completed', 0, 'Classes Completed', CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'hours_delivered', 0, 'Training Hours Delivered', CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'participants_trained', 0, 'Participants Trained', CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'unique_clients', 0, 'Unique Client Organisations', CURRENT_TIMESTAMP)
      ON CONFLICT ("stat_key") DO NOTHING;
    `);
    console.log('✅ Default stats inserted');

    // Create portal_settings table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "portal_settings" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "whatsapp_number" TEXT,
        "whatsapp_prefill_message" TEXT DEFAULT 'Hi, I''m interested in your training services.',
        "sticky_cta_enabled" BOOLEAN NOT NULL DEFAULT true,
        "ga4_measurement_id" TEXT,
        "seo_homepage_title" TEXT DEFAULT 'MSH Corporate Trainer | Professional Training & Consulting',
        "seo_homepage_description" TEXT,
        "og_image_url" TEXT,
        "proposal_duplicate_cooldown_hours" INTEGER NOT NULL DEFAULT 48,
        "follow_up_trigger_days" INTEGER NOT NULL DEFAULT 3,
        "email_confirmation_subject" TEXT DEFAULT 'Thank you for your interest',
        "email_confirmation_body" TEXT,
        "email_followup_subject" TEXT DEFAULT 'Following up on your training inquiry',
        "email_followup_body" TEXT,
        "pdf_include_certifications" BOOLEAN NOT NULL DEFAULT true,
        "pdf_include_expertise" BOOLEAN NOT NULL DEFAULT true,
        "pdf_include_clients" BOOLEAN NOT NULL DEFAULT true,
        "pdf_include_experience" BOOLEAN NOT NULL DEFAULT true,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ portal_settings table created');

    // Insert default settings
    await prisma.$executeRawUnsafe(`
      INSERT INTO "portal_settings" ("id", "updated_at")
      VALUES ('singleton', CURRENT_TIMESTAMP)
      ON CONFLICT ("id") DO NOTHING;
    `);
    console.log('✅ Default settings inserted');

    // Create other CR-04 tables
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "testimonials" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "quote" TEXT NOT NULL,
        "author_name" TEXT NOT NULL,
        "author_title" TEXT,
        "author_organisation" TEXT,
        "photo_url" TEXT,
        "rating" INTEGER,
        "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
        "display_order" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ testimonials table created');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "case_studies" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "client_label" TEXT NOT NULL,
        "training_topic" TEXT NOT NULL,
        "participant_count" INTEGER,
        "duration_text" TEXT,
        "outcome_summary" VARCHAR(200),
        "study_date" TIMESTAMP(3),
        "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
        "display_order" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ case_studies table created');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "proposal_requests" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "contact_name" TEXT NOT NULL,
        "organisation" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "industry_sector" TEXT,
        "topic_interest" TEXT NOT NULL,
        "group_size" "GroupSizeRange" NOT NULL,
        "delivery_mode" TEXT NOT NULL,
        "preferred_timeline" TEXT,
        "additional_notes" TEXT,
        "generated_pdf_url" TEXT,
        "status" "ProposalStatus" NOT NULL DEFAULT 'NEW',
        "admin_notes" TEXT,
        "consent_flag" BOOLEAN NOT NULL,
        "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ proposal_requests table created');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "leads_pipeline" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "source" "LeadSource" NOT NULL,
        "source_record_id" TEXT,
        "contact_name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "organisation" TEXT,
        "topic_interest" TEXT,
        "status" "PipelineStatus" NOT NULL DEFAULT 'NEW',
        "follow_up_date" TIMESTAMP(3),
        "admin_notes" TEXT,
        "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ leads_pipeline table created');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "email_log" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "recipient_email" TEXT NOT NULL,
        "subject" TEXT,
        "template_name" TEXT,
        "status" "EmailStatus" NOT NULL,
        "sent_at" TIMESTAMP(3),
        "error_message" TEXT,
        "lead_id" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ email_log table created');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "analytics_events" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "event_type" TEXT NOT NULL,
        "event_data" JSONB,
        "referrer_url" TEXT,
        "user_agent" TEXT,
        "ip_hash" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ analytics_events table created');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "pdf_download_logs" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "pdf_type" TEXT NOT NULL,
        "referrer_page" TEXT,
        "user_agent" TEXT,
        "ip_hash" TEXT,
        "downloaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ pdf_download_logs table created');

    // Mark migration as applied
    await prisma.$executeRawUnsafe(`
      INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES (
        gen_random_uuid()::text,
        '',
        CURRENT_TIMESTAMP,
        '20250309000000_cr04_client_showcase_bi_module',
        'Applied via manual-migration.js script',
        null,
        CURRENT_TIMESTAMP,
        1
      )
      ON CONFLICT (migration_name) DO NOTHING;
    `);
    console.log('✅ Migration marked as applied');

    console.log('\n🎉 CR-04 Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

async function main() {
  console.log('========================================');
  console.log('CR-04 Manual Migration Script');
  console.log('========================================\n');

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment');
    console.log('Make sure to run: npx vercel env pull .env.production');
    process.exit(1);
  }

  console.log('📍 Database:', process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'unknown');
  console.log('');

  // Check current status
  await checkTables();

  // Ask for confirmation
  console.log('\n⚠️  This will create all CR-04 tables if they don\'t exist.');
  console.log('Type "yes" to continue:');
  
  // Auto-continue for now (you can add prompt logic if needed)
  console.log('Auto-continuing...\n');
  
  await runMigration();

  // Verify
  console.log('\n📋 Verifying tables after migration:\n');
  await checkTables();

  await prisma.$disconnect();
}

main();
