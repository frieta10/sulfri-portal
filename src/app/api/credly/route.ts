import { NextRequest, NextResponse } from "next/server"

// Credly API response types
interface CredlyBadgeTemplate {
  id: string
  name: string
  description: string
  image_url: string
  skills: { name: string }[]
  issuer: {
    entities: { entity: { name: string } }[]
  }
}

interface CredlyBadge {
  id: string
  image_url: string
  issued_at_date: string
  badge_template: CredlyBadgeTemplate
  issuer: {
    entities: { entity: { name: string } }[]
  }
}

interface CredlyResponse {
  data: CredlyBadge[]
  metadata: {
    total_count: number
    current_page: number
    total_pages: number
  }
}

/**
 * GET /api/credly?username=<credly-username>
 * 
 * Fetches public badge data from Credly for a given username.
 * This endpoint acts as a proxy to bypass CORS restrictions.
 * 
 * To find your Credly username:
 * 1. Go to https://www.credly.com/users/<your-username>/badges
 * 2. Your username is in the URL after /users/
 * 
 * Example: /api/credly?username=mohd-sulfri
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get("username")

    if (!username) {
      return NextResponse.json(
        { error: "Username parameter is required. Example: /api/credly?username=mohd-sulfri" },
        { status: 400 }
      )
    }

    // Credly public API endpoint
    const credlyUrl = `https://www.credly.com/users/${username}/badges.json`

    const response = await fetch(credlyUrl, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "User not found. Please check your Credly username." },
          { status: 404 }
        )
      }
      throw new Error(`Credly API responded with status: ${response.status}`)
    }

    const data: CredlyResponse = await response.json()

    // Transform the data to a cleaner format
    const badges = data.data.map((badge) => ({
      id: badge.id,
      name: badge.badge_template.name,
      description: badge.badge_template.description,
      imageUrl: badge.image_url,
      badgeUrl: `https://www.credly.com/badges/${badge.id}/public_url`,
      issuedAt: badge.issued_at_date,
      skills: badge.badge_template.skills?.map((skill) => skill.name) || [],
      issuer: badge.issuer?.entities?.map((e) => e.entity.name).join(", ") || "Unknown",
    }))

    return NextResponse.json({
      badges,
      total: data.metadata?.total_count || badges.length,
      username,
    })

  } catch (error) {
    console.error("Error fetching Credly badges:", error)
    return NextResponse.json(
      { error: "Failed to fetch badges from Credly. Please try again later." },
      { status: 500 }
    )
  }
}
