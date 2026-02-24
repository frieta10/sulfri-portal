# AGENTS.md - Sulfri Trainer Portal

> This file contains essential information for AI coding agents working on this project. Read this first before making any changes.

## Project Overview

Sulfri Trainer Portal is a personal trainer management platform with a public profile website and admin backoffice. It allows trainers to:

- Manage training classes with auto-generated join codes
- Handle student registrations and export data to CSV
- Upload and manage downloadable resources (PDFs, documents)
- Maintain a public profile page for marketing

The project uses **Next.js 14+ with App Router**, **TypeScript**, **PostgreSQL with Prisma ORM**, and is designed for deployment on **Vercel**.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript 5.9+ |
| Database | PostgreSQL |
| ORM | Prisma 5.22+ |
| Authentication | NextAuth.js 4.24+ (Credentials Provider with JWT) |
| UI Library | shadcn/ui + Radix UI primitives |
| Styling | Tailwind CSS 3.3+ |
| Forms | React Hook Form + Zod validation |
| File Storage | Vercel Blob (production) / Local disk (development) |
| Toast Notifications | react-hot-toast |
| Icons | lucide-react |

## Project Structure

```
sulfri-portal/
├── prisma/                     # Database schema and migrations
│   ├── schema.prisma          # Prisma schema definition
│   ├── migrations/            # Database migration files
│   └── seed.ts                # Database seed script
├── scripts/                    # Utility scripts
│   ├── create-admin.ts        # Admin user management (create/reset/list)
│   └── cleanup-db.ts          # Database cleanup utility
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (admin)/           # Admin route group (protected)
│   │   │   ├── dashboard/     # Admin dashboard
│   │   │   ├── classes/       # Class management (CRUD)
│   │   │   ├── profile-settings/  # Trainer profile settings
│   │   │   ├── downloads/     # File upload management
│   │   │   ├── change-password/   # Password change page
│   │   │   ├── layout.tsx     # Admin layout with navigation
│   │   │   └── error.tsx      # Admin error boundary
│   │   ├── (public)/          # Public route group
│   │   │   └── page.tsx       # Public profile page (homepage)
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # NextAuth.js configuration
│   │   │   ├── classes/       # Class CRUD endpoints
│   │   │   ├── downloads/     # Download management endpoints
│   │   │   ├── join/          # Public join code validation
│   │   │   ├── profile/       # Profile settings endpoints
│   │   │   └── experience/    # Experience data endpoint
│   │   ├── join/[code]/       # Public class registration page
│   │   ├── downloads-public/  # Public downloads page
│   │   ├── login/             # Admin login page
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Homepage (redirects to public profile)
│   │   ├── not-found.tsx      # 404 page
│   │   ├── error.tsx          # Global error boundary
│   │   └── globals.css        # Global styles with Tailwind
│   ├── components/
│   │   ├── admin/             # Admin-specific components
│   │   │   ├── class-form.tsx # Class creation/edit form
│   │   │   └── mobile-nav.tsx # Mobile navigation
│   │   ├── providers/         # Context providers
│   │   │   └── toast-provider.tsx
│   │   └── ui/                # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── textarea.tsx
│   │       ├── badge.tsx
│   │       ├── skeleton.tsx
│   │       └── ...
│   ├── lib/                   # Utilities and configurations
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── storage.ts         # File upload/storage utilities
│   │   ├── utils.ts           # Utility functions (cn helper)
│   │   ├── hooks/             # Custom React hooks
│   │   │   └── use-unsaved-changes.ts
│   │   ├── utils/             # Helper utilities
│   │   │   ├── csv-export.ts  # CSV export functionality
│   │   │   ├── generate-code.ts  # Join code generation
│   │   │   └── rate-limit.ts  # Rate limiting utilities
│   │   └── validations/       # Zod validation schemas
│   │       ├── class.ts
│   │       ├── download.ts
│   │       ├── password.ts
│   │       ├── profile.ts
│   │       └── registration.ts
│   ├── types/
│   │   └── next-auth.d.ts     # NextAuth type extensions
│   └── middleware.ts          # Route protection middleware
├── .env.local                 # Local environment variables (git-ignored)
├── .env.example               # Environment variable template
├── next.config.js             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── components.json            # shadcn/ui configuration
├── vercel.json                # Vercel deployment configuration
└── package.json
```

## Build and Development Commands

```bash
# Development
npm run dev                    # Start development server on http://localhost:3000

# Build and Production
npm run build                  # Build for production (runs prisma generate + next build)
npm start                      # Start production server

# Linting
npm run lint                   # Run ESLint

# Database (Prisma)
npm run prisma:migrate         # Run migrations in development
npm run prisma:generate        # Generate Prisma client
npm run prisma:studio          # Open Prisma Studio (database GUI)
npm run prisma:seed            # Seed database with initial data

# Admin Management
npm run admin:create           # Create a new admin user
npm run admin:reset            # Reset admin password
npm run admin:list             # List all admin users

# Database Cleanup
npm run db:cleanup             # Clean up database data
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | App URL (e.g., `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Yes | JWT secret (generate with `openssl rand -base64 32`) |
| `BLOB_READ_WRITE_TOKEN` | For production | Vercel Blob token for file uploads |
| `SUPER_ADMIN_EMAIL` | For seeding | Default admin email |
| `SUPER_ADMIN_PASSWORD` | For seeding | Default admin password (min 8 chars) |
| `SUPER_ADMIN_NAME` | Optional | Default admin display name |

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `admin_users` | Admin accounts with hashed passwords |
| `classes` | Training classes with auto-generated join codes |
| `registrations` | Student registrations linked to classes |
| `downloads` | Uploadable documents with visibility control |
| `profile_settings` | Single-row table for trainer profile (singleton pattern) |

### Enums

- **ClientType**: `INDIVIDUAL`, `CORPORATE`, `GOVERNMENT`, `ACADEMIC`
- **ClassMode**: `ONLINE`, `IN_PERSON`, `HYBRID`
- **ClassStatus**: `UPCOMING`, `ONGOING`, `COMPLETED`, `CANCELLED`

## Code Style Guidelines

### TypeScript

- Use strict TypeScript configuration
- Define explicit return types for functions
- Use path aliases (`@/components`, `@/lib`) for imports
- Extend NextAuth types in `src/types/next-auth.d.ts`

### Components

- Use functional components with explicit props interfaces
- Place server components directly in page files
- Use `'use client'` directive only when necessary (forms, interactivity)
- Follow shadcn/ui patterns for UI components

### API Routes

- Use `NextRequest` and `NextResponse` from `next/server`
- Validate all inputs with Zod schemas
- Return consistent error response format: `{ error: string, details?: any }`
- Check authentication with `getServerSession(authOptions)`

### Database

- Use Prisma client singleton from `@/lib/prisma`
- Map column names to snake_case with `@map()` decorator
- Use enums for constrained string values
- Index frequently queried columns

## Testing Strategy

This project currently does not have automated tests configured. When adding tests:

- Add unit tests for validation schemas and utility functions
- Add integration tests for API routes
- Test database operations with a test database

## Security Considerations

### Authentication & Authorization

- JWT-based sessions with 24-hour expiry
- Password hashing with bcrypt (12 rounds)
- Route protection via `middleware.ts` for admin routes
- Server-side session validation in API routes

### Input Validation

- All inputs validated with Zod schemas
- SQL injection prevention via Prisma ORM
- File upload type and size restrictions

### HTTP Security Headers

Configured in `next.config.js`:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy` with strict rules
- `Strict-Transport-Security` for HTTPS

### Rate Limiting

- Rate limiting implemented on registration endpoint
- Utility available in `src/lib/utils/rate-limit.ts`

## Deployment

### Vercel Deployment

1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Set up Vercel Blob storage for file uploads
4. Deploy automatically on push to main branch

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

## Common Tasks

### Adding a New API Route

1. Create route file in `src/app/api/[endpoint]/route.ts`
2. Export `GET`, `POST`, `PUT`, `DELETE` functions as needed
3. Validate inputs with Zod schemas from `@/lib/validations`
4. Check authentication with `getServerSession(authOptions)`
5. Use Prisma client from `@/lib/prisma` for database operations

### Adding a New Admin Page

1. Create page in `src/app/(admin)/[page-name]/page.tsx`
2. Add navigation link in `src/app/(admin)/layout.tsx`
3. Route is automatically protected by middleware

### Adding a New Validation Schema

1. Create Zod schema in `src/lib/validations/[name].ts`
2. Export schema and inferred TypeScript type
3. Use `.refine()` for cross-field validation

### Modifying Database Schema

1. Edit `prisma/schema.prisma`
2. Run `npm run prisma:migrate` to create migration
3. Run `npm run prisma:generate` to update client
4. Update related API routes and components

## File Naming Conventions

- **Components**: PascalCase (e.g., `ClassForm.tsx`)
- **Pages**: `page.tsx` (Next.js convention)
- **Layouts**: `layout.tsx` (Next.js convention)
- **API Routes**: `route.ts` (Next.js convention)
- **Utilities**: camelCase (e.g., `generateCode.ts`)
- **Validation Schemas**: camelCase (e.g., `class.ts`)
- **Database Models**: PascalCase in Prisma, snake_case in DB

## Dependencies to Avoid Adding

- Avoid adding jQuery or similar DOM manipulation libraries
- Avoid adding additional CSS frameworks (use Tailwind)
- Avoid adding alternative form libraries (use React Hook Form)
- Avoid adding alternative validation libraries (use Zod)

## Getting Help

- See `README.md` for setup instructions
- See `DEPLOY.md` for deployment instructions
- Check existing code patterns before implementing new features
- Review similar API routes or components for consistency
