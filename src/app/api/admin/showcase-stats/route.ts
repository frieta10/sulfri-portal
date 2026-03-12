import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { showcaseStatUpdateSchema, validStatKeys } from "@/lib/validations/showcase-stat"

// GET /api/admin/showcase-stats - Get showcase statistics (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stats = await prisma.showcaseStat.findMany({
      orderBy: {
        statKey: "asc",
      },
    })

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching showcase stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch showcase stats" },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/showcase-stats - Update showcase stats (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    // Handle bulk update
    if (body.stats && Array.isArray(body.stats)) {
      const updates = []

      for (const stat of body.stats) {
        const validationResult = showcaseStatUpdateSchema.safeParse(stat)
        if (!validationResult.success) {
          return NextResponse.json(
            { 
              error: "Validation failed", 
              details: { statKey: stat.statKey, errors: validationResult.error.flatten() } 
            },
            { status: 400 }
          )
        }

        const { statKey, statValue, label } = validationResult.data

        updates.push(
          prisma.showcaseStat.upsert({
            where: { statKey },
            update: { statValue, label },
            create: { statKey, statValue, label },
          })
        )
      }

      const updatedStats = await prisma.$transaction(updates)
      return NextResponse.json(updatedStats)
    }

    // Handle single stat update
    const validationResult = showcaseStatUpdateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { statKey, statValue, label } = validationResult.data

    const stat = await prisma.showcaseStat.upsert({
      where: { statKey },
      update: { statValue, label },
      create: { statKey, statValue, label },
    })

    return NextResponse.json(stat)
  } catch (error: any) {
    console.error("Error updating showcase stats:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update showcase stats" },
      { status: 500 }
    )
  }
}
