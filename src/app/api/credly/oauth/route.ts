import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateAuthUrl, generateState, isOAuthConfigured } from "@/lib/credly-oauth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/credly/oauth
 * 
 * Initiates OAuth flow with Credly.
 * Redirects user to Credly's authorization page.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if OAuth is configured
    if (!isOAuthConfigured()) {
      return NextResponse.json(
        { 
          error: "Credly OAuth not configured",
          message: "Please set CREDLY_CLIENT_ID and CREDLY_CLIENT_SECRET environment variables",
          setup_guide: "https://support.credly.com/hc/en-us/articles/4408533823003-Integrating-with-Credly"
        },
        { status: 503 }
      )
    }

    // Generate state for CSRF protection
    const state = generateState()
    
    // Store state in database temporarily (valid for 10 minutes)
    await prisma.$executeRaw`
      INSERT INTO oauth_states (state, user_id, created_at, expires_at)
      VALUES (${state}, ${session.user.id}, NOW(), NOW() + INTERVAL '10 minutes')
    `

    // Generate and return authorization URL
    const authUrl = generateAuthUrl(state)

    return NextResponse.json({
      authUrl,
      state,
    })

  } catch (error) {
    console.error("Error initiating OAuth:", error)
    return NextResponse.json(
      { error: "Failed to initiate OAuth flow" },
      { status: 500 }
    )
  }
}
