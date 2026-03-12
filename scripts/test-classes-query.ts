import { prisma } from "../src/lib/prisma"

async function testClassesQuery() {
  try {
    console.log("Testing classes query...")
    
    const classes = await prisma.class.findMany({
      take: 5,
      include: {
        _count: {
          select: { registrations: true },
        },
        sessions: {
          orderBy: { displayOrder: "asc" },
        },
      },
    })
    
    console.log(`Found ${classes.length} classes`)
    
    if (classes.length > 0) {
      console.log("\nFirst class:")
      console.log(JSON.stringify(classes[0], null, 2))
    } else {
      console.log("No classes found in database")
      
      // Check if table exists and has data
      const count = await prisma.class.count()
      console.log(`Total count: ${count}`)
    }
    
  } catch (error) {
    console.error("Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

testClassesQuery()
