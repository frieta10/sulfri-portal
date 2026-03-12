import { prisma } from "../src/lib/prisma"

async function checkAllTables() {
  try {
    console.log("Checking all tables...")
    
    // List all tables using raw query
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    console.log("\nTables in database:")
    console.log(tables)
    
    // Check classes table structure
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'classes' AND table_schema = 'public'
      ORDER BY ordinal_position
    `
    console.log("\nClasses table columns:")
    console.log(columns)
    
    // Check if there's any data
    const classData = await prisma.$queryRaw`SELECT COUNT(*) as count FROM classes`
    console.log("\nClasses count:")
    console.log(classData)
    
  } catch (error) {
    console.error("Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAllTables()
