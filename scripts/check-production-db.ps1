# Production Database Diagnostic Script
# Run: .\scripts\check-production-db.ps1

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "CR-04 Production Database Diagnostic" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Pull production environment variables
Write-Host "Step 1: Pulling production environment variables..." -ForegroundColor Yellow
npx vercel env pull .env.production

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to pull environment variables. Make sure you're logged into Vercel CLI." -ForegroundColor Red
    Write-Host "Run: npx vercel login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Environment variables pulled successfully" -ForegroundColor Green
Write-Host ""

# Check migration status
Write-Host "Step 2: Checking migration status on production database..." -ForegroundColor Yellow
npx prisma migrate status

Write-Host ""
Write-Host "Step 3: Attempting to deploy pending migrations..." -ForegroundColor Yellow
npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "✓ Migrations deployed successfully!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host "✗ Migration deployment failed!" -ForegroundColor Red
    Write-Host "==========================================" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 4: Verifying tables exist..." -ForegroundColor Yellow

# Check if critical tables exist
$tables = @("testimonials", "case_studies", "showcase_stats", "proposal_requests", "leads_pipeline", "portal_settings")

foreach ($table in $tables) {
    $result = npx prisma db execute --stdin <<EOF
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = '$table'
);
EOF
    if ($result -match "t") {
        Write-Host "  ✓ Table '$table' exists" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Table '$table' MISSING" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Diagnostic Complete" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
