import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

/**
 * GET /api/admin/event/courses/template
 * Download CSV template for bulk course upload
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // CSV template headers and sample data
    const csvHeaders = [
      "title",
      "shortDescription",
      "fullDescription",
      "deliveryMode",
      "startDate",
      "endDate",
      "location",
      "status",
      "visibility",
      "displayOrder",
    ].join(",")

    // Sample rows
    const sampleRows = [
      // Header comment row
      "# Instructions: Fill in the data below. deliveryMode can be: ONLINE, PHYSICAL, HYBRID. status can be: DRAFT, PUBLISHED, COMPLETED, RETIRED. visibility can be: PUBLIC, HIDDEN. Dates should be in YYYY-MM-DD format.",
      // Column headers
      csvHeaders,
      // Sample data rows
      [
        "Data Analytics Fundamentals",
        "Learn basic data analysis techniques",
        "This comprehensive course covers data analytics fundamentals including data visualization, statistical analysis, and reporting.",
        "ONLINE",
        "2024-04-01",
        "2024-04-05",
        "",
        "PUBLISHED",
        "PUBLIC",
        "1",
      ].join(","),
      [
        "Cybersecurity Essentials",
        "Introduction to cybersecurity practices",
        "Learn essential cybersecurity practices including threat detection, prevention strategies, and security best practices.",
        "HYBRID",
        "2024-05-15",
        "2024-05-17",
        "Kuala Lumpur Convention Centre",
        "DRAFT",
        "PUBLIC",
        "2",
      ].join(","),
      [
        "AI for Business Productivity",
        "Leverage AI tools for business efficiency",
        "Discover how to use AI tools to enhance productivity and streamline business operations.",
        "ONLINE",
        "",
        "",
        "",
        "DRAFT",
        "HIDDEN",
        "3",
      ].join(","),
    ].join("\n")

    // Return as downloadable file
    const headers = new Headers()
    headers.set("Content-Type", "text/csv")
    headers.set("Content-Disposition", "attachment; filename=courses-template.csv")

    return new NextResponse(sampleRows, { headers })
  } catch (error: any) {
    console.error("Error generating template:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate template" },
      { status: 500 }
    )
  }
}
