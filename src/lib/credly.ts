/**
 * Credly Integration Utilities
 * 
 * Note: Credly has restricted access to their public API endpoints.
 * The `/api/v1/users/{id}/badges.json` endpoint now returns 401.
 * 
 * Alternative approaches:
 * 1. Manual badge entry via embed code (recommended)
 * 2. Use Credly's official API with authentication (requires API key)
 * 3. Public profile scraping (not recommended, fragile)
 */

/**
 * Extract badge data from Credly embed code
 * This is the most reliable method as it doesn't require API access
 */
export function extractCredlyEmbedData(embedCode: string): {
  badgeId: string
  width: number
  height: number
  host: string
} {
  // Extract data-share-badge-id
  const badgeIdMatch = embedCode.match(/data-share-badge-id="([^"]+)"/)
  const badgeId = badgeIdMatch?.[1] || ""

  // Extract width
  const widthMatch = embedCode.match(/data-iframe-width="([^"]+)"/)
  const width = parseInt(widthMatch?.[1] || "150", 10)

  // Extract height
  const heightMatch = embedCode.match(/data-iframe-height="([^"]+)"/)
  const height = parseInt(heightMatch?.[1] || "270", 10)

  // Extract host
  const hostMatch = embedCode.match(/data-share-badge-host="([^"]+)"/)
  const host = hostMatch?.[1] || "https://www.credly.com"

  if (!badgeId) {
    throw new Error("Could not extract badge ID from embed code")
  }

  // Security: Validate host is from allowed domains
  const allowedHosts = ["https://www.credly.com", "https://cdn.credly.com"]
  if (!allowedHosts.some(allowed => host.includes(allowed))) {
    throw new Error("Invalid host domain. Only Credly domains are allowed.")
  }

  return { badgeId, width, height, host }
}

/**
 * Generate verification URL from badge ID
 */
export function generateVerificationUrl(badgeId: string): string {
  return `https://www.credly.com/badges/${badgeId}/public_url`
}

/**
 * Generate public badge image URL
 * Note: This is a best-effort URL pattern and may not work for all badges
 */
export function generateBadgeImageUrl(badgeId: string): string {
  return `https://images.credly.com/size/340x340/images/${badgeId}.png`
}

/**
 * Credly API Error types
 */
export enum CredlyError {
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
  RATE_LIMITED = 429,
  SERVER_ERROR = 500,
}

/**
 * Check if a Credly User ID format is valid
 */
export function validateCredlyUserId(userId: string): boolean {
  // Credly user IDs typically contain letters, numbers, hyphens
  return /^[a-zA-Z0-9-]+$/.test(userId) && userId.length >= 3 && userId.length <= 50
}

/**
 * Error message helper
 */
export function getCredlyErrorMessage(status: number): string {
  switch (status) {
    case 401:
      return "Credly API requires authentication. Please use manual embed code method instead."
    case 404:
      return "User not found. Please check the Credly User ID."
    case 429:
      return "Rate limited by Credly. Please try again later."
    case 500:
    case 502:
    case 503:
      return "Credly service is temporarily unavailable. Please try again later."
    default:
      return `Credly API error (${status}). Please try again later.`
  }
}

/**
 * Alternative: Fetch badge data from Credly public profile page
 * This is a fallback method that scrapes the public profile
 * Note: This is fragile and may break if Credly changes their HTML structure
 */
export async function fetchBadgesFromPublicProfile(
  username: string
): Promise<{ success: false; error: string } | { success: true; badges: any[] }> {
  try {
    // Try to fetch the public profile page
    const response = await fetch(`https://www.credly.com/users/${username}`, {
      headers: {
        "Accept": "text/html",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: "User not found" }
      }
      return { success: false, error: getCredlyErrorMessage(response.status) }
    }

    const html = await response.text()

    // Try to extract badge data from the HTML
    // This looks for JSON data embedded in the page
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
    if (jsonLdMatch) {
      try {
        const data = JSON.parse(jsonLdMatch[1])
        // Process JSON-LD data if available
        if (data["@type"] === "Person" && data.hasCredential) {
          const badges = Array.isArray(data.hasCredential) 
            ? data.hasCredential 
            : [data.hasCredential]
          
          return {
            success: true,
            badges: badges.map((cred: any) => ({
              id: cred.identifier || cred.url?.split('/').pop(),
              name: cred.name,
              description: cred.description,
              imageUrl: cred.image,
              issuedAt: cred.datePublished,
            }))
          }
        }
      } catch {
        // JSON-LD parsing failed, continue to next method
      }
    }

    // Alternative: Extract from __NEXT_DATA__ or similar
    const nextDataMatch = html.match(/window\.__NEXT_DATA__\s*=\s*({[\s\S]+?});/) ||
                          html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]+?});/)
    
    if (nextDataMatch) {
      try {
        const data = JSON.parse(nextDataMatch[1])
        // Extract badges from Next.js data structure
        // This is highly dependent on Credly's implementation
        const badges = data?.props?.pageProps?.badges || 
                      data?.badges || 
                      []
        
        if (badges.length > 0) {
          return {
            success: true,
            badges: badges.map((badge: any) => ({
              id: badge.id,
              name: badge.badge_template?.name || badge.name,
              description: badge.badge_template?.description || badge.description,
              imageUrl: badge.image_url || badge.image,
              issuedAt: badge.issued_at_date || badge.issuedAt,
            }))
          }
        }
      } catch {
        // Next.js data parsing failed
      }
    }

    return { 
      success: false, 
      error: "Could not extract badge data from public profile. Please use manual embed code method." 
    }

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }
  }
}
