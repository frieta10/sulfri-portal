"use client"

import Script from "next/script"

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[]
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <Script
      id="json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// Person schema for homepage
interface PersonSchemaProps {
  name: string
  jobTitle?: string
  organization?: string
  description?: string
  image?: string
  url?: string
  sameAs?: string[]
  skills?: string[]
  email?: string
  telephone?: string
  address?: {
    addressLocality?: string
    addressRegion?: string
    addressCountry?: string
  }
}

export function PersonSchema({
  name,
  jobTitle = "Corporate Trainer",
  organization = "MSH Corporate Trainer",
  description,
  image,
  url,
  sameAs = [],
  skills = [],
  email,
  telephone,
  address,
}: PersonSchemaProps) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    jobTitle,
    description,
    image,
    url,
    sameAs,
    knowsAbout: skills,
  }

  if (organization) {
    schema.worksFor = {
      "@type": "Organization",
      name: organization,
    }
  }

  if (email || telephone || address) {
    const contactPoint: Record<string, unknown> = {
      "@type": "ContactPoint",
      contactType: "Training Inquiries",
    }

    if (email) contactPoint.email = email
    if (telephone) contactPoint.telephone = telephone
    if (address) {
      contactPoint.areaServed = {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          ...address,
        },
      }
    }

    schema.contactPoint = contactPoint
  }

  return <JsonLd data={schema} />
}

// Organization schema
interface OrganizationSchemaProps {
  name: string
  description?: string
  url?: string
  logo?: string
  sameAs?: string[]
  contactPoint?: {
    telephone?: string
    email?: string
    contactType?: string
  }
}

export function OrganizationSchema({
  name,
  description,
  url,
  logo,
  sameAs = [],
  contactPoint,
}: OrganizationSchemaProps) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    description,
    url,
    logo,
    sameAs,
  }

  if (contactPoint) {
    schema.contactPoint = {
      "@type": "ContactPoint",
      ...contactPoint,
    }
  }

  return <JsonLd data={schema} />
}

// Website schema
interface WebsiteSchemaProps {
  name: string
  url: string
  searchUrl?: string
}

export function WebsiteSchema({ name, url, searchUrl }: WebsiteSchemaProps) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
  }

  if (searchUrl) {
    schema.potentialAction = {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: searchUrl,
      },
      "query-input": "required name=search_term",
    }
  }

  return <JsonLd data={schema} />
}

// BreadcrumbList schema
interface BreadcrumbItem {
  name: string
  item: string
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  }

  return <JsonLd data={schema} />
}

// Course schema for training offerings
interface CourseSchemaProps {
  name: string
  description?: string
  provider?: string
  url?: string
  courseCode?: string
  educationalLevel?: string
  timeRequired?: string
  subject?: string[]
}

export function CourseSchema({
  name,
  description,
  provider = "MSH Corporate Trainer",
  url,
  courseCode,
  educationalLevel,
  timeRequired,
  subject,
}: CourseSchemaProps) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Course",
    name,
    description,
    url,
    provider: {
      "@type": "Organization",
      name: provider,
    },
  }

  if (courseCode) schema.courseCode = courseCode
  if (educationalLevel) schema.educationalLevel = educationalLevel
  if (timeRequired) schema.timeRequired = timeRequired
  if (subject) schema.about = subject.map((s) => ({ "@type": "Thing", name: s }))

  return <JsonLd data={schema} />
}

// ProfessionalService schema
interface ProfessionalServiceSchemaProps {
  name: string
  description?: string
  url?: string
  image?: string
  areaServed?: string
  serviceType?: string
  telephone?: string
  email?: string
  priceRange?: string
}

export function ProfessionalServiceSchema({
  name,
  description,
  url,
  image,
  areaServed = "Malaysia",
  serviceType = "Corporate Training",
  telephone,
  email,
  priceRange = "$$",
}: ProfessionalServiceSchemaProps) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name,
    description,
    url,
    image,
    areaServed,
    serviceType,
    priceRange,
  }

  if (telephone || email) {
    schema.contactPoint = {
      "@type": "ContactPoint",
      telephone,
      email,
      contactType: "Customer Service",
    }
  }

  return <JsonLd data={schema} />
}
