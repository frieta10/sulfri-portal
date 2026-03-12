import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { inflate, inflateRaw } from "zlib"
import { promisify } from "util"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  parseOB3Credentials,
  validateOB3Credential,
  convertOB3ToBadge,
} from "@/lib/openbadges3"
import { generateSlug } from "@/lib/validations/badge"

const inflateAsync = promisify(inflate)
const inflateRawAsync = promisify(inflateRaw)

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

// Keywords for baked badges (OB3 and OB2). Matched case-insensitively.
const OB3_KEYWORDS_LOWER = ["openbadgescredential", "openbadges"]

interface TextChunk {
  type: string
  keyword: string
  text: string
}

interface ExtractResult {
  json: string | null
  /** All text chunks found (for diagnostics) */
  textChunks: TextChunk[]
}

/**
 * Try to decompress data with both zlib (inflate) and raw deflate (inflateRaw).
 * Returns null if both fail.
 */
async function tryDecompress(data: Buffer): Promise<Buffer | null> {
  try {
    return await inflateAsync(data)
  } catch {
    // zlib failed, try raw deflate
  }
  try {
    return await inflateRawAsync(data)
  } catch {
    return null
  }
}

/**
 * Collect all text-type chunks from a PNG buffer.
 * Handles tEXt, zTXt, and iTXt chunk types.
 * Does NOT stop on errors — always scans the full file.
 */
async function collectPNGTextChunks(buffer: Buffer): Promise<TextChunk[]> {
  const chunks: TextChunk[] = []

  if (buffer.length < 8 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return chunks
  }

  let offset = 8
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii")
    const data = buffer.subarray(offset + 8, offset + 8 + length)

    if (type === "tEXt") {
      // Format: keyword\0text (Latin-1)
      const nullIdx = data.indexOf(0)
      if (nullIdx !== -1) {
        const keyword = data.subarray(0, nullIdx).toString("latin1")
        const text = data.subarray(nullIdx + 1).toString("utf8")
        chunks.push({ type: "tEXt", keyword, text })
      }
    } else if (type === "zTXt") {
      // Format: keyword\0compressionMethod(1 byte)\0compressedText
      const nullIdx = data.indexOf(0)
      if (nullIdx !== -1) {
        const keyword = data.subarray(0, nullIdx).toString("latin1")
        // byte after null is compression method (0 = zlib deflate); skip it
        const compressed = data.subarray(nullIdx + 2)
        const decompressed = await tryDecompress(compressed)
        if (decompressed) {
          chunks.push({ type: "zTXt", keyword, text: decompressed.toString("utf8") })
        }
      }
    } else if (type === "iTXt") {
      // Format: keyword\0compressionFlag(1)\0compressionMethod(1)\0languageTag\0translatedKeyword\0text
      const nullIdx = data.indexOf(0)
      if (nullIdx !== -1) {
        const keyword = data.subarray(0, nullIdx).toString("latin1")
        let pos = nullIdx + 1
        if (pos + 2 > data.length) {
          offset += 4 + 4 + length + 4
          if (length > buffer.length) break
          continue
        }
        const compressionFlag = data[pos++]
        pos++ // skip compression method byte
        const langEnd = data.indexOf(0, pos)
        if (langEnd === -1) {
          offset += 4 + 4 + length + 4
          if (length > buffer.length) break
          continue
        }
        pos = langEnd + 1
        const transEnd = data.indexOf(0, pos)
        if (transEnd === -1) {
          offset += 4 + 4 + length + 4
          if (length > buffer.length) break
          continue
        }
        pos = transEnd + 1
        const textData = data.subarray(pos)

        let text: string | null = null
        if (compressionFlag === 1) {
          const decompressed = await tryDecompress(textData)
          if (decompressed) text = decompressed.toString("utf8")
        } else {
          text = textData.toString("utf8")
        }

        if (text !== null) {
          chunks.push({ type: "iTXt", keyword, text })
        }
      }
    } else if (type === "IEND") {
      break
    }

    offset += 4 + 4 + length + 4 // length + type + data + CRC
    if (length > buffer.length) break // guard against corrupt length
  }

  return chunks
}

/**
 * Extract an OB3 JSON credential from a PNG buffer.
 *
 * Strategy (in order):
 * 1. Find a text chunk whose keyword matches the OB3/OB2 baking keywords (case-insensitive)
 * 2. Fallback: find any text chunk whose content is valid JSON with OB3 markers
 */
async function extractOB3FromPNG(buffer: Buffer): Promise<ExtractResult> {
  const textChunks = await collectPNGTextChunks(buffer)

  // Pass 1: look for an exact keyword match (case-insensitive)
  for (const chunk of textChunks) {
    if (OB3_KEYWORDS_LOWER.includes(chunk.keyword.toLowerCase())) {
      return { json: chunk.text, textChunks }
    }
  }

  // Pass 2: fallback — any text chunk whose content parses as OB3 JSON
  for (const chunk of textChunks) {
    const trimmed = chunk.text.trimStart()
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) continue
    try {
      const parsed = JSON.parse(chunk.text)
      const items = Array.isArray(parsed) ? parsed : [parsed]
      const first = items[0]
      if (
        first &&
        (first["@context"] ||
          (Array.isArray(first.type) && first.type.some((t: string) => t.includes("Credential"))) ||
          first.credentialSubject ||
          first.verifiableCredential)
      ) {
        return { json: chunk.text, textChunks }
      }
    } catch {
      // not valid JSON
    }
  }

  return { json: null, textChunks }
}

/**
 * POST /api/admin/badges/import-ob3-image
 *
 * Accepts a multipart/form-data upload with an `image` field (PNG).
 * Extracts the embedded OB3 credential and imports it as a badge.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("image") as File | null
    const autoCreateSkills = formData.get("autoCreateSkills") !== "false"

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { json: jsonContent, textChunks } = await extractOB3FromPNG(buffer)

    // Always log chunk info for debugging (visible in Vercel logs)
    console.log(
      `[import-ob3-image] File: ${file.name} (${buffer.length} bytes), ` +
      `text chunks found: ${textChunks.length}`,
      textChunks.map((c) => `${c.type}[${c.keyword}]: ${c.text.slice(0, 80)}`)
    )

    if (!jsonContent) {
      const chunkSummary = textChunks.length > 0
        ? textChunks.map((c) => `${c.type}[${c.keyword}]`).join(", ")
        : "none"

      return NextResponse.json(
        {
          error: "No OB3 credential found in this image.",
          details: `Chunks scanned: ${chunkSummary}. ` +
            (textChunks.length > 0
              ? "No matching OB3 keyword found."
              : "No text chunks found — this may be a regular PNG, not an Open Badges baked image."),
          chunks: textChunks.map((c) => ({
            type: c.type,
            keyword: c.keyword,
            preview: c.text.slice(0, 120),
          })),
        },
        { status: 400 }
      )
    }

    const credentials = parseOB3Credentials(jsonContent)

    if (credentials.length === 0) {
      return NextResponse.json(
        { error: "Could not parse the OB3 credential embedded in the image." },
        { status: 400 }
      )
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
      skillsCreated: 0,
      badges: [] as any[],
    }

    for (const credential of credentials) {
      try {
        console.log("[import-ob3-image] Processing credential:", credential.id, "name:", (credential as any).credentialSubject?.achievement?.name || credential.name)

        if (!validateOB3Credential(credential)) {
          results.errors.push(`Invalid credential: ${credential.id || "unknown"}`)
          results.skipped++
          continue
        }

        const badgeData = convertOB3ToBadge(credential)
        console.log("[import-ob3-image] Badge data:", { title: badgeData.title, issuer: badgeData.issuer, issueDate: badgeData.issueDate, slug: badgeData.slug })

        // Ensure unique slug
        let slug = badgeData.slug
        let counter = 1
        while (await prisma.badge.findUnique({ where: { slug } })) {
          slug = `${badgeData.slug}-${counter}`
          counter++
        }

        // Optionally create skills
        const skillIds: string[] = []
        if (autoCreateSkills && badgeData.skills.length > 0) {
          for (const skillName of badgeData.skills) {
            const skillSlug = generateSlug(skillName)
            let skill = await prisma.skill.findUnique({ where: { slug: skillSlug } })
            if (!skill) {
              skill = await prisma.skill.create({
                data: { name: skillName, slug: skillSlug, visibility: "PUBLIC" },
              })
              results.skillsCreated++
            }
            skillIds.push(skill.id)
          }
        }

        // Skip duplicates
        const existingBadge = await prisma.badge.findFirst({
          where: {
            title: badgeData.title,
            issuer: badgeData.issuer,
            issueDate: badgeData.issueDate,
          },
        })
        if (existingBadge) {
          results.skipped++
          continue
        }

        const credlyBadgeId = credential.id
          ? credential.id.split("/").pop() || `ob3-${Date.now()}`
          : `ob3-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        let issueDate = badgeData.issueDate
        if (!issueDate || isNaN(issueDate.getTime())) {
          issueDate = new Date()
        }

        const badge = await prisma.badge.create({
          data: {
            title: badgeData.title || "Untitled Badge",
            slug,
            description: badgeData.description,
            issuer: badgeData.issuer || "Unknown",
            issueDate,
            expiryDate: badgeData.expiryDate,
            credlyBadgeId,
            credlyHost: "https://www.credly.com",
            iframeWidth: 150,
            iframeHeight: 270,
            fallbackImageUrl: badgeData.fallbackImageUrl,
            verificationUrl: badgeData.verificationUrl,
            visibility: "PUBLIC",
            featured: false,
            autoSyncEnabled: false,
          },
        })

        if (skillIds.length > 0) {
          await prisma.badgeSkill.createMany({
            data: skillIds.map((skillId) => ({ badgeId: badge.id, skillId })),
          })
        }

        const badgeWithSkills = await prisma.badge.findUnique({
          where: { id: badge.id },
          include: { badgeSkills: { include: { skill: true } } },
        })

        results.imported++
        results.badges.push(badgeWithSkills)
      } catch (error: any) {
        const errMsg = `Failed to import ${credential.id || "credential"}: ${error.message}`
        console.error("[import-ob3-image] Import error:", errMsg, error)
        results.errors.push(errMsg)
      }
    }

    return NextResponse.json({ success: true, results, totalFound: credentials.length })
  } catch (error: any) {
    console.error("Error importing OB3 badge from image:", error)
    return NextResponse.json(
      { error: error.message || "Failed to import badge from image" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/badges/import-ob3-image
 *
 * Diagnostic — accepts multipart PNG, returns chunk info WITHOUT importing.
 */
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("image") as File | null

  if (!file) {
    return NextResponse.json({ error: "No image file provided" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  if (buffer.length < 8 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return NextResponse.json({
      isPNG: false,
      message: "File does not start with a PNG signature.",
      size: buffer.length,
      header: buffer.subarray(0, 16).toString("hex"),
    })
  }

  const textChunks = await collectPNGTextChunks(buffer)
  const { json } = await extractOB3FromPNG(buffer)

  return NextResponse.json({
    isPNG: true,
    size: buffer.length,
    fileName: file.name,
    textChunksFound: textChunks.length,
    credentialFound: !!json,
    credentialPreview: json ? json.slice(0, 200) : null,
    chunks: textChunks.map((c) => ({
      type: c.type,
      keyword: c.keyword,
      length: c.text.length,
      preview: c.text.slice(0, 200),
    })),
  })
}
