import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Valid enum values
const VALID_DELIVERY_MODES = ["ONLINE", "PHYSICAL", "HYBRID"]
const VALID_STATUSES = ["DRAFT", "PUBLISHED", "COMPLETED", "RETIRED"]
const VALID_VISIBILITIES = ["PUBLIC", "HIDDEN"]

interface ParsedCourse {
  title: string
  shortDescription?: string
  fullDescription?: string
  deliveryMode: string
  startDate?: string
  endDate?: string
  location?: string
  status: string
  visibility: string
  displayOrder: number
}

interface ParseResult {
  courses: ParsedCourse[]
  errors: string[]
}

/**
 * Parse CSV content into course objects
 */
function parseCSV(csvContent: string): ParseResult {
  const lines = csvContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))

  if (lines.length < 2) {
    return { courses: [], errors: ["CSV must have a header row and at least one data row"] }
  }

  const headers = parseCSVLine(lines[0])
  const courses: ParsedCourse[] = []
  const errors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const lineNum = i + 1

    if (values.length !== headers.length) {
      errors.push(`Line ${lineNum}: Column count mismatch`)
      continue
    }

    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header.trim().toLowerCase()] = values[index]?.trim() || ""
    })

    // Validate required fields
    if (!row.title) {
      errors.push(`Line ${lineNum}: Title is required`)
      continue
    }

    // Validate deliveryMode
    const deliveryMode = row.deliverymode?.toUpperCase() || "ONLINE"
    if (!VALID_DELIVERY_MODES.includes(deliveryMode)) {
      errors.push(`Line ${lineNum}: Invalid deliveryMode "${deliveryMode}". Must be one of: ${VALID_DELIVERY_MODES.join(", ")}`)
      continue
    }

    // Validate status
    const status = row.status?.toUpperCase() || "DRAFT"
    if (!VALID_STATUSES.includes(status)) {
      errors.push(`Line ${lineNum}: Invalid status "${status}". Must be one of: ${VALID_STATUSES.join(", ")}`)
      continue
    }

    // Validate visibility
    const visibility = row.visibility?.toUpperCase() || "PUBLIC"
    if (!VALID_VISIBILITIES.includes(visibility)) {
      errors.push(`Line ${lineNum}: Invalid visibility "${visibility}". Must be one of: ${VALID_VISIBILITIES.join(", ")}`)
      continue
    }

    // Parse dates
    let startDate: Date | undefined
    let endDate: Date | undefined

    if (row.startdate) {
      startDate = new Date(row.startdate)
      if (isNaN(startDate.getTime())) {
        errors.push(`Line ${lineNum}: Invalid startDate format. Use YYYY-MM-DD`)
        continue
      }
    }

    if (row.enddate) {
      endDate = new Date(row.enddate)
      if (isNaN(endDate.getTime())) {
        errors.push(`Line ${lineNum}: Invalid endDate format. Use YYYY-MM-DD`)
        continue
      }
    }

    // Validate date range
    if (startDate && endDate && endDate < startDate) {
      errors.push(`Line ${lineNum}: endDate must be after startDate`)
      continue
    }

    // Parse displayOrder
    const displayOrder = parseInt(row.displayorder || "0", 10)
    if (isNaN(displayOrder)) {
      errors.push(`Line ${lineNum}: Invalid displayOrder`)
      continue
    }

    courses.push({
      title: row.title,
      shortDescription: row.shortdescription || undefined,
      fullDescription: row.fulldescription || undefined,
      deliveryMode,
      startDate: row.startdate || undefined,
      endDate: row.enddate || undefined,
      location: row.location || undefined,
      status,
      visibility,
      displayOrder,
    })
  }

  return { courses, errors }
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current)
      current = ""
    } else {
      current += char
    }
  }
  values.push(current)

  return values
}

/**
 * POST /api/admin/event/courses/bulk
 * Bulk upload courses from CSV
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "File must be a CSV" }, { status: 400 })
    }

    // Read file content
    const csvContent = await file.text()

    // Parse CSV
    const { courses, errors } = parseCSV(csvContent)

    if (errors.length > 0 && courses.length === 0) {
      return NextResponse.json(
        { error: "Failed to parse CSV", details: errors },
        { status: 400 }
      )
    }

    // Create courses in database
    const results = {
      created: 0,
      failed: 0,
      errors: [] as string[],
      courses: [] as any[],
    }

    for (const courseData of courses) {
      try {
        const course = await prisma.eventCourse.create({
          data: {
            title: courseData.title,
            shortDescription: courseData.shortDescription,
            fullDescription: courseData.fullDescription,
            deliveryMode: courseData.deliveryMode as any,
            startDate: courseData.startDate ? new Date(courseData.startDate) : null,
            endDate: courseData.endDate ? new Date(courseData.endDate) : null,
            location: courseData.location,
            status: courseData.status as any,
            visibility: courseData.visibility as any,
            displayOrder: courseData.displayOrder,
          },
        })
        results.created++
        results.courses.push({ id: course.id, title: course.title })
      } catch (error: any) {
        results.failed++
        results.errors.push(`Failed to create "${courseData.title}": ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: courses.length,
        created: results.created,
        failed: results.failed,
        parseErrors: errors,
      },
      courses: results.courses,
      errors: results.errors,
    })
  } catch (error: any) {
    console.error("Error in bulk upload:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process upload" },
      { status: 500 }
    )
  }
}
