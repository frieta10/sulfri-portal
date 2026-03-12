import { prisma } from "../src/lib/prisma"
import { generateUniqueJoinCode } from "../src/lib/utils/generate-code"

async function seedSampleClasses() {
  try {
    console.log("Seeding sample classes...")
    
    // Sample class 1: Straight dates (3 consecutive days)
    const class1 = await prisma.class.create({
      data: {
        title: "Advanced Leadership Training",
        clientName: "ABC Corporation",
        clientType: "CORPORATE",
        topicCategory: "Leadership",
        mode: "IN_PERSON",
        location: "Kuala Lumpur Convention Centre",
        dateType: "STRAIGHT",
        numberOfDays: 3,
        startDatetime: new Date("2026-04-15T09:00:00"),
        endDatetime: new Date("2026-04-17T17:00:00"),
        notes: "3-day intensive leadership program for senior managers",
        status: "UPCOMING",
        joinEnabled: true,
        showOnPublicProfile: true,
        joinCode: await generateUniqueJoinCode(prisma),
      },
    })
    console.log(`Created class 1: ${class1.title} (ID: ${class1.id})`)
    
    // Sample class 2: Segregated dates (weekends only)
    const class2JoinCode = await generateUniqueJoinCode(prisma)
    const class2 = await prisma.class.create({
      data: {
        title: "Project Management Professional (PMP) Preparation",
        clientName: "Tech Solutions Sdn Bhd",
        clientType: "CORPORATE",
        topicCategory: "Project Management",
        mode: "HYBRID",
        location: "Online + Penang Office",
        dateType: "SEGREGATED",
        numberOfDays: 4,
        startDatetime: new Date("2026-05-10T09:00:00"), // First session
        endDatetime: new Date("2026-05-31T17:00:00"),   // Last session
        notes: "4 weekend sessions for working professionals",
        status: "UPCOMING",
        joinEnabled: true,
        showOnPublicProfile: true,
        joinCode: class2JoinCode,
        sessions: {
          create: [
            {
              sessionDate: new Date("2026-05-10"),
              startTime: "09:00",
              endTime: "17:00",
              displayOrder: 0,
            },
            {
              sessionDate: new Date("2026-05-11"),
              startTime: "09:00",
              endTime: "17:00",
              displayOrder: 1,
            },
            {
              sessionDate: new Date("2026-05-17"),
              startTime: "09:00",
              endTime: "17:00",
              displayOrder: 2,
            },
            {
              sessionDate: new Date("2026-05-18"),
              startTime: "09:00",
              endTime: "17:00",
              displayOrder: 3,
            },
          ],
        },
      },
      include: {
        sessions: true,
      },
    })
    console.log(`Created class 2: ${class2.title} (ID: ${class2.id})`)
    console.log(`  - ${class2.sessions.length} sessions created`)
    
    // Sample class 3: Straight dates - single day
    const class3 = await prisma.class.create({
      data: {
        title: "Data Analytics Fundamentals",
        clientName: "Government Agency",
        clientType: "GOVERNMENT",
        topicCategory: "Data Analytics",
        mode: "ONLINE",
        location: "Microsoft Teams",
        dateType: "STRAIGHT",
        numberOfDays: 1,
        startDatetime: new Date("2026-04-20T09:00:00"),
        endDatetime: new Date("2026-04-20T17:00:00"),
        notes: "One-day workshop on data analytics basics",
        status: "UPCOMING",
        joinEnabled: true,
        showOnPublicProfile: true,
        joinCode: await generateUniqueJoinCode(prisma),
      },
    })
    console.log(`Created class 3: ${class3.title} (ID: ${class3.id})`)
    
    // Sample class 4: Segregated dates (spread over a month)
    const class4JoinCode = await generateUniqueJoinCode(prisma)
    const class4 = await prisma.class.create({
      data: {
        title: "Executive Coaching Certification",
        clientName: "HR Development Institute",
        clientType: "ACADEMIC",
        topicCategory: "Coaching",
        mode: "IN_PERSON",
        location: "Singapore Management University",
        dateType: "SEGREGATED",
        numberOfDays: 3,
        startDatetime: new Date("2026-06-05T09:00:00"),
        endDatetime: new Date("2026-06-26T17:00:00"),
        notes: "3-day modular program spread over 3 weeks",
        status: "UPCOMING",
        joinEnabled: true,
        showOnPublicProfile: true,
        joinCode: class4JoinCode,
        sessions: {
          create: [
            {
              sessionDate: new Date("2026-06-05"),
              startTime: "09:00",
              endTime: "17:00",
              displayOrder: 0,
            },
            {
              sessionDate: new Date("2026-06-12"),
              startTime: "09:00",
              endTime: "17:00",
              displayOrder: 1,
            },
            {
              sessionDate: new Date("2026-06-26"),
              startTime: "09:00",
              endTime: "17:00",
              displayOrder: 2,
            },
          ],
        },
      },
      include: {
        sessions: true,
      },
    })
    console.log(`Created class 4: ${class4.title} (ID: ${class4.id})`)
    console.log(`  - ${class4.sessions.length} sessions created`)
    
    console.log("\n✅ Sample classes seeded successfully!")
    console.log("\nYou can now:")
    console.log("1. Go to /classes to see the list")
    console.log("2. Click on any class to view details")
    console.log("3. Edit a class to test the new date scheduling features")
    console.log("4. Create a new class with Straight or Segregated dates")
    
  } catch (error) {
    console.error("Error seeding classes:", error)
  } finally {
    await prisma.$disconnect()
  }
}

seedSampleClasses()
