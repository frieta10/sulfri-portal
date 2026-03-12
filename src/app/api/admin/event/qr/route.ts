import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import QRCode from "qrcode"
import { z } from "zod"

// Validation schema for creating QR code
const createQRCodeSchema = z.object({
  name: z.string().min(1, "Event name is required").max(100),
  utmSource: z.string().max(100).optional(),
  eventStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional().nullable(),
  eventEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional().nullable(),
})

// GET /api/admin/event/qr - List all QR codes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const qrCodes = await prisma.eventQRCode.findMany({
      orderBy: { createdAt: "desc" },
    })

    // Update status for expired events
    const now = new Date()
    const updatedQRCodes = qrCodes.map((qr) => {
      if (qr.status === "ACTIVE" && qr.eventEndDate && new Date(qr.eventEndDate) < now) {
        return { ...qr, status: "EXPIRED" }
      }
      return qr
    })

    return NextResponse.json({ qrCodes: updatedQRCodes })
  } catch (error: any) {
    console.error("Error fetching QR codes:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch QR codes" },
      { status: 500 }
    )
  }
}

// POST /api/admin/event/qr - Generate and save QR code for event registration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validation = createQRCodeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { name, utmSource, eventStartDate, eventEndDate } = validation.data

    // Build the base URL for event registration
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    
    // Construct the event registration URL with optional UTM source
    let qrUrl = `${baseUrl}/event-register`
    
    if (utmSource && typeof utmSource === "string" && utmSource.trim()) {
      const encodedUtm = encodeURIComponent(utmSource.trim())
      qrUrl = `${baseUrl}/event-register?utm_source=${encodedUtm}`
    }

    // Generate QR code as data URL (PNG)
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })

    // Generate QR code as SVG string
    const qrSvg = await QRCode.toString(qrUrl, {
      type: "svg",
      width: 400,
      margin: 2,
    })

    // Determine initial status based on dates
    let status: "ACTIVE" | "EXPIRED" | "CLOSED" = "ACTIVE"
    const now = new Date()
    
    if (eventEndDate) {
      const endDate = new Date(eventEndDate)
      if (endDate < now) {
        status = "EXPIRED"
      }
    }

    // Save to database
    const qrCode = await prisma.eventQRCode.create({
      data: {
        name,
        utmSource: utmSource || null,
        eventStartDate: eventStartDate ? new Date(eventStartDate) : null,
        eventEndDate: eventEndDate ? new Date(eventEndDate) : null,
        status,
        qrUrl,
        qrDataUrl,
        qrSvg,
      },
    })

    return NextResponse.json({
      qrCode,
      message: "QR code created successfully",
    })
    
  } catch (error: any) {
    console.error("Error generating QR code:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate QR code" },
      { status: 500 }
    )
  }
}
