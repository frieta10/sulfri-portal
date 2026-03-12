import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || "https://example.com"

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/badges",
          "/badges/*",
          "/skills",
          "/skills/*",
          "/expertise",
          "/expertise/*",
          "/downloads-public",
          "/proposal",
          "/contact",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/api",
          "/api/*",
          "/dashboard",
          "/classes",
          "/profile-settings",
          "/downloads",
          "/change-password",
          "/login",
          "/_next",
          "/_next/*",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: [
          "/",
          "/badges",
          "/badges/*",
          "/skills",
          "/skills/*",
          "/expertise",
          "/expertise/*",
          "/downloads-public",
          "/proposal",
          "/contact",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/api",
          "/api/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
