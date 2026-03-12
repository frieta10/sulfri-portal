// Test the API endpoint directly
import { createClassSchema } from "../src/lib/validations/class"

const testData = {
  title: "Test API Class",
  clientName: "Test Client",
  clientType: "CORPORATE",
  topicCategory: "Testing",
  mode: "ONLINE",
  location: "Zoom",
  dateType: "STRAIGHT",
  numberOfDays: 1,
  startDatetime: "2026-05-01T09:00",
  endDatetime: "2026-05-01T17:00",
  notes: "Test notes",
  status: "UPCOMING",
  joinEnabled: true,
  showOnPublicProfile: true,
}

console.log("Testing API POST simulation...")
console.log("Request body:", JSON.stringify(testData, null, 2))

try {
  // Simulate the API validation
  const validatedData = createClassSchema.parse(testData)
  console.log("\n✅ Validation passed!")
  console.log("Validated data:", JSON.stringify(validatedData, null, 2))
  
  // Check what would be sent to database
  const classData: any = {
    title: validatedData.title,
    clientName: validatedData.clientName,
    clientType: validatedData.clientType,
    topicCategory: validatedData.topicCategory,
    mode: validatedData.mode,
    location: validatedData.location,
    dateType: validatedData.dateType,
    numberOfDays: validatedData.numberOfDays,
    notes: validatedData.notes,
    status: validatedData.status,
    joinEnabled: validatedData.joinEnabled,
    showOnPublicProfile: validatedData.showOnPublicProfile,
  }
  
  if (validatedData.dateType === "STRAIGHT") {
    classData.startDatetime = new Date(validatedData.startDatetime)
    classData.endDatetime = new Date(validatedData.endDatetime)
  }
  
  console.log("\n📦 Data that would be sent to Prisma:")
  console.log(JSON.stringify(classData, null, 2))
  
} catch (error: any) {
  console.error("\n❌ Validation failed!")
  console.error("Error:", error.message)
  if (error.errors) {
    console.error("Details:", JSON.stringify(error.errors, null, 2))
  }
}
