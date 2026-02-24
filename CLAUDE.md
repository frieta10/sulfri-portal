# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sulfri Trainer Portal is a personal trainer management platform with a public profile website and admin backoffice. Built with Next.js App Router, PostgreSQL/Prisma, and NextAuth.js. Deployed to Vercel.

## Commands

```bash
# Development
npm run dev                    # Start dev server on http://localhost:3000

# Build
npm run build                  # prisma generate + next build
npm start                      # Start production server
npm run lint                   # Run ESLint

# Database (Prisma)
npm run prisma:migrate         # Run migrations in development
npm run prisma:generate        # Regenerate Prisma client after schema changes
npm run prisma:studio          # Open Prisma Studio GUI
npm run prisma:seed            # Seed database with initial data

# Admin management
npm run admin:create           # Create a new admin user
npm run admin:reset            # Reset admin password
npm run admin:list             # List all admin users
```

No test runner is configured yet.

## Architecture

### Route Groups

- `src/app/(admin)/` — Protected admin routes. Route protection is automatic via `src/middleware.ts`. Adding a page here makes it protected with no extra steps. Add nav links in `src/app/(admin)/layout.tsx`.
- `src/app/(public)/` — Public routes (no auth required).
- `src/app/api/` — API routes using Next.js App Router conventions (`route.ts` files).
- `src/app/join/[code]/` — Public class self-registration page.
- `src/app/downloads-public/` — Public downloads listing.

### Authentication

Configured in [src/lib/auth.ts](src/lib/auth.ts). Uses NextAuth.js Credentials Provider with JWT sessions (24-hour expiry). Passwords hashed with bcrypt (12 rounds). The middleware in [src/middleware.ts](src/middleware.ts) protects `/dashboard`, `/classes`, `/profile-settings`, `/downloads`, `/change-password`.

In API routes, authenticate with:
```ts
const session = await getServerSession(authOptions);
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

### Database

Prisma ORM with PostgreSQL. Import the singleton client from `@/lib/prisma`. Key models:
- `AdminUser` — admin accounts
- `Class` — training classes (joinCode unique index, status/startDatetime indexed)
- `Registration` — student registrations (cascade deletes with Class)
- `Download` — documents with public/private visibility
- `ProfileSettings` — singleton row (id: `"singleton"`) for trainer profile

After editing `prisma/schema.prisma`, run `npm run prisma:migrate` then `npm run prisma:generate`.

### File Storage

Abstracted in [src/lib/storage.ts](src/lib/storage.ts). Uses Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set, otherwise falls back to local disk (`public/uploads/`). Allowed types: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG. Max size: 10MB.

### API Route Pattern

All API routes follow this structure:
1. Parse and validate input with Zod schemas from `@/lib/validations/`
2. Check session via `getServerSession(authOptions)` (admin routes only)
3. Query database via Prisma singleton `@/lib/prisma`
4. Return `NextResponse.json()` — errors use `{ error: string, details?: any }`

### State Management

No global state library. Uses React Hook Form for form state, NextAuth `useSession()` for client-side auth state, and `useState` for local UI state. The custom hook [src/lib/hooks/use-unsaved-changes.ts](src/lib/hooks/use-unsaved-changes.ts) tracks unsaved form edits.

## Code Style

- Path aliases: `@/` maps to `src/`. Always use aliases for imports.
- Use `'use client'` only when necessary (forms, event handlers, browser APIs). Pages are Server Components by default.
- Zod validation schemas live in `src/lib/validations/` — export both the schema and its inferred TypeScript type.
- Prisma models use PascalCase; DB columns use `snake_case` via `@map()`.
- Component files: PascalCase. Utility/hook files: camelCase. API routes: `route.ts`.

## Environment Variables

Copy `.env.example` to `.env.local`:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | App URL (e.g., `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Yes | JWT secret (`openssl rand -base64 32`) |
| `BLOB_READ_WRITE_TOKEN` | Production | Vercel Blob token for file uploads |
| `SUPER_ADMIN_EMAIL/PASSWORD/NAME` | Seeding only | Default admin credentials |

## Further Reference

See [AGENTS.md](AGENTS.md) for additional patterns, common task walkthroughs (adding API routes, admin pages, validation schemas), and deployment instructions.
