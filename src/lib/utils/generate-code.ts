/**
 * Generates a unique 8-character alphanumeric join code
 * Excludes ambiguous characters (0, O, I, l) for better readability
 */
export function generateJoinCode(): string {
  // Characters that are easy to read and type (removed ambiguous ones)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""

  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length)
    code += chars[randomIndex]
  }

  return code
}

/**
 * Checks if a join code is unique in the database
 */
export async function isJoinCodeUnique(code: string, prisma: any): Promise<boolean> {
  const existing = await prisma.class.findUnique({
    where: { joinCode: code },
  })

  return !existing
}

/**
 * Generates a unique join code that doesn't exist in the database
 */
export async function generateUniqueJoinCode(prisma: any): Promise<string> {
  let code = generateJoinCode()
  let attempts = 0
  const maxAttempts = 10

  // Keep generating until we find a unique code
  while (!(await isJoinCodeUnique(code, prisma)) && attempts < maxAttempts) {
    code = generateJoinCode()
    attempts++
  }

  if (attempts >= maxAttempts) {
    throw new Error("Failed to generate unique join code after multiple attempts")
  }

  return code
}
