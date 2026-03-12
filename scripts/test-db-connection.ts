import { prisma } from "../src/lib/prisma"

async function testDbConnection() {
  try {
    console.log("Testing database connection...")
    console.log("Database URL:", process.env.DATABASE_URL?.replace(/:.*@/, ":****@"))
    
    // Check classes
    const classCount = await prisma.class.count()
    console.log(`\nClasses count: ${classCount}`)
    
    // Check admin users
    const adminCount = await prisma.adminUser.count()
    console.log(`Admin users count: ${adminCount}`)
    
    // Check if we can query all classes without relations
    const allClasses = await prisma.$queryRaw`SELECT id, title, date_type, number_of_days FROM classes LIMIT 5`
    console.log("\nRaw query result:")
    console.log(allClasses)
    
  } catch (error) {
    console.error("Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

testDbConnection()
