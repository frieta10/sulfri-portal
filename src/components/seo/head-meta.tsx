"use client"

import Head from "next/head"

interface HeadMetaProps {
  title: string
  description?: string
  canonical?: string
  ogImage?: string
  ogType?: "website" | "article" | "profile"
  twitterCard?: "summary" | "summary_large_image"
  noIndex?: boolean
}

export function HeadMeta({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
  twitterCard = "summary_large_image",
  noIndex = false,
}: HeadMetaProps) {
  const siteName = "MSH Corporate Trainer"
  const defaultDescription = "Professional corporate training and consulting services in project management, digital transformation, and leadership development."
  const defaultOgImage = "/og-image.jpg"

  const metaDescription = description || defaultDescription
  const metaOgImage = ogImage || defaultOgImage

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={metaDescription} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={ogType} />
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:image" content={metaOgImage} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaOgImage} />

      {/* Additional SEO Tags */}
      <meta name="author" content="MSH Corporate Trainer" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>
  )
}
