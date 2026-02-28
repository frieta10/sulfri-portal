import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

// Store in globalThis to prevent multiple instances in serverless environments
if (!globalForPrisma.prisma) globalForPrisma.prisma = prisma
