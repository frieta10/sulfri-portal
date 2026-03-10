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
npm run db:cleanup             # Clean up database data

# Admin management
npm run admin:create           # Create a new admin user
npm run admin:reset            # Reset admin password
npm run admin:list             # List all admin users
```

No test runner is configured yet.

## Architecture

### Route Groups

- `src/app/(admin)/` — Protected admin routes. Pages directly under this group (e.g. `/dashboard`, `/classes`) are protected by `src/middleware.ts`. Pages under `src/app/(admin)/admin/` (e.g. `/admin/badges`, `/admin/skills`) are NOT in the middleware matcher — they rely on the layout's `getServerSession` redirect instead. Add nav links in `src/app/(admin)/layout.tsx`.
- `src/app/(public)/` — Public routes (no auth required).
- `src/app/api/` — API routes using Next.js App Router conventions (`route.ts` files).
- `src/app/join/[code]/` — Public class self-registration page.
- `src/app/downloads-public/` — Public downloads listing.

### Authentication

Configured in [src/lib/auth.ts](src/lib/auth.ts). Uses NextAuth.js Credentials Provider with JWT sessions (24-hour expiry). Passwords hashed with bcrypt (12 rounds). The middleware in [src/middleware.ts](src/middleware.ts) protects `/dashboard`, `/classes`, `/profile-settings`, `/downloads`, `/change-password`. The `/admin/*` sub-routes are protected at the layout level instead.

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
- `Badge` — Credly badges with embed code, visibility, display order, and optional auto-sync
- `Skill` — skills/competencies that can be linked to badges
- `BadgeSkill` — explicit junction table linking Badge ↔ Skill (composite PK)
- `OauthState` — short-lived state tokens for Credly OAuth PKCE flow
- `CredlyOAuthToken` — stored Credly OAuth tokens per admin user

Enums: `ClientType` (INDIVIDUAL/CORPORATE/GOVERNMENT/ACADEMIC), `ClassMode` (ONLINE/IN_PERSON/HYBRID), `ClassStatus` (UPCOMING/ONGOING/COMPLETED/CANCELLED), `Visibility` (PUBLIC/HIDDEN).

After editing `prisma/schema.prisma`, run `npm run prisma:migrate` then `npm run prisma:generate`.

### File Storage

Abstracted in [src/lib/storage.ts](src/lib/storage.ts). Uses Vercel Blob when `BLOB_READ_WRITE_TOKEN` is set, otherwise falls back to local disk (`public/uploads/`). Allowed types: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG. Max size: 10MB.

### Badge & Credly Integration

Badges are managed at `/admin/badges` and skills at `/admin/skills`. Several import/sync strategies are supported:

- **Manual entry** — create badges individually via admin UI
- **OB3 import** — `POST /api/admin/badges/import-ob3` parses Open Badges 3.0 JSON
- **Batch import** — `POST /api/admin/badges/batch-import`
- **Credly OAuth sync** — connect via `GET /api/credly/oauth` → callback at `/api/credly/oauth/callback`, then sync with `POST /api/admin/badges/sync-oauth`
- **Credly embed sync** — `POST /api/admin/badges/sync` scrapes embed codes without OAuth

OAuth status/disconnect managed via `GET /api/admin/badges/oauth-status` and `POST /api/admin/badges/oauth-disconnect`.

Public badge/skill data is available at `GET /api/badges`, `GET /api/badges/[slug]`, `GET /api/skills`, `GET /api/skills/[slug]`.

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
| -------- | -------- | ----------- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SHADOW_DATABASE_URL` | Dev only | Shadow DB for Prisma migrations |
| `NEXTAUTH_URL` | Yes | App URL (e.g., `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Yes | JWT secret (`openssl rand -base64 32`) |
| `BLOB_READ_WRITE_TOKEN` | Production | Vercel Blob token for file uploads |
| `CREDLY_CLIENT_ID` | Optional | Credly OAuth app client ID |
| `CREDLY_CLIENT_SECRET` | Optional | Credly OAuth app client secret |
| `CREDLY_REDIRECT_URI` | Optional | OAuth callback URL (e.g. `http://localhost:3000/api/credly/oauth/callback`) |
| `SUPER_ADMIN_EMAIL/PASSWORD/NAME` | Seeding only | Default admin credentials |

## Further Reference

See [AGENTS.md](AGENTS.md) for common task walkthroughs (adding API routes, admin pages, validation schemas) and deployment instructions.
