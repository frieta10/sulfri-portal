import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateJoinCode } from "@/lib/utils/generate-code"
import Papa from "papaparse"

// CSV Template structure
const CSV_TEMPLATE = `title,clientName,clientType,clientLogoUrl,topicCategory,mode,location,startDate,endDate,notes,status
"Project Management Fundamentals","Ministry of Education Malaysia","GOVERNMENT","https://example.com/logo.png","Project Management","ONLINE","Kuala Lumpur","2024-01-15","2024-01-16","Training notes here","COMPLETED"
"Azure Administrator","Petronas","GLC","","Cloud Computing","HYBRID","","2024-02-01","2024-02-03","","UPCOMING"`

const VALID_CLIENT_TYPES = ["INDIVIDUAL", "CORPORATE", "GOVERNMENT", "ACADEMIC"]
const VALID_MODES = ["ONLINE", "IN_PERSON", "HYBRID"]
const VALID_STATUSES = ["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"]

// GET - Download CSV Template
export async function GET() {
  try {
    const headers = new Headers()
    headers.set("Content-Type", "text/csv")
    headers.set("Content-Disposition", "attachment; filename=class-import-template.csv")
    
    return new NextResponse(CSV_TEMPLATE, { headers })
  } catch (error) {
    console.error("Error generating template:", error)
    return NextResponse.json(
      { error: "Failed to generate template" },
      { status: 500 }
    )
  }
}

// POST - Bulk import classes from CSV
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

    // Parse CSV
    const text = await file.text()
    const { data, errors } = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    })

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "CSV parsing error", details: errors },
        { status: 400 }
      )
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      created: [] as any[],
    }

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any
      const rowNum = i + 2 // +2 because header is row 1

      try {
        // Validate required fields
        if (!row.title || !row.clientName || !row.clientType || !row.topicCategory || !row.mode) {
          results.failed++
          results.errors.push(`Row ${rowNum}: Missing required fields`)
          continue
        }

        // Validate enums
        if (!VALID_CLIENT_TYPES.includes(row.clientType.toUpperCase())) {
          results.failed++
          results.errors.push(`Row ${rowNum}: Invalid clientType. Must be one of: ${VALID_CLIENT_TYPES.join(", ")}`)
          continue
        }

        if (!VALID_MODES.includes(row.mode.toUpperCase())) {
          results.failed++
          results.errors.push(`Row ${rowNum}: Invalid mode. Must be one of: ${VALID_MODES.join(", ")}`)
          continue
        }

        const status = row.status?.toUpperCase() || "COMPLETED"
        if (!VALID_STATUSES.includes(status)) {
          results.failed++
          results.errors.push(`Row ${rowNum}: Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`)
          continue
        }

        // Parse dates - bypass validation for bulk import (allow past dates)
        let startDate: Date
        let endDate: Date

        try {
          startDate = row.startDate ? new Date(row.startDate) : new Date()
          endDate = row.endDate ? new Date(row.endDate) : new Date(startDate.getTime() + 24 * 60 * 60 * 1000)

          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error("Invalid date format")
          }
        } catch (dateError) {
          results.failed++
          results.errors.push(`Row ${rowNum}: Invalid date format. Use YYYY-MM-DD`)
          continue
        }

        // Generate join code
        const joinCode = await generateJoinCode()

        // Create class
        const newClass = await prisma.class.create({
          data: {
            title: row.title.trim(),
            clientName: row.clientName.trim(),
            clientType: row.clientType.toUpperCase(),
            clientLogoUrl: row.clientLogoUrl?.trim() || null,
            topicCategory: row.topicCategory.trim(),
            mode: row.mode.toUpperCase(),
            location: row.location?.trim() || null,
            startDatetime: startDate,
            endDatetime: endDate,
            notes: row.notes?.trim() || null,
            status: status,
            joinCode,
            joinEnabled: true,
            showOnPublicProfile: true,
          },
        })

        results.success++
        results.created.push(newClass)

      } catch (error: any) {
        results.failed++
        results.errors.push(`Row ${rowNum}: ${error.message || "Unknown error"}`)
      }
    }

    return NextResponse.json(results)

  } catch (error: any) {
    console.error("Bulk import error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process bulk import" },
      { status: 500 }
    )
  }
}
