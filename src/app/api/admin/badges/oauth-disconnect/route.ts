import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/admin/badges/oauth-disconnect
 * 
 * Disconnect user's Credly OAuth connection
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete OAuth token
    await prisma.$executeRaw`
      DELETE FROM credly_oauth_tokens
      WHERE user_id = ${session.user.id}
    `

    return NextResponse.json({
      success: true,
      message: "Disconnected from Credly",
    })

  } catch (error) {
    console.error("Error disconnecting OAuth:", error)
    return NextResponse.json(
      { error: "Failed to disconnect" },
      { status: 500 }
    )
  }
}
