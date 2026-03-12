"use client"

import Script from "next/script"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, Suspense } from "react"

interface GA4ProviderProps {
  measurementId?: string | null
}

// Inner component that uses useSearchParams
function GA4Tracking({ measurementId }: GA4ProviderProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Track page views
  useEffect(() => {
    if (!measurementId || typeof window === "undefined") return

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "")

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (window as any).gtag === "function") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).gtag("config", measurementId, {
        page_path: url,
      })
    }
  }, [pathname, searchParams, measurementId])

  return null
}

export function GA4Provider({ measurementId }: GA4ProviderProps) {
  if (!measurementId) {
    return null
  }

  return (
    <>
      {/* Google Analytics Script */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_path: window.location.pathname,
            send_page_view: true,
            anonymize_ip: true,
            allow_ad_personalization_signals: false
          });
        `}
      </Script>
      <Suspense fallback={null}>
        <GA4Tracking measurementId={measurementId} />
      </Suspense>
    </>
  )
}

// Check if GA4 is available
export function isGA4Available(): boolean {
  if (typeof window === "undefined") return false
  return typeof (window as any).gtag === "function"
}

// Utility function to track custom events
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, string | number | boolean>
) {
  if (typeof window === "undefined") return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (window as any).gtag === "function") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).gtag("event", eventName, eventParams)
  }
}

// Common event tracking helpers
export const trackProposalSubmit = () => {
  trackEvent("proposal_submit", {
    event_category: "conversion",
    event_label: "proposal_form",
  })
}

export const trackPdfDownload = (type: "summary" | "full" = "summary") => {
  trackEvent("pdf_download", {
    event_category: "engagement",
    event_label: type,
  })
}

export const trackWhatsAppClick = (source: string = "unknown") => {
  trackEvent("whatsapp_click", {
    event_category: "engagement",
    event_label: source,
  })
}

export const trackBadgeView = (badgeTitle: string) => {
  trackEvent("badge_view", {
    event_category: "engagement",
    event_label: badgeTitle,
  })
}

export const trackResourceDownload = (resourceTitle: string) => {
  trackEvent("resource_download", {
    event_category: "engagement",
    event_label: resourceTitle,
  })
}

// Enhanced event tracking helpers (CR-04 Module E)

/**
 * Track skill tree node click
 * @param nodeTitle - Title of the clicked node
 * @param nodeSlug - Slug of the clicked node
 * @param depth - Depth level in the tree (1-4)
 */
export const trackSkillTreeNodeClick = (
  nodeTitle: string,
  nodeSlug: string,
  depth: number
) => {
  trackEvent("skill_tree_node_click", {
    event_category: "engagement",
    event_label: nodeTitle,
    node_slug: nodeSlug,
    depth,
  })
}

/**
 * Track contact link click
 * @param type - Type of contact (email, phone, linkedin)
 * @param location - Where the link was clicked
 */
export const trackContactClick = (
  type: "email" | "phone" | "linkedin" | "other",
  location: string
) => {
  trackEvent("contact_click", {
    event_category: "engagement",
    contact_type: type,
    location,
  })
}

/**
 * Track event registration
 * @param courseId - ID of the course
 * @param courseTitle - Title of the course
 * @param utmSource - UTM source if available
 */
export const trackEventRegistration = (
  courseId: string,
  courseTitle: string,
  utmSource?: string
) => {
  trackEvent("event_registration", {
    event_category: "conversion",
    course_id: courseId,
    course_title: courseTitle,
    utm_source: utmSource || "direct",
  })
}

/**
 * Track direct enquiry submission
 * @param hasOrganisation - Whether the enquiry included an organisation
 * @param messageLength - Length of the message
 */
export const trackDirectEnquirySubmit = (
  hasOrganisation: boolean,
  messageLength: number
) => {
  trackEvent("direct_enquiry_submit", {
    event_category: "conversion",
    has_organisation: hasOrganisation,
    message_length: messageLength,
  })
}

/**
 * Track page view (for manual tracking in SPAs)
 * @param pagePath - Path of the page
 * @param pageTitle - Title of the page
 */
export const trackPageView = (pagePath: string, pageTitle: string) => {
  if (!isGA4Available()) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[GA4 Debug] page_view:`, { pagePath, pageTitle })
    }
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gtag = (window as any).gtag
  gtag("event", "page_view", {
    page_path: pagePath,
    page_title: pageTitle,
    page_location: window.location.href,
  })
}

// React hook for tracking page views
export function usePageTracking(pagePath: string, pageTitle: string) {
  useEffect(() => {
    trackPageView(pagePath, pageTitle)
  }, [pagePath, pageTitle])
}
