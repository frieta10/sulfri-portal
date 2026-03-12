# Migration Guide: CR-03 Event Lead Capture & Course Registration

This document provides step-by-step instructions for implementing **CR-03: Event Lead Capture & YAYASAN PENERAJU Course Registration Module** in the Sulfri Trainer Portal.

## Overview

CR-03 introduces a QR-Driven Event Lead Capture and Course Registration Module that enables:

- **Public Event Registration**: QR code landing page (`/event-register`) for participants to register interest
- **Course Catalogue Management**: Admin-managed courses with visibility controls
- **Lead Management**: Centralized storage, filtering, and export of event leads
- **QR Code Generation**: Create trackable QR codes for different events

## Prerequisites

- Base SRS v1.0 implemented
- CR-01 (Badge Wallet) and CR-02 (Expertise Tree) should be functional
- Node.js 18+ and PostgreSQL 14+

## Database Migration

### 1. Schema Changes

The following changes have been made to `prisma/schema.prisma`:

#### New Enums

```prisma
enum CourseStatus {
  DRAFT
  PUBLISHED
  COMPLETED
  RETIRED
}

enum CourseDeliveryMode {
  ONLINE
  PHYSICAL
  HYBRID
}

enum LeadStatus {
  NEW
  CONTACTED
  ARCHIVED
}
```

#### New Tables

**event_courses** - Course catalogue
- `id` (PK UUID)
- `title` (required)
- `short_description`, `full_description`
- `delivery_mode` (ONLINE/PHYSICAL/HYBRID)
- `start_date`, `end_date`, `location`
- `status` (DRAFT/PUBLISHED/COMPLETED/RETIRED)
- `visibility` (PUBLIC/HIDDEN)
- `display_order`
- `created_at`, `updated_at`

**event_leads** - Lead capture
- `id` (PK UUID)
- `full_name`, `email`, `phone` (required)
- `organisation`, `job_title` (optional)
- `consent_flag` (required, PDPA compliance)
- `utm_source` (for tracking)
- `status` (NEW/CONTACTED/ARCHIVED)
- `admin_notes`
- `registered_at`, `updated_at`

**lead_course_selections** - Junction table
- `lead_id` (FK)
- `course_id` (FK)
- `selected_at`
- Composite PK (lead_id, course_id)

**event_settings** - Singleton configuration
- `id` (singleton = "singleton")
- `yayasan_notice_text`
- `registration_page_title`
- `registration_page_tagline`
- `duplicate_cooldown_hours`

### 2. Apply Migration (Development)

```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to database (development)
npx prisma db push
```

### 3. Deploy to Production (Vercel)

**⚠️ IMPORTANT: You must run the database migration on your production database after deploying to Vercel!**

#### Option A: Using the Deploy Script (Recommended)

```bash
# Pull environment variables from Vercel
npx vercel env pull .env.local

# Run the deployment helper
node scripts/deploy-cr03.js --force
```

#### Option B: Manual Migration

```bash
# 1. Pull production environment variables
npx vercel env pull .env.local

# 2. Verify DATABASE_URL is set
echo $DATABASE_URL

# 3. Run Prisma db push on production
npx prisma db push
```

#### Option C: Using Vercel CLI with --prod flag

```bash
# Connect to your production database directly
DATABASE_URL="your-production-db-url" npx prisma db push
```

### 4. Verify Deployment

After running the migration, verify the tables were created:

```bash
# Open Prisma Studio
npx prisma studio

# Check that these tables exist:
# - event_courses
# - event_leads
# - lead_course_selections
# - event_settings
```

## Installation

### 1. Install QR Code Package

```bash
npm install qrcode @types/qrcode
```

### 2. Environment Variables

Ensure `NEXTAUTH_URL` is set in your environment:

```env
NEXTAUTH_URL=http://localhost:3000  # Development
# or
NEXTAUTH_URL=https://your-domain.com  # Production
```

## File Structure

### New Files Created

```
src/
├── app/
│   ├── (admin)/
│   │   └── admin/
│   │       ├── courses/page.tsx          # Course catalogue management
│   │       ├── leads/page.tsx            # Lead management
│   │       ├── qr/page.tsx               # QR code generator
│   │       └── event-settings/page.tsx   # Event settings
│   ├── api/
│   │   ├── event/
│   │   │   ├── courses/route.ts          # GET public courses
│   │   │   ├── register/route.ts         # POST registration
│   │   │   └── settings/route.ts         # GET public settings
│   │   └── admin/
│   │       └── event/
│   │           ├── courses/route.ts      # GET, POST
│   │           ├── courses/[id]/route.ts # PATCH, DELETE
│   │           ├── leads/route.ts        # GET (list)
│   │           ├── leads/[id]/route.ts   # GET, PATCH
│   │           ├── leads/export/route.ts # GET (CSV export)
│   │           ├── qr/route.ts           # POST (generate QR)
│   │           └── settings/route.ts     # GET, PATCH
│   └── event-register/
│       ├── page.tsx                      # Registration form
│       └── success/page.tsx              # Success page
├── lib/
│   └── validations/
│       └── event-registration.ts         # Zod schemas
```

### Modified Files

- `prisma/schema.prisma` - Added CR-03 tables
- `src/app/(admin)/layout.tsx` - Added navigation links
- `src/components/admin/mobile-nav.tsx` - Added mobile navigation

## API Endpoints

### Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/event/courses` | GET | List published courses |
| `/api/event/register` | POST | Submit registration |
| `/api/event/settings` | GET | Get public settings |

### Admin Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/event/courses` | GET, POST | List/create courses |
| `/api/admin/event/courses/[id]` | PATCH, DELETE | Update/retire course |
| `/api/admin/event/leads` | GET | List leads (paginated) |
| `/api/admin/event/leads/[id]` | GET, PATCH | Get/update lead |
| `/api/admin/event/leads/export` | GET | Export to CSV |
| `/api/admin/event/qr` | POST | Generate QR code |
| `/api/admin/event/settings` | GET, PATCH | Manage settings |

## User Guide

### Admin Workflow

1. **Configure Event Settings**
   - Navigate to `/admin/event-settings`
   - Customize YAYASAN PENERAJU notice text
   - Set page title and tagline
   - Configure duplicate registration cooldown

2. **Create Courses**
   - Go to `/admin/courses`
   - Click "Add Course"
   - Fill in course details
   - Set status to "Published" and visibility to "Public"
   - Reorder courses as needed

3. **Generate QR Code**
   - Go to `/admin/qr`
   - Enter optional UTM source (e.g., "Career Fair 2024")
   - Generate and download QR code (PNG/SVG)
   - Display at events

4. **Manage Leads**
   - Visit `/admin/leads`
   - View all registrations
   - Filter by course, status, or date range
   - Export to CSV for follow-up
   - Update lead status and add notes

### Participant Workflow

1. Scan QR code at event
2. View `/event-register` landing page
3. Select desired courses
4. Fill in personal details
5. Provide consent
6. Submit registration
7. View success confirmation

## Security Considerations

### Rate Limiting
- Registration endpoint: 10 submissions per IP per hour
- Duplicate prevention: Configurable cooldown (default 24 hours)

### Data Protection
- Consent flag mandatory (PDPA compliance)
- Email normalization (lowercase, trimmed)
- Input sanitization on all fields
- Admin-only access to lead data

### Validation
- Server-side validation with Zod schemas
- Email format validation
- Phone number required
- Course existence verification

## Testing Checklist

### Public Pages
- [ ] `/event-register` loads with courses
- [ ] YAYASAN PENERAJU notice displays
- [ ] Course selection works (multi-select)
- [ ] Form validation works
- [ ] Duplicate submission blocked
- [ ] Success page displays correctly
- [ ] UTM source tracking works

### Admin Pages
- [ ] `/admin/courses` lists all courses
- [ ] Can create, edit, retire courses
- [ ] Reordering works
- [ ] `/admin/leads` shows all registrations
- [ ] Search and filters work
- [ ] CSV export works
- [ ] Can update lead status and notes
- [ ] `/admin/qr` generates QR codes
- [ ] PNG/SVG download works
- [ ] `/admin/event-settings` saves settings

### API Endpoints
- [ ] Public endpoints accessible without auth
- [ ] Admin endpoints require authentication
- [ ] Rate limiting active on registration
- [ ] CSV export returns valid file
- [ ] QR generation returns image data

## Troubleshooting

### "The table `public.event_courses` does not exist" Error

**Problem:** You see this error when trying to upload courses or access event registration features.

**Cause:** The CR-03 database tables haven't been created on the production database.

**Solution:**
1. Run the database migration on production:
   ```bash
   # Pull production env vars
   npx vercel env pull .env.local
   
   # Apply migration
   npx prisma db push
   ```

2. Or use the deploy script:
   ```bash
   node scripts/deploy-cr03.js --force
   ```

3. Verify tables exist:
   ```bash
   npx prisma studio
   ```

### QR Code Not Generating
- Check `NEXTAUTH_URL` environment variable
- Verify `qrcode` package is installed
- Check server logs for errors

### Leads Not Appearing
- Verify course status is "Published"
- Check visibility is "Public"
- Confirm no JavaScript errors in browser

### Duplicate Registration Errors
- Check `duplicateCooldownHours` setting
- Verify email normalization
- Check for case sensitivity issues

## Rollback Procedure

If you need to rollback CR-03:

1. Remove database tables (caution: data loss):
   ```sql
   DROP TABLE IF EXISTS lead_course_selections;
   DROP TABLE IF EXISTS event_leads;
   DROP TABLE IF EXISTS event_courses;
   DROP TABLE IF EXISTS event_settings;
   ```

2. Remove enum types:
   ```sql
   DROP TYPE IF EXISTS "CourseStatus";
   DROP TYPE IF EXISTS "CourseDeliveryMode";
   DROP TYPE IF EXISTS "LeadStatus";
   ```

3. Revert schema changes in `prisma/schema.prisma`

4. Remove created files

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v1.3.0 | 2026-03-07 | Initial CR-03 implementation |

## Support

For issues or questions regarding CR-03:
1. Check this migration guide
2. Review API logs
3. Verify database schema
4. Check environment configuration
