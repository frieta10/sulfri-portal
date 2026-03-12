# AGENTS.md - Sulfri Trainer Portal

> This file contains essential information for AI coding agents working on this project. Read this first before making any changes.

## Project Overview

Sulfri Trainer Portal is a comprehensive personal trainer management platform featuring a public-facing profile website and an admin backoffice. It enables trainers to:

- **Manage Training Classes**: Create classes with auto-generated join codes, track registrations, export data to CSV
- **Handle Digital Credentials**: Import and display professional badges from Credly (via embed codes, OAuth sync, or Open Badges 3.0 JSON files)
- **Skills Management**: Catalog and organize professional skills linked to badges
- **Expertise Tree (CR-02)**: Hierarchical skill tree visualization linking badges to training expertise areas
- **Event Lead Capture (CR-03)**: QR-driven event registration with course catalogue and lead management
- **Resource Downloads**: Upload and manage downloadable documents (PDFs, Office files, images)
- **Public Profile**: Auto-generated marketing page showcasing experience, credentials, and expertise

The project is designed for deployment on **Vercel** with **PostgreSQL** database.

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript | 5.9+ |
| Database | PostgreSQL | 14+ |
| ORM | Prisma | 5.22+ |
| Authentication | NextAuth.js | 4.24+ (Credentials Provider with JWT) |
| UI Components | shadcn/ui | Latest |
| UI Primitives | Radix UI | Latest |
| Styling | Tailwind CSS | 3.3+ |
| Forms | React Hook Form | 7.71+ |
| Validation | Zod | 4.3+ |
| File Storage | Vercel Blob | Production |
| Toast Notifications | react-hot-toast | 2.6+ |
| Icons | lucide-react | Latest |
| CSV Export | PapaParse | 5.5+ |
| QR Code | qrcode | 1.5+ |
| Image Cropping | react-easy-crop | 5.5+ |
| Carousel | embla-carousel-react | 8.6+ |

## Project Structure

```
sulfri-portal/
├── prisma/                          # Database schema and migrations
│   ├── schema.prisma               # Prisma schema definition
│   ├── migrations/                 # Database migration files
│   └── seed.ts                     # Database seed script (creates admin + profile)
│
├── scripts/                         # Utility scripts
│   ├── create-admin.ts             # Admin user management (create/reset/list)
│   ├── cleanup-db.ts               # Database cleanup utility
│   ├── migrate-badges.ts           # Badge data migration script
│   ├── rollback-badges.ts          # Badge migration rollback
│   ├── deploy-cr03.js              # CR-03 deployment script
│   └── run-production-migration.js # Production migration runner
│
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (admin)/                # Admin route group
│   │   │   ├── admin/
│   │   │   │   ├── badges/         # Badge management UI
│   │   │   │   ├── courses/        # Event course management (CR-03)
│   │   │   │   ├── event-settings/ # Event settings configuration
│   │   │   │   ├── expertise/      # Expertise tree editor (CR-02)
│   │   │   │   ├── leads/          # Lead management (CR-03)
│   │   │   │   ├── qr/             # QR code generator (CR-03)
│   │   │   │   └── skills/         # Skills management UI
│   │   │   ├── badge-mappings/     # Badge-to-expertise mapping UI
│   │   │   ├── change-password/    # Password change page
│   │   │   ├── classes/            # Class CRUD pages
│   │   │   ├── dashboard/          # Admin dashboard
│   │   │   ├── downloads/          # File upload management
│   │   │   ├── profile-settings/   # Trainer profile settings
│   │   │   ├── error.tsx           # Admin error boundary
│   │   │   └── layout.tsx          # Admin layout with navigation
│   │   │
│   │   ├── api/                    # API routes (RESTful)
│   │   │   ├── admin/              # Admin-only API endpoints
│   │   │   │   ├── badge-expertise-map/  # Badge-expertise mappings
│   │   │   │   ├── badges/         # Badge CRUD, import, sync
│   │   │   │   ├── event/          # Event management APIs (courses, leads, QR, settings)
│   │   │   │   ├── expertise/      # Expertise node CRUD
│   │   │   │   └── skills/         # Skills CRUD
│   │   │   ├── auth/               # NextAuth.js configuration
│   │   │   ├── badges/             # Public badge endpoints
│   │   │   ├── classes/            # Class CRUD endpoints
│   │   │   ├── credly/             # Credly OAuth integration
│   │   │   ├── downloads/          # Download management
│   │   │   ├── event/              # Public event registration endpoints
│   │   │   ├── experience/         # Public experience data
│   │   │   ├── expertise/          # Public expertise tree endpoints
│   │   │   ├── health/             # Health check endpoints
│   │   │   ├── join/               # Public join code validation
│   │   │   ├── profile/            # Profile settings endpoints
│   │   │   ├── skills/             # Public skills endpoints
│   │   │   └── upload/             # File upload endpoint
│   │   │
│   │   ├── badges/                 # Public badge gallery pages
│   │   ├── downloads-public/       # Public downloads page
│   │   ├── expertise/              # Public expertise tree visualization
│   │   ├── event-register/         # Public event registration (CR-03)
│   │   ├── join/[code]/            # Public class registration page
│   │   ├── login/                  # Admin login page
│   │   ├── skills/                 # Public skills wallet page
│   │   ├── page.tsx                # Homepage (public profile)
│   │   ├── layout.tsx              # Root layout
│   │   ├── globals.css             # Global styles with Tailwind
│   │   ├── not-found.tsx           # 404 page
│   │   └── error.tsx               # Global error boundary
│   │
│   ├── components/
│   │   ├── admin/                  # Admin-specific components
│   │   │   ├── class-form.tsx      # Class creation/edit form
│   │   │   ├── mobile-nav.tsx      # Mobile navigation
│   │   │   └── sidebar.tsx         # Admin sidebar navigation
│   │   ├── client-carousel.tsx     # Client logo carousel
│   │   ├── credly-badges.tsx       # Credly badge display
│   │   ├── image-cropper.tsx       # Image cropping component
│   │   ├── training-expertise.tsx  # Training expertise display
│   │   ├── providers/              # Context providers
│   │   │   └── toast-provider.tsx  # Toast notification provider
│   │   └── ui/                     # shadcn/ui components
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── checkbox.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── neon-card.tsx       # Custom neon-styled card
│   │       ├── select.tsx
│   │       ├── skeleton.tsx
│   │       ├── slider.tsx
│   │       └── textarea.tsx
│   │
│   ├── lib/                        # Utilities and configurations
│   │   ├── auth.ts                 # NextAuth configuration
│   │   ├── credly.ts               # Credly embed code utilities
│   │   ├── credly-oauth.ts         # Credly OAuth integration
│   │   ├── openbadges3.ts          # Open Badges 3.0 parser
│   │   ├── prisma.ts               # Prisma client singleton
│   │   ├── storage.ts              # File upload/storage utilities
│   │   ├── utils.ts                # Tailwind utility (cn helper)
│   │   ├── hooks/                  # Custom React hooks
│   │   │   └── use-unsaved-changes.ts
│   │   ├── utils/                  # Helper utilities
│   │   │   ├── csv-export.ts       # CSV export functionality
│   │   │   ├── generate-code.ts    # Join code generation
│   │   │   └── rate-limit.ts       # Rate limiting utilities
│   │   └── validations/            # Zod validation schemas
│   │       ├── badge.ts
│   │       ├── class.ts
│   │       ├── download.ts
│   │       ├── event-registration.ts
│   │       ├── password.ts
│   │       ├── profile.ts
│   │       ├── registration.ts
│   │       └── skill.ts
│   │
│   ├── types/
│   │   └── next-auth.d.ts          # NextAuth type extensions
│   │
│   └── middleware.ts               # Route protection middleware
│
├── .env.example                    # Environment variable template
├── .env.local                      # Local environment (git-ignored)
├── components.json                 # shadcn/ui configuration
├── next.config.js                  # Next.js configuration with security headers
├── tailwind.config.ts              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
├── vercel.json                     # Vercel deployment configuration
└── package.json
```

## Build and Development Commands

```bash
# Development
npm run dev                        # Start development server on http://localhost:3000

# Build and Production
npm run build                      # Build for production (runs prisma generate + next build)
npm start                          # Start production server
npm run lint                       # Run ESLint

# Database (Prisma)
npm run prisma:migrate             # Create and apply migrations in development
npm run prisma:generate            # Generate Prisma client
npm run prisma:studio              # Open Prisma Studio (database GUI)
npm run prisma:seed                # Seed database with admin user and profile

# Admin Management
npm run admin:create               # Create a new admin user
npm run admin:reset                # Reset admin password
npm run admin:list                 # List all admin users

# Database Cleanup
npm run db:cleanup                 # Clean up database data

# Deployment
npm run deploy:cr03                # Deploy CR-03 features with --force flag
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SHADOW_DATABASE_URL` | No | Shadow database for migrations (local dev) |
| `NEXTAUTH_URL` | Yes | App URL (e.g., `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Yes | JWT secret (generate with `openssl rand -base64 32`) |
| `BLOB_READ_WRITE_TOKEN` | For production | Vercel Blob token for file uploads |
| `SUPER_ADMIN_EMAIL` | For seeding | Default admin email |
| `SUPER_ADMIN_PASSWORD` | For seeding | Default admin password (min 8 chars) |
| `SUPER_ADMIN_NAME` | Optional | Default admin display name |
| `CREDLY_CLIENT_ID` | Optional | Credly OAuth app ID |
| `CREDLY_CLIENT_SECRET` | Optional | Credly OAuth secret |
| `CREDLY_REDIRECT_URI` | Optional | OAuth callback URL |

## Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `admin_users` | Admin accounts with bcrypt hashed passwords |
| `classes` | Training classes with auto-generated join codes |
| `registrations` | Student registrations linked to classes |
| `downloads` | Uploadable documents with visibility control |
| `profile_settings` | Single-row table for trainer profile (singleton pattern) |

### Badge & Skills Tables

| Table | Description |
|-------|-------------|
| `badges` | Digital credentials from Credly or manual entry |
| `skills` | Skill catalog with visibility control |
| `badge_skills` | Junction table linking badges to skills |
| `oauth_states` | OAuth state tokens for Credly integration |
| `credly_oauth_tokens` | Stored OAuth tokens for Credly API access |

### Expertise Tree Tables (CR-02)

| Table | Description |
|-------|-------------|
| `expertise_nodes` | Hierarchical expertise areas (self-referential) |
| `badge_expertise_map` | Junction table linking badges to expertise nodes |
| `expertise_assets` | Assets attached to expertise nodes |

### Event Registration Tables (CR-03)

| Table | Description |
|-------|-------------|
| `event_courses` | Course catalogue for event registration |
| `event_leads` | Lead capture from event registrations |
| `lead_course_selections` | Junction table linking leads to courses |
| `event_settings` | Singleton configuration for event pages |

### Enums

- **ClientType**: `INDIVIDUAL`, `CORPORATE`, `GOVERNMENT`, `ACADEMIC`
- **ClassMode**: `ONLINE`, `IN_PERSON`, `HYBRID`
- **ClassStatus**: `UPCOMING`, `ONGOING`, `COMPLETED`, `CANCELLED`
- **Visibility**: `PUBLIC`, `HIDDEN`
- **ProficiencyLevel**: `FOUNDATION`, `INTERMEDIATE`, `ADVANCED`, `SPECIALIST`
- **AssetType**: `OUTLINE`, `SAMPLE`, `CASE_STUDY`, `LINK`
- **MappingSource**: `MANUAL`, `SUGGESTED`
- **CourseStatus**: `DRAFT`, `PUBLISHED`, `COMPLETED`, `RETIRED`
- **CourseDeliveryMode**: `ONLINE`, `PHYSICAL`, `HYBRID`
- **LeadStatus**: `NEW`, `CONTACTED`, `ARCHIVED`

## Code Style Guidelines

### TypeScript

- Use strict TypeScript configuration (`strict: true` in tsconfig.json)
- Define explicit return types for functions
- Use path aliases (`@/components`, `@/lib`) for imports
- Extend NextAuth types in `src/types/next-auth.d.ts`

### Components

- Use functional components with explicit props interfaces
- Place server components directly in page files
- Use `'use client'` directive only when necessary (forms, interactivity, hooks)
- Follow shadcn/ui patterns for UI components
- Use the `cn()` utility from `@/lib/utils` for conditional Tailwind classes

### API Routes

- Use `NextRequest` and `NextResponse` from `next/server`
- Validate all inputs with Zod schemas from `@/lib/validations`
- Return consistent error response format: `{ error: string, details?: any }`
- Check authentication with `getServerSession(authOptions)` for admin routes
- Use Prisma client singleton from `@/lib/prisma` for database operations

### Database

- Use Prisma client singleton from `@/lib/prisma`
- Map column names to snake_case with `@map()` decorator in schema
- Use enums for constrained string values
- Index frequently queried columns (joinCode, status, email, etc.)

### File Naming Conventions

| Type | Convention |
|------|------------|
| Components | PascalCase (e.g., `ClassForm.tsx`) |
| Pages | `page.tsx` (Next.js convention) |
| Layouts | `layout.tsx` (Next.js convention) |
| API Routes | `route.ts` (Next.js convention) |
| Utilities | camelCase (e.g., `generateCode.ts`) |
| Validation Schemas | camelCase (e.g., `class.ts`) |
| Database Models | PascalCase in Prisma, snake_case in DB |

## Authentication & Authorization

### NextAuth Configuration

- **Strategy**: JWT with 24-hour expiry
- **Provider**: Credentials (email/password)
- **Password Hashing**: bcrypt with 12 rounds
- **Session**: Stored in JWT, maxAge 24 hours

### Protected Routes

Middleware in `src/middleware.ts` protects:
- `/dashboard/*`
- `/classes/*`
- `/profile-settings/*`
- `/downloads/*`
- `/change-password/*`

Note: `/admin/*` routes are protected at the layout level using `getServerSession`.

### Admin API Routes

All `/api/admin/*` routes should verify authentication:

```typescript
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  // ... handler logic
}
```

## File Upload System

### Storage Strategy

The system supports dual storage modes (automatically selected):

1. **Vercel Blob** (Production): When `BLOB_READ_WRITE_TOKEN` is set
2. **Local Disk** (Development): Files stored in `public/uploads/`

### Allowed File Types

- PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- JPEG, PNG images
- Max size: 10MB

### Usage

```typescript
import { uploadFile, deleteFile, validateFile } from "@/lib/storage"

// Validate before upload
const error = validateFile(file)
if (error) return { error }

// Upload (automatically selects storage)
const url = await uploadFile(file)

// Delete
await deleteFile(fileUrl)
```

## Badge Management System

### Badge Import Methods

1. **Credly Embed Code**: Extract badge data from Credly's iframe embed code
2. **Open Badges 3.0**: Import JSON files following OB3/Verifiable Credentials spec
3. **Credly OAuth**: Authenticate with Credly to auto-sync badges
4. **Manual Entry**: Create badges with all fields manually

### Badge-Skill Relationships

Badges can be linked to Skills via the `badge_skills` junction table. This allows:
- Filtering badges by skill
- Showing related badges on skill pages
- Skills are automatically created during badge import if they don't exist

### Credly Integration

Due to Credly API restrictions, the recommended approach is:
1. Copy embed code from Credly badge share dialog
2. Paste into the badge import form
3. System extracts badge ID and metadata automatically

OAuth integration is available for auto-sync but requires Credly app registration.

## Expertise Tree System (CR-02)

### Overview

The expertise tree provides hierarchical visualization of training expertise areas with badge credibility indicators.

### Key Features

- **Hierarchical Structure**: Self-referential `expertise_nodes` table (max 4 levels)
- **Badge Linking**: Badges can be mapped to expertise nodes via `badge_expertise_map`
- **Proficiency Levels**: FOUNDATION, INTERMEDIATE, ADVANCED, SPECIALIST
- **Assets**: Expertise nodes can have attached assets (outlines, samples, case studies, links)

### Public Endpoints

- `GET /api/expertise/tree` - Get complete expertise tree structure
- `GET /api/expertise/[slug]` - Get single expertise node details
- `GET /api/expertise/[slug]/badges` - Get badges linked to an expertise node

### Admin Endpoints

- `GET /api/admin/expertise` - List all expertise nodes
- `POST /api/admin/expertise` - Create new expertise node
- `PATCH /api/admin/expertise/[id]` - Update expertise node
- `DELETE /api/admin/expertise/[id]` - Delete expertise node
- `GET /api/admin/badge-expertise-map` - List badge-expertise mappings
- `POST /api/admin/badge-expertise-map` - Create mapping

## Event Registration System (CR-03)

### Overview

QR-driven event registration system with course catalogue and lead management for capturing participant interest at events.

### Key Features

- **Course Management**: Create and manage event courses with multiple delivery modes
- **Lead Capture**: Collect participant information and course selections
- **QR Code Generation**: Generate QR codes linking to registration page
- **Duplicate Prevention**: Configurable cooldown period for duplicate submissions
- **CSV Export**: Export leads for external CRM integration

### Public Endpoints

- `GET /api/event/courses` - List published courses
- `POST /api/event/register` - Submit registration (rate limited: 10/hour per IP)
- `GET /api/event/settings` - Get event settings

### Admin Endpoints

- `GET /api/admin/event/courses` - List all courses
- `POST /api/admin/event/courses` - Create course
- `PATCH /api/admin/event/courses/[id]` - Update course
- `DELETE /api/admin/event/courses/[id]` - Delete course
- `POST /api/admin/event/courses/bulk` - Bulk operations
- `GET /api/admin/event/leads` - List leads
- `GET /api/admin/event/leads/export` - Export leads to CSV
- `POST /api/admin/event/qr` - Generate QR codes
- `GET /api/admin/event/settings` - Get settings
- `PATCH /api/admin/event/settings` - Update settings

### Admin Navigation Sections

The admin sidebar organizes navigation into sections:
- **Main**: Dashboard, Classes, Profile, Downloads
- **Credentials**: Badges, Skills, Expertise Tree
- **Event Management**: Event Courses, Event Leads, QR Codes, Event Settings
- **System**: Security (Change Password)

## Security Considerations

### HTTP Security Headers

Configured in `next.config.js`:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy` with strict rules
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` for camera/microphone/geolocation

### CSP Configuration

```javascript
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.credly.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https: https://*.credly.com https://cdn.credly.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://*.public.blob.vercel-storage.com https://www.credly.com;
  frame-src 'self' https://www.credly.com;
  frame-ancestors 'none'
```

### Input Validation

- All API inputs validated with Zod schemas
- SQL injection prevention via Prisma ORM (parameterized queries)
- File upload type and size restrictions
- XSS protection via React's automatic escaping

### Rate Limiting

Rate limiting implemented on public endpoints:
- `/api/join/[code]`: 5 requests per IP per minute
- `/api/event/register`: 10 requests per IP per hour
- Uses memory-based store (suitable for serverless)

## Admin UI Theme

The admin interface uses a custom "Green Neon" dark theme:

- **Background**: Slate 950 (`bg-slate-950`)
- **Primary Accent**: Green 500/400 (`text-green-400`, `border-green-500/20`)
- **Glow Effects**: Custom box-shadow utilities with green glow
- **Cards**: `neon-card` class with subtle borders and glow
- **Buttons**: `neon-button` with gradient and 3D press effect
- **Inputs**: `neon-input` with green focus ring

Custom CSS classes in `globals.css`:
- `.neon-card` / `.neon-card-hover`
- `.neon-button` / `.neon-button-outline`
- `.neon-input`
- `.neon-badge`
- `.neon-text`
- `.neon-table`
- `.neon-scrollbar`
- `.neon-divider`
- `.neon-dialog`

## Common Tasks

### Adding a New API Route

1. Create route file in `src/app/api/[endpoint]/route.ts`
2. Export `GET`, `POST`, `PUT`, `DELETE` functions as needed
3. Validate inputs with Zod schemas from `@/lib/validations`
4. Check authentication with `getServerSession(authOptions)` for admin routes
5. Use Prisma client from `@/lib/prisma` for database operations
6. Return consistent error format: `{ error: string }`

### Adding a New Admin Page

1. Create page in `src/app/(admin)/[page-name]/page.tsx`
2. Add navigation link in `src/components/admin/sidebar.tsx` in appropriate section
3. Route is automatically protected by middleware (unless under `/admin/*`)
4. Use server components by default; add `'use client'` only if needed

### Adding a New Validation Schema

1. Create Zod schema in `src/lib/validations/[name].ts`
2. Export schema and inferred TypeScript type
3. Use `.refine()` for cross-field validation
4. Import in API routes and forms

### Modifying Database Schema

1. Edit `prisma/schema.prisma`
2. Run `npm run prisma:migrate` to create migration
3. Run `npm run prisma:generate` to update client
4. Update related API routes and components
5. Update seed script if necessary

## Testing Strategy

This project currently does **not** have automated tests configured. When adding tests:

- Add unit tests for validation schemas and utility functions
- Add integration tests for API routes using `next-test-api-route-handler`
- Test database operations with a test database
- Consider Playwright for E2E testing of critical user flows

## Deployment

### Vercel Deployment

1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Set up Vercel Blob storage for file uploads
4. Deploy automatically on push to main branch

### Build Configuration (vercel.json)

```json
{
  "buildCommand": "prisma generate && next build",
  "framework": "nextjs",
  "installCommand": "npm install"
}
```

### Database Migration on Production

```bash
# Pull environment variables locally
npx vercel env pull .env.local

# Deploy migrations
npx prisma migrate deploy
```

### Post-Deployment Checklist

- [ ] Verify login at `/login`
- [ ] Check admin dashboard at `/dashboard`
- [ ] Test class creation and join links
- [ ] Verify file uploads in Downloads section
- [ ] Check public profile page at `/`
- [ ] Test public registration via join link
- [ ] Change default admin password
- [ ] Verify badge import functionality
- [ ] Test Credly OAuth if configured
- [ ] Check expertise tree at `/expertise`
- [ ] Verify badge-expertise mappings
- [ ] Test event registration at `/event-register`
- [ ] Verify course management at `/admin/courses`
- [ ] Test lead management at `/admin/leads`
- [ ] Generate QR codes at `/admin/qr`
- [ ] Export leads to CSV

## Dependencies to Avoid Adding

- Avoid adding jQuery or similar DOM manipulation libraries
- Avoid adding additional CSS frameworks (use Tailwind)
- Avoid adding alternative form libraries (use React Hook Form)
- Avoid adding alternative validation libraries (use Zod)
- Avoid adding alternative UI libraries (extend shadcn/ui)

## Getting Help

- See `README.md` for setup instructions
- See `DEPLOY.md` for deployment instructions
- See `OPEN_BADGES_3_GUIDE.md` for OB3 import details
- See `MIGRATION_CR01.md` for Badge Wallet migration guide
- See `MIGRATION_CR02.md` for Expertise Tree migration guide
- See `MIGRATION_CR03.md` for Event Registration migration guide
- Check existing code patterns before implementing new features
- Review similar API routes or components for consistency
