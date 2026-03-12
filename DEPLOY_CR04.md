# CR-04 Deployment Guide for Vercel

## Step 1: Apply Database Migrations

Since you're using Vercel with PostgreSQL, you need to apply the migrations to create the new tables.

### Option A: Run Migration Locally (Recommended)

```bash
# 1. Pull production environment variables
npx vercel env pull .env.production

# 2. Apply migrations to production database
npx prisma migrate deploy

# 3. Generate Prisma client
npx prisma generate
```

### Option B: Add Build Script (One-time setup)

Add this to your `package.json` scripts:

```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma migrate deploy && next build",
    "build": "next build"
  }
}
```

Then update `vercel.json`:

```json
{
  "buildCommand": "npm run vercel-build",
  "framework": "nextjs"
}
```

> ⚠️ **Warning**: Running migrations on every build can be risky. Option A is safer.

## Step 2: Set Environment Variables on Vercel

Go to your Vercel Dashboard → Project Settings → Environment Variables, and add:

### Required for CR-04:

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | postgresql://... | Production |
| `RESEND_API_KEY` | re_xxxxxxxx | Production |
| `FROM_EMAIL` | noreply@yourdomain.com | Production |
| `FROM_NAME` | MSH Corporate Trainer | Production |
| `ADMIN_EMAIL` | msulfri@gmail.com | Production |

### Optional:

| Variable | Purpose |
|----------|---------|
| `SENDGRID_API_KEY` | Alternative email service |
| `GA4_MEASUREMENT_ID` | Google Analytics 4 |

## Step 3: Deploy

```bash
# Deploy to Vercel
npx vercel --prod
```

Or push to your Git repository (Vercel will auto-deploy).

## Step 4: Initialize Default Data

After deployment, run this once to set up default data:

```bash
# Connect to your database and run:
npx prisma db execute --stdin <<EOF
-- Insert default showcase stats
INSERT INTO "showcase_stats" ("id", "stat_key", "stat_value", "label", "updated_at") 
VALUES 
    (gen_random_uuid()::text, 'classes_completed', 0, 'Classes Completed', NOW()),
    (gen_random_uuid()::text, 'hours_delivered', 0, 'Training Hours Delivered', NOW()),
    (gen_random_uuid()::text, 'participants_trained', 0, 'Participants Trained', NOW()),
    (gen_random_uuid()::text, 'unique_clients', 0, 'Unique Client Organisations', NOW())
ON CONFLICT ("stat_key") DO NOTHING;

-- Insert default portal settings
INSERT INTO "portal_settings" ("id", "updated_at")
VALUES ('singleton', NOW())
ON CONFLICT ("id") DO NOTHING;
EOF
```

## Step 5: Verify Deployment

Check these URLs after deployment:

- `/` - Homepage with new showcase sections
- `/api/testimonials` - Should return empty array `[]`
- `/api/showcase-stats` - Should return 4 stats
- `/proposal` - Proposal form
- `/contact` - Contact form
- `/admin/analytics` - BI Dashboard
- `/sitemap.xml` - Should show XML
- `/robots.txt` - Should show robots rules

## Troubleshooting

### Migration Failed?
```bash
# Reset and reapply (CAREFUL: This deletes data!)
npx prisma migrate reset

# Or mark as applied without running
npx prisma migrate resolve --applied 20250309000000_cr04_client_showcase_bi_module
```

### Tables Not Created?
```bash
# Check current migration status
npx prisma migrate status

# Deploy pending migrations
npx prisma migrate deploy
```

### Build Error on Vercel?
```bash
# Regenerate Prisma client
npx prisma generate

# Commit the changes
git add .
git commit -m "Update Prisma client for CR-04"
git push
```

## Post-Deployment Checklist

- [ ] Run database migrations
- [ ] Set all environment variables
- [ ] Verify `/admin` login works
- [ ] Add sample testimonials
- [ ] Add sample case studies
- [ ] Update showcase stats with real numbers
- [ ] Configure WhatsApp number in `/admin/settings`
- [ ] Configure email templates in `/admin/settings`
- [ ] Test proposal submission
- [ ] Test contact form
- [ ] Verify PDF download works
