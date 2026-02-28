# CR-01 Migration Guide: Credly Badge Wallet & Skills Wallet

This guide covers the database migration steps required to deploy CR-01 (Credly Badge Wallet & Skills Wallet Integration) to production.

## ⚠️ Important Notes

- **Backup your database** before running any migrations
- The existing `Badge` model has been significantly refactored
- Data migration from old badge schema to new schema is required if you have existing badges

---

## Pre-Migration Checklist

- [ ] Backup production database
- [ ] Verify application is in maintenance mode (if applicable)
- [ ] Ensure no active admin users are managing badges during migration

---

## Step 1: Create Migration

### Option A: Using Prisma Migrate (Recommended for Production)

```bash
# Generate migration file
npx prisma migrate dev --name add_badge_wallet_skills_wallet

# Or create without applying (to review first)
npx prisma migrate dev --create-only --name add_badge_wallet_skills_wallet
```

### Option B: Using Prisma DB Push (Development Only)

```bash
# Push schema changes directly (development only!)
npx prisma db push
```

---

## Step 2: Data Migration (If Existing Badges)

If you have existing badges in the old schema, run this data migration script:

### Create Migration Script

Create `scripts/migrate-badges.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateBadges() {
  console.log('Starting badge migration...')

  // Fetch existing badges with old schema
  const existingBadges = await prisma.$queryRaw`
    SELECT * FROM badges 
    WHERE credly_badge_id IS NULL OR credly_badge_id = ''
  `

  console.log(`Found ${existingBadges.length} badges to migrate`)

  for (const badge of existingBadges) {
    try {
      // Generate slug from name
      const slug = badge.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .substring(0, 100)

      // Generate unique slug if needed
      let uniqueSlug = slug
      let counter = 1
      while (await prisma.badge.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${slug}-${counter}`
        counter++
      }

      // Migrate skills from array to relationships
      const skillNames = badge.skills || []
      const skillIds = []

      for (const skillName of skillNames) {
        const normalizedName = skillName.trim()
        if (!normalizedName) continue

        const skillSlug = normalizedName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')

        // Find or create skill
        let skill = await prisma.skill.findUnique({ where: { slug: skillSlug } })
        
        if (!skill) {
          skill = await prisma.skill.create({
            data: {
              name: normalizedName,
              slug: skillSlug,
              visibility: 'PUBLIC',
            },
          })
          console.log(`Created skill: ${normalizedName}`)
        }

        skillIds.push(skill.id)
      }

      // Update badge with new schema fields
      await prisma.badge.update({
        where: { id: badge.id },
        data: {
          title: badge.name,
          slug: uniqueSlug,
          credlyBadgeId: `legacy-${badge.id}`, // Placeholder for legacy badges
          credlyHost: 'https://www.credly.com',
          iframeWidth: 150,
          iframeHeight: 270,
          featured: false,
          visibility: badge.is_visible ? 'PUBLIC' : 'HIDDEN',
          displayOrder: badge.sort_order || 0,
          fallbackImageUrl: badge.image_url,
          verificationUrl: badge.credential_url,
          skills: {
            connect: skillIds.map(id => ({ id })),
          },
        },
      })

      console.log(`Migrated badge: ${badge.name}`)
    } catch (error) {
      console.error(`Failed to migrate badge ${badge.id}:`, error)
    }
  }

  console.log('Migration complete!')
}

migrateBadges()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

### Run Migration Script

```bash
# Compile and run
npx ts-node scripts/migrate-badges.ts

# Or with tsx
npx tsx scripts/migrate-badges.ts
```

---

## Step 3: Deploy Migration

### Production Deployment

```bash
# Apply pending migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### Verify Migration

```bash
# Check database schema
npx prisma db pull --print

# Open Prisma Studio to verify data
npx prisma studio
```

---

## Step 4: Post-Migration Verification

### Verify Tables Created

Run this SQL query to verify all tables exist:

```sql
SELECT table_name 
FROM information.tables 
WHERE table_schema = 'public' 
AND table_name IN ('badges', 'skills', 'badge_skills');
```

### Verify Constraints

```sql
-- Check foreign keys
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'badge_skills';
```

---

## Rollback Plan

If you need to rollback, restore from your backup:

```bash
# Restore database from backup
# (Use your preferred method - pg_restore, etc.)

# Or revert migration
npx prisma migrate resolve --rolled-back "202XXXXXXXXXXXXX_add_badge_wallet_skills_wallet"
```

---

## Environment Variables

Ensure these environment variables are set:

```env
# Existing
DATABASE_URL="postgresql://user:password@localhost:5432/sulfri_portal"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"

# Optional: Credly OAuth for authenticated API access
# Register at: https://www.credly.com/oauth/authorizations
CREDLY_CLIENT_ID="your-credly-client-id"
CREDLY_CLIENT_SECRET="your-credly-client-secret"
CREDLY_REDIRECT_URI="http://localhost:3000/api/credly/oauth/callback"
```

### Setting up Credly OAuth

1. Go to https://www.credly.com/oauth/authorizations (you need a Credly account)
2. Register a new OAuth application
3. Set the callback URL to: `https://yourdomain.com/api/credly/oauth/callback`
4. Copy the Client ID and Client Secret to your environment variables
5. The OAuth flow will allow secure, authenticated access to your Credly badges

---

## Post-Deployment Steps

1. **Create Initial Skills** (if not auto-created):
   - Navigate to `/admin/skills`
   - Add common skills: Cloud Computing, Project Management, Azure, etc.

2. **Configure Credly Sync** (optional):
   - Navigate to `/admin/badges`
   - Enter Credly User ID in the Auto-Sync section
   - Click "Sync Now" to import badges

3. **Update Existing Badges**:
   - Review migrated badges at `/admin/badges`
   - Update titles, descriptions, and skill assignments

4. **Verify Public Pages**:
   - Check `/badges` displays correctly
   - Check `/skills` displays correctly

---

## Troubleshooting

### Issue: Migration fails due to duplicate slugs

**Solution:**
```sql
-- Find duplicate slugs
SELECT slug, COUNT(*) 
FROM badges 
GROUP BY slug 
HAVING COUNT(*) > 1;

-- Manually update duplicates before migration
UPDATE badges SET slug = CONCAT(slug, '-', id) WHERE id = 'specific-id';
```

### Issue: Skills not showing for migrated badges

**Solution:**
Re-run the data migration script or manually assign skills via admin UI.

### Issue: Credly embed not loading

**Solution:**
- Check CSP headers include `https://cdn.credly.com` in `script-src`
- Check CSP headers include `https://www.credly.com` in `frame-src`
- Verify badge IDs are correct in database

---

## Migration Checklist

- [ ] Database backed up
- [ ] Migration file created (`npx prisma migrate dev`)
- [ ] Migration applied to production (`npx prisma migrate deploy`)
- [ ] Prisma Client regenerated (`npx prisma generate`)
- [ ] Data migration script run (if existing badges)
- [ ] Skills created
- [ ] Badges verified in admin
- [ ] Public pages tested
- [ ] CSP headers verified

---

## Support

If you encounter issues during migration:
1. Check Prisma migration logs
2. Verify database connection string
3. Ensure PostgreSQL version >= 12
4. Check application logs for errors
