import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateCSV } from "@/lib/utils/csv-export"

// GET /api/classes/[id]/export - Export registrations as CSV
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch class info
    const classItem = await prisma.class.findUnique({
      where: { id: params.id },
      select: { id: true, title: true, joinCode: true },
    })

    if (!classItem) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Fetch all registrations for this class
    const registrations = await prisma.registration.findMany({
      where: { classId: params.id },
      orderBy: { registeredAt: "asc" },
    })

    // Define CSV columns
    const columns = [
      { key: "no", header: "No." },
      { key: "fullName", header: "Full Name" },
      { key: "email", header: "Email" },
      { key: "phone", header: "Phone" },
      { key: "organization", header: "Organization" },
      { key: "registeredAt", header: "Registration Date" },
    ]

    // Transform data for CSV
    const csvData = registrations.map((reg, index) => ({
      no: String(index + 1),
      fullName: reg.fullName,
      email: reg.email,
      phone: reg.phone || "",
      organization: reg.organization || "",
      registeredAt: new Date(reg.registeredAt).toLocaleString(),
    }))

    const csv = generateCSV(csvData, columns)

    // Generate filename
    const safeTitle = classItem.title.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30)
    const filename = `registrations_${safeTitle}_${classItem.joinCode}.csv`

    // Return CSV as downloadable file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error exporting registrations:", error)
    return NextResponse.json(
      { error: "Failed to export registrations" },
      { status: 500 }
    )
  }
}
