import { prisma } from "../src/lib/prisma"

async function checkRegistrations() {
  try {
    console.log("Checking registrations and other data...")
    
    const regCount = await prisma.registration.count()
    console.log(`\nRegistrations count: ${regCount}`)
    
    const badgesCount = await prisma.badge.count()
    console.log(`Badges count: ${badgesCount}`)
    
    const skillsCount = await prisma.skill.count()
    console.log(`Skills count: ${skillsCount}`)
    
    const eventCoursesCount = await prisma.eventCourse.count()
    console.log(`Event courses count: ${eventCoursesCount}`)
    
    const eventLeadsCount = await prisma.eventLead.count()
    console.log(`Event leads count: ${eventLeadsCount}`)
    
    const downloadsCount = await prisma.download.count()
    console.log(`Downloads count: ${downloadsCount}`)
    
    // Check if there's registrations orphaned
    if (regCount > 0) {
      const orphanedRegs = await prisma.$queryRaw`
        SELECT r.* FROM registrations r
        LEFT JOIN classes c ON r.class_id = c.id
        WHERE c.id IS NULL
      `
      console.log("\nOrphaned registrations (no associated class):")
      console.log(orphanedRegs)
    }
    
  } catch (error) {
    console.error("Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRegistrations()
