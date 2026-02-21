# Sulfri Trainer Portal

A personal trainer management platform with public profile website and admin backoffice.

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5 with JWT
- **UI**: shadcn/ui + Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **File Storage**: Supabase Storage (to be configured)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)

### Setup Instructions

1. **Configure Database Connection**

   Update the [DATABASE_URL](.env.local#L2) in `.env.local` with your PostgreSQL connection string:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/sulfri_portal"
   ```

2. **Run Database Migrations**

   ```bash
   npx prisma migrate dev --name init
   ```

3. **Generate Prisma Client**

   ```bash
   npx prisma generate
   ```

4. **Seed Initial Data**

   Creates admin user and profile settings:
   ```bash
   npm run prisma:seed
   ```

   **Default Admin Credentials:**
   - Email: `admin@sulfri.com`
   - Password: `admin123`

5. **Start Development Server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
sulfri-portal/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.ts               # Seed script
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/              # API routes
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Homepage
│   ├── components/           # React components
│   ├── lib/                  # Utilities and configs
│   │   ├── auth.ts          # NextAuth configuration
│   │   ├── prisma.ts        # Prisma client
│   │   └── utils.ts         # Utility functions
│   ├── types/               # TypeScript types
│   └── middleware.ts        # Route protection
└── package.json
```

## Database Schema

### Tables
- **admin_users** - Admin accounts with hashed passwords
- **classes** - Training classes with auto-generated join codes
- **registrations** - Student registrations linked to classes
- **downloads** - Uploadable PDF documents with visibility control
- **profile_settings** - Single-row table for trainer profile

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Prisma commands
npm run prisma:migrate    # Run migrations
npm run prisma:generate   # Generate Prisma client
npm run prisma:studio     # Open Prisma Studio (database GUI)
npm run prisma:seed       # Seed database
```

## Next Steps (Implementation Phases)

See the detailed implementation plan at: `.claude/plans/tidy-munching-pony.md`

### Phase 1: Foundation Setup ✅ COMPLETED
- ✅ Next.js project initialized
- ✅ Dependencies installed
- ✅ Database schema created
- ✅ Authentication configured
- ⏳ Ready for database migration (requires PostgreSQL)

### Phase 2-10: To Be Implemented
- Phase 2: Admin Login & Dashboard
- Phase 3: Class Management CRUD
- Phase 4: Public Registration
- Phase 5: Registration Management & Export
- Phase 6: Public Profile Module
- Phase 7: Downloads & File Upload
- Phase 8: Polish & Security
- Phase 9: Testing & QA
- Phase 10: Deployment

## Environment Variables

Required environment variables (see `.env.local`):

```bash
DATABASE_URL="postgresql://..."  # PostgreSQL connection
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

Optional (for file uploads):
```bash
SUPABASE_URL="..."
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
```

## Features

### Admin Features
- Secure login with email/password
- Create, edit, delete classes
- Auto-generated unique join codes
- View and export student registrations (CSV)
- Manage profile information
- Upload downloadable files (PDF)
- Control visibility of classes and downloads

### Public Features
- View trainer profile
- Browse teaching experience
- Register for classes via join links
- Download public documents
- No login required for public pages

## Security Features

- Password hashing with bcrypt
- JWT-based sessions
- Protected admin routes
- Input validation (Zod)
- SQL injection prevention (Prisma)
- Rate limiting on registration endpoint
- Secure HTTP headers

## Support

For issues or questions, refer to the SRS document at: `Instruction Documents/Sulfri Trainer Portal Srs V1.pdf`
