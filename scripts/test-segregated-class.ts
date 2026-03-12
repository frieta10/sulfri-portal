import { prisma } from "../src/lib/prisma"

async function testSegregatedClass() {
  try {
    console.log("Testing segregated class query...")
    
    const classItem = await prisma.class.findFirst({
      where: { dateType: "SEGREGATED" },
      include: {
        _count: {
          select: { registrations: true },
        },
        sessions: {
          orderBy: { displayOrder: "asc" },
        },
      },
    })
    
    if (classItem) {
      console.log("\nSegregated class found:")
      console.log(JSON.stringify(classItem, null, 2))
    } else {
      console.log("No segregated class found")
    }
    
  } catch (error) {
    console.error("Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

testSegregatedClass()
