-- CR-04 Table Verification Script
-- Run this in your PostgreSQL database to check if tables exist

-- Check if CR-04 tables exist
SELECT 
    table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = t.table_name
        ) THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM (VALUES 
    ('testimonials'),
    ('case_studies'),
    ('press_entries'),
    ('showcase_stats'),
    ('proposal_requests'),
    ('pricing_tiers'),
    ('leads_pipeline'),
    ('direct_enquiries'),
    ('email_log'),
    ('analytics_events'),
    ('pdf_download_logs'),
    ('portal_settings')
) AS t(table_name);

-- If tables are missing, check migration status
SELECT 
    migration_name,
    finished_at,
    CASE 
        WHEN finished_at IS NOT NULL THEN 'APPLIED'
        ELSE 'PENDING'
    END as status
FROM _prisma_migrations 
WHERE migration_name LIKE '%cr04%'
ORDER BY started_at DESC;
