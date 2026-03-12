/**
 * Open Badges 3.0 (OB3) Integration
 * 
 * Open Badges 3.0 is the latest specification for digital credentials,
 * using JSON-LD format and Verifiable Credentials standards.
 * 
 * Credly supports exporting badges in OB3 format, which provides
 * a standardized way to import badge data without requiring API access.
 * 
 * Specification: https://www.imsglobal.org/spec/ob/v3p0/
 */

// Open Badges 3.0 Types
export interface OB3Credential {
  "@context": string[]
  id: string
  type: string[]
  issuer: OB3Issuer | string
  validFrom: string
  validUntil?: string
  credentialSubject: OB3CredentialSubject
  name?: string
  description?: string
  image?: OB3Image | string
}

export interface OB3Issuer {
  id: string
  type: string[]
  name: string
  url?: string
  image?: string
  email?: string
}

export interface OB3CredentialSubject {
  id: string
  type: string
  achievement: OB3Achievement
}

export interface OB3Achievement {
  id: string
  type: string[]
  name: string
  description?: string
  criteria?: OB3Criteria
  image?: OB3Image | string
}

export interface OB3Criteria {
  narrative?: string
}

export interface OB3Image {
  id: string
  type: string
}

/**
 * Parse an Open Badges 3.0 JSON file
 * Handles both standard OB3 and Credly's OB3 format
 */
export function parseOB3Credential(jsonString: string): OB3Credential | null {
  try {
    const data = JSON.parse(jsonString)
    
    // Handle array of credentials
    if (Array.isArray(data)) {
      const first = parseSingleOB3(data[0])
      return first
    }
    
    return parseSingleOB3(data)
  } catch (error) {
    console.error("Failed to parse OB3 credential:", error)
    return null
  }
}

/**
 * Parse a single OB3 credential object
 */
function parseSingleOB3(data: any): OB3Credential | null {
  // Handle different OB3 formats
  
  // Format 1: Standard VerifiableCredential with credentialSubject.achievement
  if (data.credentialSubject?.achievement) {
    // Ensure required fields have defaults
    return {
      "@context": data["@context"] || ["https://www.w3.org/2018/credentials/v1"],
      id: data.id || `urn:uuid:${Date.now()}`,
      type: Array.isArray(data.type) ? data.type : ["VerifiableCredential"],
      issuer: data.issuer,
      validFrom: data.validFrom || data.issuedOn || new Date().toISOString(),
      validUntil: data.validUntil || data.expires,
      credentialSubject: data.credentialSubject,
      name: data.name,
      description: data.description,
      image: data.image,
    } as OB3Credential
  }
  
  // Format 2: Credly format with credentialSubject but nested differently
  if (data.credentialSubject?.type === "AchievementSubject" && data.credentialSubject.achievement) {
    return {
      "@context": data["@context"] || ["https://www.w3.org/2018/credentials/v1"],
      id: data.id || `urn:uuid:${Date.now()}`,
      type: Array.isArray(data.type) ? data.type : ["VerifiableCredential"],
      issuer: data.issuer,
      validFrom: data.validFrom || data.issuedOn || new Date().toISOString(),
      validUntil: data.validUntil || data.expires,
      credentialSubject: data.credentialSubject,
      name: data.name,
      description: data.description,
      image: data.image,
    } as OB3Credential
  }
  
  // Format 3: Simplified format (some Credly exports)
  if (data.achievement && data.issuer) {
    return {
      "@context": data["@context"] || ["https://www.w3.org/2018/credentials/v1"],
      id: data.id || `urn:uuid:${Date.now()}`,
      type: Array.isArray(data.type) ? data.type : ["VerifiableCredential"],
      issuer: data.issuer,
      validFrom: data.validFrom || data.issuedOn || new Date().toISOString(),
      validUntil: data.validUntil || data.expires,
      credentialSubject: {
        id: data.credentialSubject?.id || `did:example:${Date.now()}`,
        type: "AchievementSubject",
        achievement: data.achievement,
      },
      name: data.name,
      description: data.description,
      image: data.image,
    }
  }
  
  // Format 4: Direct achievement at root level (some OB3 exports)
  if (data.name && data.issuer) {
    return {
      "@context": data["@context"] || ["https://www.w3.org/2018/credentials/v1"],
      id: data.id || `urn:uuid:${Date.now()}`,
      type: ["VerifiableCredential"],
      issuer: data.issuer,
      validFrom: data.validFrom || data.issuedOn || new Date().toISOString(),
      validUntil: data.validUntil || data.expires,
      credentialSubject: {
        id: data.credentialSubject?.id || `did:example:${Date.now()}`,
        type: "AchievementSubject",
        achievement: {
          id: data.id || `urn:uuid:${Date.now()}`,
          type: ["Achievement"],
          name: data.name,
          description: data.description,
          criteria: data.criteria,
          image: data.image,
        },
      },
      name: data.name,
      description: data.description,
      image: data.image,
    }
  }

  // Format 5: Has credentialSubject (without achievement) + issuer — reconstruct from available data.
  // Handles Credly exports where the badge name sits at the root and achievement is implicit.
  if (data.credentialSubject && data.issuer) {
    const name = data.name || data.credentialSubject.name || data.credentialSubject.achievement?.name
    if (name) {
      return {
        "@context": data["@context"] || ["https://www.w3.org/2018/credentials/v1"],
        id: data.id || `urn:uuid:${Date.now()}`,
        type: Array.isArray(data.type) ? data.type : ["VerifiableCredential"],
        issuer: data.issuer,
        validFrom: data.validFrom || data.issuedOn || new Date().toISOString(),
        validUntil: data.validUntil || data.expires,
        credentialSubject: {
          ...data.credentialSubject,
          achievement: {
            id: data.id || `urn:uuid:${Date.now()}`,
            type: ["Achievement"],
            name,
            description: data.description || data.credentialSubject.description,
            criteria: data.criteria || data.credentialSubject.criteria,
            image: data.image || data.credentialSubject.image,
          },
        },
        name,
        description: data.description,
        image: data.image,
      }
    }
  }

  console.error("Could not parse OB3 format:", Object.keys(data))
  return null
}

/**
 * Parse multiple OB3 credentials from a JSON array, single object, or VerifiablePresentation
 */
export function parseOB3Credentials(jsonString: string): OB3Credential[] {
  try {
    const data = JSON.parse(jsonString)
    const credentials: OB3Credential[] = []

    // Handle VerifiablePresentation wrapper (e.g. Credly multi-badge exports)
    if (data && !Array.isArray(data) && data.verifiableCredential) {
      const items = Array.isArray(data.verifiableCredential)
        ? data.verifiableCredential
        : [data.verifiableCredential]
      for (const item of items) {
        const parsed = parseSingleOB3(item)
        if (parsed) credentials.push(parsed)
      }
      return credentials
    }

    // Handle array of credentials
    if (Array.isArray(data)) {
      for (const item of data) {
        const parsed = parseSingleOB3(item)
        if (parsed) credentials.push(parsed)
      }
      return credentials
    }

    // Handle single credential
    const single = parseSingleOB3(data)
    if (single) credentials.push(single)

    return credentials
  } catch (error) {
    console.error("Failed to parse OB3 credentials:", error)
    return []
  }
}

/**
 * Extract badge data from OB3 credential for our database
 */
export function extractBadgeFromOB3(credential: OB3Credential): {
  title: string
  description: string | null
  issuer: string
  issueDate: string
  expiryDate: string | null
  imageUrl: string | null
  credentialUrl: string | null
  skills: string[]
} {
  // Handle different structures
  const achievement = credential.credentialSubject?.achievement
  
  // Get issuer name
  let issuer = 'Unknown'
  if (credential.issuer) {
    issuer = typeof credential.issuer === 'string' 
      ? credential.issuer 
      : credential.issuer.name || 'Unknown'
  }
  
  // Get title
  let title = 'Unknown Badge'
  if (achievement?.name) {
    title = achievement.name
  } else if (credential.name) {
    title = credential.name
  }
  
  // Get description
  let description = null
  if (achievement?.description) {
    description = achievement.description
  } else if (credential.description) {
    description = credential.description
  }
  
  // Extract image URL
  let imageUrl: string | null = null
  if (credential.image) {
    imageUrl = typeof credential.image === 'string' 
      ? credential.image 
      : credential.image.id
  } else if (achievement?.image) {
    imageUrl = typeof achievement.image === 'string'
      ? achievement.image
      : achievement.image.id
  }
  
  // Get dates
  const issueDate = credential.validFrom || new Date().toISOString()
  const expiryDate = credential.validUntil || null
  
  // Extract skills from criteria narrative if available
  const skills: string[] = []
  if (achievement?.criteria?.narrative) {
    const skillKeywords = [
      'cloud', 'azure', 'aws', 'gcp', 'kubernetes', 'docker', 'devops',
      'project management', 'agile', 'scrum', 'leadership', 'security',
      'networking', 'database', 'programming', 'python', 'javascript',
      'machine learning', 'ai', 'data science', 'analytics'
    ]
    
    const narrative = achievement.criteria.narrative.toLowerCase()
    skillKeywords.forEach(keyword => {
      if (narrative.includes(keyword)) {
        skills.push(keyword.charAt(0).toUpperCase() + keyword.slice(1))
      }
    })
  }
  
  return {
    title,
    description,
    issuer,
    issueDate,
    expiryDate,
    imageUrl,
    credentialUrl: credential.id,
    skills,
  }
}

/**
 * Validate OB3 credential signature (basic check)
 * Full verification would require cryptographic validation
 */
export function validateOB3Credential(credential: OB3Credential): boolean {
  // Check issuer exists
  if (!credential.issuer) return false
  
  // Check issuer name (fall back to issuer.id if name is absent)
  const issuerName = typeof credential.issuer === 'string'
    ? credential.issuer
    : credential.issuer.name || credential.issuer.id

  if (!issuerName) return false
  
  // Must have credentialSubject with achievement OR achievement at root
  const hasAchievement = credential.credentialSubject?.achievement || (credential as any).achievement
  if (!hasAchievement) return false
  
  // Check achievement name - look in multiple places
  const achievement = credential.credentialSubject?.achievement || (credential as any).achievement
  const achievementName = achievement?.name || credential.name
  if (!achievementName) return false
  
  return true
}

/**
 * Generate a slug from OB3 credential
 */
export function generateSlugFromOB3(credential: OB3Credential): string {
  // Get name from various possible locations
  let name = 'unknown-badge'
  
  if (credential.credentialSubject?.achievement?.name) {
    name = credential.credentialSubject.achievement.name
  } else if (credential.name) {
    name = credential.name
  } else if ((credential as any).achievement?.name) {
    name = (credential as any).achievement.name
  }
  
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 100)
}

/**
 * Check whether a single parsed JSON object looks like an OB3 credential or presentation
 */
function looksLikeOB3Item(item: any): boolean {
  if (!item || typeof item !== 'object') return false

  if (item["@context"]) {
    const context = Array.isArray(item["@context"]) ? item["@context"] : [item["@context"]]
    if (context.some((ctx: string) =>
      ctx.includes("credentials/v1") ||
      ctx.includes("ob/v3p0") ||
      ctx.includes("openbadges")
    )) return true
  }

  if (item.type) {
    const types = Array.isArray(item.type) ? item.type : [item.type]
    if (types.some((t: string) =>
      t.includes("VerifiableCredential") ||
      t.includes("OpenBadge") ||
      t.includes("Achievement")
    )) return true
  }

  if (item.credentialSubject) return true
  if (item.issuer && (item.name || item.achievement || item.credentialSubject)) return true

  return false
}

/**
 * Check if a string looks like OB3 JSON
 */
export function isOB3Format(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString)

    // Handle array of credentials — check the first element
    if (Array.isArray(data)) {
      return data.length > 0 && looksLikeOB3Item(data[0])
    }

    // Handle VerifiablePresentation wrapper
    if (data.verifiableCredential) {
      const items = Array.isArray(data.verifiableCredential)
        ? data.verifiableCredential
        : [data.verifiableCredential]
      return items.length > 0 && looksLikeOB3Item(items[0])
    }

    return looksLikeOB3Item(data)
  } catch {
    return false
  }
}

/**
 * Convert OB3 credential to our Badge format
 */
export function convertOB3ToBadge(credential: OB3Credential): {
  title: string
  slug: string
  description: string | null
  issuer: string
  issueDate: Date
  expiryDate: Date | null
  fallbackImageUrl: string | null
  verificationUrl: string | null
  skills: string[]
} {
  const extracted = extractBadgeFromOB3(credential)
  const slug = generateSlugFromOB3(credential)
  
  // Safely parse dates
  let issueDate: Date
  try {
    issueDate = new Date(extracted.issueDate)
    if (isNaN(issueDate.getTime())) {
      issueDate = new Date() // Fallback to now
    }
  } catch {
    issueDate = new Date()
  }
  
  let expiryDate: Date | null = null
  if (extracted.expiryDate) {
    try {
      const parsed = new Date(extracted.expiryDate)
      if (!isNaN(parsed.getTime())) {
        expiryDate = parsed
      }
    } catch {
      // Keep null
    }
  }
  
  return {
    title: extracted.title,
    slug,
    description: extracted.description,
    issuer: extracted.issuer,
    issueDate,
    expiryDate,
    fallbackImageUrl: extracted.imageUrl,
    verificationUrl: extracted.credentialUrl,
    skills: extracted.skills,
  }
}
