import { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || "https://example.com"

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/badges`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/skills`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/expertise`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/downloads-public`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/proposal`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ]

  // Fetch dynamic routes - Badges
  const badges = await prisma.badge.findMany({
    where: { visibility: "PUBLIC" },
    select: { slug: true, updatedAt: true },
  })

  const badgeRoutes: MetadataRoute.Sitemap = badges.map((badge) => ({
    url: `${baseUrl}/badges/${badge.slug}`,
    lastModified: badge.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }))

  // Fetch dynamic routes - Expertise Nodes
  const expertiseNodes = await prisma.expertiseNode.findMany({
    where: { visibility: "PUBLIC" },
    select: { slug: true, updatedAt: true },
  })

  const expertiseRoutes: MetadataRoute.Sitemap = expertiseNodes.map((node) => ({
    url: `${baseUrl}/expertise/${node.slug}`,
    lastModified: node.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }))

  // Fetch dynamic routes - Skills
  const skills = await prisma.skill.findMany({
    where: { visibility: "PUBLIC" },
    select: { slug: true, updatedAt: true },
  })

  const skillRoutes: MetadataRoute.Sitemap = skills.map((skill) => ({
    url: `${baseUrl}/skills/${skill.slug}`,
    lastModified: skill.updatedAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }))

  return [...staticRoutes, ...badgeRoutes, ...expertiseRoutes, ...skillRoutes]
}
