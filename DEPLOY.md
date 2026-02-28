# Deployment Guide - Sulfri Trainer Portal

## Prerequisites

- GitHub repository with your code pushed
- Vercel account (https://vercel.com)
- PostgreSQL database (Vercel Postgres, Neon, or Supabase recommended)

## Step 1: Set Up Database

1. Create a PostgreSQL database on your chosen provider
2. Copy the connection string (e.g., `postgresql://user:pass@host:5432/dbname`)

## Step 2: Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel will auto-detect the Next.js framework
4. Before deploying, configure **Environment Variables** (see below)
5. Click **Deploy**

## Step 3: Configure Environment Variables

In the Vercel project dashboard, go to **Settings > Environment Variables** and add:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | Your production URL (e.g., `https://your-app.vercel.app`) |
| `NEXTAUTH_SECRET` | Yes | Generate with: `openssl rand -base64 32` |
| `BLOB_READ_WRITE_TOKEN` | Yes | For file uploads (see Step 4) |

## Step 4: Set Up Vercel Blob Storage

1. In your Vercel project dashboard, go to **Storage**
2. Click **Create** > **Blob**
3. Name your store (e.g., `sulfri-uploads`)
4. The `BLOB_READ_WRITE_TOKEN` will be automatically added to your environment

## Step 5: Run Database Migrations

After the first deployment:

```bash
# Option A: Use Vercel CLI
npx vercel env pull .env.local
npx prisma migrate deploy

# Option B: Run migrations locally with production DATABASE_URL
DATABASE_URL="your-production-db-url" npx prisma migrate deploy
```

## Step 6: Create Super Admin

```bash
# With production DATABASE_URL set
DATABASE_URL="your-production-db-url" \
SUPER_ADMIN_EMAIL="admin@yourdomain.com" \
SUPER_ADMIN_PASSWORD="your-secure-password" \
SUPER_ADMIN_NAME="Admin Name" \
npx tsx scripts/create-admin.ts create
```

Or use the seed script:

```bash
DATABASE_URL="your-production-db-url" \
SUPER_ADMIN_EMAIL="admin@yourdomain.com" \
SUPER_ADMIN_PASSWORD="your-secure-password" \
npm run prisma:seed
```

## Admin Management Commands

```bash
npm run admin:create    # Create a new admin user
npm run admin:reset     # Reset admin password
npm run admin:list      # List all admin users
```

## Post-Deployment Checklist

- [ ] Verify login works at `/login`
- [ ] Check dashboard loads at `/dashboard`
- [ ] Test class creation and join link generation
- [ ] Verify file uploads work (Downloads section)
- [ ] Check public profile at `/`
- [ ] Test public registration via join link
- [ ] Change the default admin password via `/change-password`

---

# CR-01 Migration: Badge Wallet & Skills Wallet

If you're upgrading from a version before CR-01, follow these additional steps:

## 1. Backup Database

```bash
# Create backup before migration
pg_dump $DATABASE_URL > backup-pre-cr01.sql
```

## 2. Apply CR-01 Migration

```bash
# Pull production env vars
npx vercel env pull .env.local

# Apply migration
npx prisma migrate deploy

# Generate client
npx prisma generate
```

## 3. Migrate Existing Badge Data

If you have existing badges in the old format:

```bash
# Run data migration script
npx tsx scripts/migrate-badges.ts
```

See `MIGRATION_CR01.md` for detailed migration documentation.

## 4. Configure Credly (Optional)

1. Navigate to `/admin/badges`
2. Enter your Credly User ID in the Auto-Sync section
3. Click "Sync Now" to import badges automatically

## 5. Create Initial Skills

1. Navigate to `/admin/skills`
2. Add common skills: Cloud Computing, Project Management, Azure, etc.
3. Assign skills to badges via `/admin/badges`

## 6. Verify Public Pages

- [ ] `/badges` - Badge Wallet displays correctly
- [ ] `/skills` - Skills Wallet displays correctly
- [ ] `/badges/[slug]` - Individual badge pages work
- [ ] `/skills/[slug]` - Individual skill pages work

---

## Troubleshooting

## Troubleshooting

**500 error on login**: Ensure `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are set correctly.

**Database connection failed**: Verify `DATABASE_URL` and that your database accepts connections from Vercel's IPs.

**File uploads failing**: Ensure `BLOB_READ_WRITE_TOKEN` is configured. Check Vercel Blob storage is created.

**Migrations not applied**: Run `npx prisma migrate deploy` with the production `DATABASE_URL`.
