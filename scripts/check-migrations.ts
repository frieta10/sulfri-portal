import { prisma } from "../src/lib/prisma"

async function checkMigrations() {
  try {
    console.log("Checking migration history...")
    
    const migrations = await prisma.$queryRaw`
      SELECT * FROM _prisma_migrations ORDER BY finished_at DESC
    `
    console.log("\nMigration history:")
    console.log(JSON.stringify(migrations, null, 2))
    
  } catch (error) {
    console.error("Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

checkMigrations()
