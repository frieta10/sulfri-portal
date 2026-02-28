import { NextRequest, NextResponse } from "next/server"
import { exchangeCodeForToken, fetchCurrentUser, fetchUserBadges } from "@/lib/credly-oauth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/credly/oauth/callback
 * 
 * Handles OAuth callback from Credly.
 * Exchanges code for token and stores credentials.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    // Handle OAuth error
    if (error) {
      console.error("OAuth error:", error)
      return NextResponse.redirect(
        new URL(`/admin/badges?oauth_error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/admin/badges?oauth_error=missing_params", request.url)
      )
    }

    // Verify state parameter
    const stateRecord = await prisma.$queryRaw<Array<{ user_id: string }>>`
      SELECT user_id FROM oauth_states 
      WHERE state = ${state} AND expires_at > NOW()
    `

    if (!stateRecord || stateRecord.length === 0) {
      return NextResponse.redirect(
        new URL("/admin/badges?oauth_error=invalid_state", request.url)
      )
    }

    const userId = stateRecord[0].user_id

    // Clean up used state
    await prisma.$executeRaw`
      DELETE FROM oauth_states WHERE state = ${state}
    `

    // Exchange code for token
    const tokenResult = await exchangeCodeForToken(code)

    if (!tokenResult.success) {
      console.error("Token exchange failed:", tokenResult.error)
      return NextResponse.redirect(
        new URL(`/admin/badges?oauth_error=${encodeURIComponent(tokenResult.error)}`, request.url)
      )
    }

    // Fetch user info
    const userResult = await fetchCurrentUser(tokenResult.access_token)

    if (!userResult.success) {
      console.error("Failed to fetch user:", userResult.error)
      return NextResponse.redirect(
        new URL("/admin/badges?oauth_error=user_fetch_failed", request.url)
      )
    }

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + tokenResult.expires_in * 1000)

    // Store OAuth credentials
    await prisma.$executeRaw`
      INSERT INTO credly_oauth_tokens (
        user_id, 
        credly_user_id, 
        access_token, 
        refresh_token, 
        expires_at,
        credly_username,
        credly_profile_url
      ) VALUES (
        ${userId},
        ${userResult.user.id},
        ${tokenResult.access_token},
        ${tokenResult.refresh_token},
        ${expiresAt},
        ${userResult.user.username},
        ${userResult.user.profile_url}
      )
      ON CONFLICT (user_id) 
      DO UPDATE SET
        credly_user_id = EXCLUDED.credly_user_id,
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at,
        credly_username = EXCLUDED.credly_username,
        credly_profile_url = EXCLUDED.credly_profile_url,
        updated_at = NOW()
    `

    // Redirect back to admin with success
    return NextResponse.redirect(
      new URL(`/admin/badges?oauth_success=1&username=${encodeURIComponent(userResult.user.username)}`, request.url)
    )

  } catch (error) {
    console.error("OAuth callback error:", error)
    return NextResponse.redirect(
      new URL("/admin/badges?oauth_error=server_error", request.url)
    )
  }
}
