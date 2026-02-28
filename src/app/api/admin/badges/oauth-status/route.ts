import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/admin/badges/oauth-status
 * 
 * Check if user has connected their Credly account via OAuth
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check for OAuth token
    const tokenRecord = await prisma.$queryRaw<Array<{
      credly_username: string
      expires_at: Date
    }>>`
      SELECT credly_username, expires_at
      FROM credly_oauth_tokens
      WHERE user_id = ${session.user.id}
    `

    if (!tokenRecord || tokenRecord.length === 0) {
      return NextResponse.json({
        connected: false,
        username: null,
      })
    }

    const token = tokenRecord[0]
    const isExpired = new Date() > new Date(token.expires_at)

    return NextResponse.json({
      connected: !isExpired,
      username: token.credly_username,
      expired: isExpired,
    })

  } catch (error) {
    console.error("Error checking OAuth status:", error)
    return NextResponse.json(
      { error: "Failed to check OAuth status" },
      { status: 500 }
    )
  }
}
