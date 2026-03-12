#!/usr/bin/env node
/**
 * Fix All Missing Migrations (CR-03 + CR-04)
 * Run: node scripts/fix-all-migrations.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTable(tableName, createSQL) {
  try {
    await prisma.$executeRawUnsafe(createSQL);
    console.log(`✅ ${tableName} created`);
    return true;
  } catch (e) {
    if (e.message.includes('already exists')) {
      console.log(`✓ ${tableName} already exists`);
      return true;
    }
    console.log(`❌ ${tableName}: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log('========================================');
  console.log('Fixing All Database Tables');
  console.log('========================================\n');

  // Create enum types first
  console.log('Creating enum types...');
  try {
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CourseStatus') THEN
          CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'COMPLETED', 'RETIRED');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CourseDeliveryMode') THEN
          CREATE TYPE "CourseDeliveryMode" AS ENUM ('ONLINE', 'PHYSICAL', 'HYBRID');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LeadStatus') THEN
          CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'ARCHIVED');
        END IF;
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
    console.log('✅ Enum types created\n');
  } catch (e) {
    console.log('⚠️  Enum types issue:', e.message, '\n');
  }

  // CR-03 Tables
  console.log('Creating CR-03 tables...');
  
  await createTable('event_courses', `
    CREATE TABLE IF NOT EXISTS "event_courses" (
      "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "title" TEXT NOT NULL,
      "short_description" TEXT,
      "full_description" TEXT,
      "delivery_mode" "CourseDeliveryMode" NOT NULL DEFAULT 'ONLINE',
      "start_date" TIMESTAMP(3),
      "end_date" TIMESTAMP(3),
      "location" TEXT,
      "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
      "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
      "display_order" INTEGER NOT NULL DEFAULT 0,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await createTable('event_leads', `
    CREATE TABLE IF NOT EXISTS "event_leads" (
      "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "full_name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "phone" TEXT NOT NULL,
      "organisation" TEXT,
      "job_title" TEXT,
      "consent_flag" BOOLEAN NOT NULL,
      "utm_source" TEXT,
      "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
      "admin_notes" TEXT,
      "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await createTable('lead_course_selections', `
    CREATE TABLE IF NOT EXISTS "lead_course_selections" (
      "lead_id" TEXT NOT NULL,
      "course_id" TEXT NOT NULL,
      "selected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY ("lead_id", "course_id")
    );
  `);

  await createTable('event_settings', `
    CREATE TABLE IF NOT EXISTS "event_settings" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "yayasan_notice_text" TEXT DEFAULT 'All courses listed are offered under the YAYASAN PENERAJU programme.',
      "registration_page_title" TEXT DEFAULT 'Register Your Interest',
      "registration_page_tagline" TEXT DEFAULT 'Join our upcoming professional development programmes',
      "duplicate_cooldown_hours" INTEGER NOT NULL DEFAULT 24,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO "event_settings" ("id", "updated_at") VALUES ('singleton', CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING;
  `);

  // CR-04 Tables
  console.log('\nCreating CR-04 tables...');

  await createTable('showcase_stats', `
    CREATE TABLE IF NOT EXISTS "showcase_stats" (
      "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "stat_key" TEXT NOT NULL UNIQUE,
      "stat_value" INTEGER NOT NULL DEFAULT 0,
      "label" TEXT NOT NULL,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO "showcase_stats" ("id", "stat_key", "stat_value", "label", "updated_at") VALUES 
      (gen_random_uuid()::text, 'classes_completed', 0, 'Classes Completed', CURRENT_TIMESTAMP),
      (gen_random_uuid()::text, 'hours_delivered', 0, 'Training Hours Delivered', CURRENT_TIMESTAMP),
      (gen_random_uuid()::text, 'participants_trained', 0, 'Participants Trained', CURRENT_TIMESTAMP),
      (gen_random_uuid()::text, 'unique_clients', 0, 'Unique Client Organisations', CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;
  `);

  await createTable('portal_settings', `
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
    INSERT INTO "portal_settings" ("id", "updated_at") VALUES ('singleton', CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING;
  `);

  await createTable('testimonials', `
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

  await createTable('case_studies', `
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

  await createTable('proposal_requests', `
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

  await createTable('leads_pipeline', `
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

  await createTable('email_log', `
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

  await createTable('analytics_events', `
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

  await createTable('pdf_download_logs', `
    CREATE TABLE IF NOT EXISTS "pdf_download_logs" (
      "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "pdf_type" TEXT NOT NULL,
      "referrer_page" TEXT,
      "user_agent" TEXT,
      "ip_hash" TEXT,
      "downloaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('\n========================================');
  console.log('Table creation complete!');
  console.log('========================================');

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
