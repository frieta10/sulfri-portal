-- ============================================
-- CR-04: Client Showcase, Automation & BI Module
-- ============================================

-- Module B: Testimonials
CREATE TABLE IF NOT EXISTS "testimonials" (
    "id" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "author_title" TEXT,
    "author_organisation" TEXT,
    "photo_url" TEXT,
    "rating" INTEGER,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "testimonials_visibility_idx" ON "testimonials"("visibility");
CREATE INDEX IF NOT EXISTS "testimonials_display_order_idx" ON "testimonials"("display_order");

-- Module B: Case Studies
CREATE TABLE IF NOT EXISTS "case_studies" (
    "id" TEXT NOT NULL,
    "client_label" TEXT NOT NULL,
    "training_topic" TEXT NOT NULL,
    "participant_count" INTEGER,
    "duration_text" TEXT,
    "outcome_summary" VARCHAR(200),
    "study_date" TIMESTAMP(3),
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_studies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "case_studies_visibility_idx" ON "case_studies"("visibility");
CREATE INDEX IF NOT EXISTS "case_studies_display_order_idx" ON "case_studies"("display_order");

-- Module B: Press Entries
CREATE TABLE IF NOT EXISTS "press_entries" (
    "id" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "publication" TEXT NOT NULL,
    "url" TEXT,
    "published_date" TIMESTAMP(3),
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "press_entries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "press_entries_visibility_idx" ON "press_entries"("visibility");
CREATE INDEX IF NOT EXISTS "press_entries_display_order_idx" ON "press_entries"("display_order");

-- Module B: Showcase Stats (admin-editable live counters)
CREATE TABLE IF NOT EXISTS "showcase_stats" (
    "id" TEXT NOT NULL,
    "stat_key" TEXT NOT NULL,
    "stat_value" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "showcase_stats_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "showcase_stats_stat_key_key" ON "showcase_stats"("stat_key");

-- Insert default stats
INSERT INTO "showcase_stats" ("id", "stat_key", "stat_value", "label", "updated_at") 
VALUES 
    (gen_random_uuid()::text, 'classes_completed', 0, 'Classes Completed', CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'hours_delivered', 0, 'Training Hours Delivered', CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'participants_trained', 0, 'Participants Trained', CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'unique_clients', 0, 'Unique Client Organisations', CURRENT_TIMESTAMP)
ON CONFLICT ("stat_key") DO NOTHING;

-- Module C: Proposal Requests
CREATE TYPE "ProposalStatus" AS ENUM ('NEW', 'SENT', 'FOLLOWED_UP', 'CONVERTED', 'LOST');
CREATE TYPE "GroupSizeRange" AS ENUM ('UNDER_20', 'BETWEEN_20_50', 'BETWEEN_50_100', 'OVER_100');

CREATE TABLE IF NOT EXISTS "proposal_requests" (
    "id" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "organisation" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "industry_sector" TEXT,
    "topic_interest" TEXT NOT NULL,
    "group_size" "GroupSizeRange" NOT NULL,
    "delivery_mode" "CourseDeliveryMode" NOT NULL,
    "preferred_timeline" TEXT,
    "additional_notes" TEXT,
    "generated_pdf_url" TEXT,
    "status" "ProposalStatus" NOT NULL DEFAULT 'NEW',
    "admin_notes" TEXT,
    "consent_flag" BOOLEAN NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposal_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "proposal_requests_email_idx" ON "proposal_requests"("email");
CREATE INDEX IF NOT EXISTS "proposal_requests_status_idx" ON "proposal_requests"("status");
CREATE INDEX IF NOT EXISTS "proposal_requests_submitted_at_idx" ON "proposal_requests"("submitted_at");

-- Module C: Pricing Tiers
CREATE TABLE IF NOT EXISTS "pricing_tiers" (
    "id" TEXT NOT NULL,
    "tier_name" TEXT NOT NULL,
    "price_range_text" TEXT NOT NULL,
    "description" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_tiers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "pricing_tiers_visibility_idx" ON "pricing_tiers"("visibility");
CREATE INDEX IF NOT EXISTS "pricing_tiers_display_order_idx" ON "pricing_tiers"("display_order");

-- Module D: Lead Pipeline (Unified CRM)
CREATE TYPE "LeadSource" AS ENUM ('PROPOSAL', 'EVENT', 'DIRECT_ENQUIRY');
CREATE TYPE "PipelineStatus" AS ENUM ('NEW', 'CONTACTED', 'PROPOSAL_SENT', 'NEGOTIATING', 'CONVERTED', 'LOST', 'ARCHIVED');

CREATE TABLE IF NOT EXISTS "leads_pipeline" (
    "id" TEXT NOT NULL,
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
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pipeline_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "leads_pipeline_email_idx" ON "leads_pipeline"("email");
CREATE INDEX IF NOT EXISTS "leads_pipeline_status_idx" ON "leads_pipeline"("status");
CREATE INDEX IF NOT EXISTS "leads_pipeline_source_idx" ON "leads_pipeline"("source");
CREATE INDEX IF NOT EXISTS "leads_pipeline_created_at_idx" ON "leads_pipeline"("created_at");

-- Module D: Direct Enquiries
CREATE TABLE IF NOT EXISTS "direct_enquiries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "organisation" TEXT,
    "message" TEXT NOT NULL,
    "consent_flag" BOOLEAN NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "direct_enquiries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "direct_enquiries_email_idx" ON "direct_enquiries"("email");
CREATE INDEX IF NOT EXISTS "direct_enquiries_submitted_at_idx" ON "direct_enquiries"("submitted_at");

-- Module D: Email Log
CREATE TYPE "EmailStatus" AS ENUM ('SENT', 'FAILED', 'RETRYING');

CREATE TABLE IF NOT EXISTS "email_log" (
    "id" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "subject" TEXT,
    "template_name" TEXT,
    "status" "EmailStatus" NOT NULL,
    "sent_at" TIMESTAMP(3),
    "error_message" TEXT,
    "lead_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "email_log_recipient_email_idx" ON "email_log"("recipient_email");
CREATE INDEX IF NOT EXISTS "email_log_status_idx" ON "email_log"("status");
CREATE INDEX IF NOT EXISTS "email_log_lead_id_idx" ON "email_log"("lead_id");
CREATE INDEX IF NOT EXISTS "email_log_created_at_idx" ON "email_log"("created_at");

-- Module E: Analytics Events
CREATE TABLE IF NOT EXISTS "analytics_events" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_data" JSONB,
    "referrer_url" TEXT,
    "user_agent" TEXT,
    "ip_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "analytics_events_event_type_idx" ON "analytics_events"("event_type");
CREATE INDEX IF NOT EXISTS "analytics_events_created_at_idx" ON "analytics_events"("created_at");

-- Module E: PDF Download Log
CREATE TABLE IF NOT EXISTS "pdf_download_logs" (
    "id" TEXT NOT NULL,
    "pdf_type" TEXT NOT NULL,
    "referrer_page" TEXT,
    "user_agent" TEXT,
    "ip_hash" TEXT,
    "downloaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pdf_download_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "pdf_download_logs_pdf_type_idx" ON "pdf_download_logs"("pdf_type");
CREATE INDEX IF NOT EXISTS "pdf_download_logs_downloaded_at_idx" ON "pdf_download_logs"("downloaded_at");

-- Module F: Extended Portal Settings
CREATE TABLE IF NOT EXISTS "portal_settings" (
    "id" TEXT NOT NULL,
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
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portal_settings_pkey" PRIMARY KEY ("id")
);

-- Insert default portal settings
INSERT INTO "portal_settings" ("id", "updated_at")
VALUES ('singleton', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
