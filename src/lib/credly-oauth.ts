/**
 * Credly OAuth 2.0 Integration
 * 
 * Credly supports OAuth 2.0 authentication which allows accessing the API
 * with proper authentication instead of relying on public endpoints.
 * 
 * To set up:
 * 1. Register an OAuth application at https://www.credly.com/oauth/authorizations
 * 2. Get CLIENT_ID and CLIENT_SECRET
 * 3. Configure redirect URI (e.g., https://yourdomain.com/api/credly/oauth/callback)
 */

// OAuth Configuration
const CREDLY_OAUTH_BASE = "https://www.credly.com/oauth"
const CREDLY_API_BASE = "https://www.credly.com/api/v1"

// These should be set in environment variables
const CLIENT_ID = process.env.CREDLY_CLIENT_ID || ""
const CLIENT_SECRET = process.env.CREDLY_CLIENT_SECRET || ""

// OAuth scopes needed
const SCOPES = ["read:user", "read:badges"]

/**
 * Generate OAuth authorization URL
 * User should be redirected to this URL to authorize the app
 */
export function generateAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPES.join(" "),
    state,
  })

  return `${CREDLY_OAUTH_BASE}/authorize?${params.toString()}`
}

/**
 * Get redirect URI from environment or construct from NEXTAUTH_URL
 */
function getRedirectUri(): string {
  return process.env.CREDLY_REDIRECT_URI || 
    `${process.env.NEXTAUTH_URL}/api/credly/oauth/callback`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<{
  success: true
  access_token: string
  refresh_token: string
  expires_in: number
  user_id: string
} | {
  success: false
  error: string
}> {
  try {
    const response = await fetch(`${CREDLY_OAUTH_BASE}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: getRedirectUri(),
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return { 
        success: false, 
        error: error.error_description || error.error || "Failed to exchange code" 
      }
    }

    const data = await response.json()
    
    return {
      success: true,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      user_id: data.user_id,
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  success: true
  access_token: string
  expires_in: number
} | {
  success: false
  error: string
}> {
  try {
    const response = await fetch(`${CREDLY_OAUTH_BASE}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return { 
        success: false, 
        error: error.error_description || error.error || "Failed to refresh token" 
      }
    }

    const data = await response.json()
    
    return {
      success: true,
      access_token: data.access_token,
      expires_in: data.expires_in,
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }
  }
}

/**
 * Fetch user's badges with OAuth authentication
 */
export async function fetchUserBadges(accessToken: string): Promise<{
  success: true
  badges: any[]
} | {
  success: false
  error: string
}> {
  try {
    const response = await fetch(`${CREDLY_API_BASE}/me/badges`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
      },
    })

    if (response.status === 401) {
      return { success: false, error: "Token expired" }
    }

    if (!response.ok) {
      return { success: false, error: `API error: ${response.status}` }
    }

    const data = await response.json()
    
    return {
      success: true,
      badges: data.data || [],
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }
  }
}

/**
 * Fetch current user info
 */
export async function fetchCurrentUser(accessToken: string): Promise<{
  success: true
  user: {
    id: string
    name: string
    email: string
    username: string
    profile_url: string
  }
} | {
  success: false
  error: string
}> {
  try {
    const response = await fetch(`${CREDLY_API_BASE}/me`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
      },
    })

    if (response.status === 401) {
      return { success: false, error: "Token expired" }
    }

    if (!response.ok) {
      return { success: false, error: `API error: ${response.status}` }
    }

    const data = await response.json()
    
    return {
      success: true,
      user: data.data,
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }
  }
}

/**
 * Check if OAuth is configured
 */
export function isOAuthConfigured(): boolean {
  return !!(CLIENT_ID && CLIENT_SECRET)
}

/**
 * Generate a random state parameter for OAuth security
 */
export function generateState(): string {
  return Buffer.from(Math.random().toString(36) + Date.now().toString(36)).toString('base64')
}
