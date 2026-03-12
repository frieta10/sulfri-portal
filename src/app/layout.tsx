import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ToastProvider } from "@/components/providers/toast-provider"
import { GA4Provider } from "@/components/providers/ga4-provider"
import { PersonSchema, WebsiteSchema } from "@/components/seo/json-ld"
import { prisma } from "@/lib/prisma"

const inter = Inter({ subsets: ["latin"] })

async function getSeoSettings() {
  try {
    const settings = await prisma.portalSettings.findUnique({
      where: { id: "singleton" },
    })
    return settings
  } catch {
    return null
  }
}

async function getProfileSettings() {
  try {
    const profile = await prisma.profileSettings.findUnique({
      where: { id: "singleton" },
    })
    return profile
  } catch {
    return null
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSeoSettings()
  
  const title = settings?.seoHomepageTitle || "MSH Corporate Trainer | Professional Training & Consulting"
  const description = settings?.seoHomepageDescription || 
    "Professional corporate training and consulting services in project management, digital transformation, and leadership development."
  const ogImage = settings?.ogImageUrl

  return {
    title: {
      default: title,
      template: "%s | MSH Corporate Trainer",
    },
    description,
    keywords: ["corporate trainer", "training", "consulting", "project management", "leadership", "Malaysia"],
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: "MSH Corporate Trainer",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    alternates: {
      canonical: "/",
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await getSeoSettings()
  const profile = await getProfileSettings()

  const baseUrl = process.env.NEXTAUTH_URL || "https://example.com"

  // Person schema data
  const personSchemaData = {
    name: profile?.displayName || "Mohd Sulfri Mohd Harris",
    jobTitle: "Senior Corporate Trainer & Project Management Expert",
    organization: "MSH Corporate Trainer",
    description: profile?.bio || 
      "Delivering high-impact training programmes for government agencies, GLCs, and multinational corporations.",
    image: profile?.profilePhotoUrl || `${baseUrl}/msh-logo.svg`,
    url: baseUrl,
    sameAs: profile?.linkedinUrl ? [profile.linkedinUrl] : [],
    skills: [
      "Project Management",
      "Digital Transformation",
      "Leadership Development",
      "Corporate Training",
      "Change Management",
      "Strategic Planning",
    ],
    email: profile?.email || undefined,
    telephone: profile?.phone || undefined,
    address: profile?.locationBase ? {
      addressLocality: profile.locationBase,
      addressCountry: "Malaysia",
    } : undefined,
  }

  // Website schema data
  const websiteSchemaData = {
    name: "MSH Corporate Trainer",
    url: baseUrl,
    searchUrl: `${baseUrl}/badges?search={search_term}`,
  }

  return (
    <html lang="en">
      <head>
        {/* Structured Data */}
        <PersonSchema {...personSchemaData} />
        <WebsiteSchema {...websiteSchemaData} />
      </head>
      <body className={inter.className}>
        {/* Google Analytics */}
        <GA4Provider measurementId={settings?.ga4MeasurementId} />
        
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}
