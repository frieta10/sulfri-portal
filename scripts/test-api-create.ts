// Test the API directly with sample data
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

console.log("Test data being sent:")
console.log(JSON.stringify(testData, null, 2))

// Validate the data against the schema
import { createClassSchema } from "../src/lib/validations/class"

try {
  const result = createClassSchema.parse(testData)
  console.log("\n✅ Validation passed!")
  console.log("Validated data:", JSON.stringify(result, null, 2))
} catch (error: any) {
  console.error("\n❌ Validation failed!")
  console.error("Error name:", error.name)
  console.error("Error message:", error.message)
  if (error.errors) {
    console.error("Validation errors:", JSON.stringify(error.errors, null, 2))
  }
}
