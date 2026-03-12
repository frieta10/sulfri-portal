import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/showcase-stats - Get showcase statistics (public)
// Auto-calculates from actual data instead of using static table
export async function GET() {
  try {
    // Get actual counts from database
    const [
      classesCount,
      registrationsCount,
      clientsCount
    ] = await Promise.all([
      // Count completed classes
      prisma.class.count({
        where: { status: "COMPLETED" }
      }),
      // Count total participants (registrations)
      prisma.registration.count(),
      // Count unique clients
      prisma.class.groupBy({
        by: ["clientName"],
        where: { status: "COMPLETED" }
      }).then(clients => clients.length)
    ])

    // Calculate hours delivered (assume average 8 hours per class)
    const hoursDelivered = classesCount * 8

    const stats = [
      {
        id: "1",
        statKey: "classes_completed",
        statValue: classesCount,
        label: "Classes Completed"
      },
      {
        id: "2",
        statKey: "hours_delivered",
        statValue: hoursDelivered,
        label: "Hours Delivered"
      },
      {
        id: "3",
        statKey: "participants_trained",
        statValue: registrationsCount,
        label: "Participants"
      },
      {
        id: "4",
        statKey: "unique_clients",
        statValue: clientsCount,
        label: "Clients"
      }
    ]

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching showcase stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch showcase stats" },
      { status: 500 }
    )
  }
}
