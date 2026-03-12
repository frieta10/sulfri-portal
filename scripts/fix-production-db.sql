-- Emergency Fix Script for CR-04 Tables
-- Run this if migrations fail on production

-- Create enum types if they don't exist
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

-- Create testimonials table
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

CREATE INDEX IF NOT EXISTS "testimonials_visibility_idx" ON "testimonials"("visibility");
CREATE INDEX IF NOT EXISTS "testimonials_display_order_idx" ON "testimonials"("display_order");

-- Create case_studies table
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

CREATE INDEX IF NOT EXISTS "case_studies_visibility_idx" ON "case_studies"("visibility");
CREATE INDEX IF NOT EXISTS "case_studies_display_order_idx" ON "case_studies"("display_order");

-- Create showcase_stats table
CREATE TABLE IF NOT EXISTS "showcase_stats" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "stat_key" TEXT NOT NULL UNIQUE,
    "stat_value" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default stats
INSERT INTO "showcase_stats" ("id", "stat_key", "stat_value", "label", "updated_at") 
VALUES 
    (gen_random_uuid()::text, 'classes_completed', 0, 'Classes Completed', CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'hours_delivered', 0, 'Training Hours Delivered', CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'participants_trained', 0, 'Participants Trained', CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'unique_clients', 0, 'Unique Client Organisations', CURRENT_TIMESTAMP)
ON CONFLICT ("stat_key") DO NOTHING;

-- Create proposal_requests table
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

CREATE INDEX IF NOT EXISTS "proposal_requests_email_idx" ON "proposal_requests"("email");
CREATE INDEX IF NOT EXISTS "proposal_requests_status_idx" ON "proposal_requests"("status");

-- Create leads_pipeline table
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

CREATE INDEX IF NOT EXISTS "leads_pipeline_email_idx" ON "leads_pipeline"("email");
CREATE INDEX IF NOT EXISTS "leads_pipeline_status_idx" ON "leads_pipeline"("status");

-- Create portal_settings table
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

INSERT INTO "portal_settings" ("id", "updated_at")
VALUES ('singleton', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Create email_log table
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

CREATE INDEX IF NOT EXISTS "email_log_status_idx" ON "email_log"("status");

-- Record the migration as applied
INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
    gen_random_uuid()::text,
    '',
    CURRENT_TIMESTAMP,
    '20250309000000_cr04_client_showcase_bi_module',
    'Manually applied via fix script',
    null,
    CURRENT_TIMESTAMP,
    1
)
ON CONFLICT (migration_name) DO NOTHING;

SELECT 'CR-04 tables created successfully!' as result;
