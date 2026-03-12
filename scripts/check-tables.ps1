# Check if CR-04 tables exist in production database
# Run: .\scripts\check-tables.ps1

$env:DATABASE_URL = (Get-Content .env.production | Select-String "DATABASE_URL=").ToString().Replace("DATABASE_URL=", "")

Write-Host "Checking CR-04 tables in production database..." -ForegroundColor Cyan

$sql = @"
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
    ('showcase_stats'),
    ('proposal_requests'),
    ('leads_pipeline'),
    ('portal_settings'),
    ('email_log')
) AS t(table_name);
"@

# Save SQL to temp file
$sql | Out-File -FilePath "temp_check.sql" -Encoding UTF8

# Execute using psql or prisma
npx prisma db execute --file temp_check.sql

# Clean up
Remove-Item temp_check.sql
