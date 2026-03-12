import { prisma } from "../src/lib/prisma"
import { generateUniqueJoinCode } from "../src/lib/utils/generate-code"

async function testCreateClass() {
  try {
    console.log("Testing class creation...")
    
    // Test creating a class with STRAIGHT dates
    const joinCode = await generateUniqueJoinCode(prisma)
    console.log("Generated join code:", joinCode)
    
    const newClass = await prisma.class.create({
      data: {
        title: "Test Class Straight",
        clientName: "Test Client",
        clientType: "CORPORATE",
        topicCategory: "Testing",
        mode: "ONLINE",
        location: "Zoom",
        dateType: "STRAIGHT",
        numberOfDays: 2,
        startDatetime: new Date("2026-05-01T09:00:00"),
        endDatetime: new Date("2026-05-02T17:00:00"),
        notes: "Test notes",
        status: "UPCOMING",
        joinEnabled: true,
        showOnPublicProfile: true,
        joinCode,
      },
    })
    
    console.log("✅ Class created successfully!")
    console.log("Class ID:", newClass.id)
    console.log("Title:", newClass.title)
    
  } catch (error) {
    console.error("❌ Error creating class:", error)
  } finally {
    await prisma.$disconnect()
  }
}

testCreateClass()
