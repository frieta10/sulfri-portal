"use client"

import { isGA4Available } from "./ga4-provider"

// Custom event types for GA4 tracking
export type GA4EventType =
  | "pdf_download"
  | "proposal_form_submit"
  | "whatsapp_cta_click"
  | "badge_wallet_view"
  | "skill_tree_node_click"
  | "page_view"
  | "contact_click"
  | "event_registration"
  | "direct_enquiry_submit"

// Event parameters interface
interface GA4EventParams {
  [key: string]: string | number | boolean | undefined
}

// Base function to track any custom event
export function trackGA4Event(
  eventName: GA4EventType,
  params: GA4EventParams = {}
): void {
  if (!isGA4Available()) {
    // Silently skip if GA4 is not loaded (e.g., in development or if no measurement ID)
    if (process.env.NODE_ENV === "development") {
      console.log(`[GA4 Debug] ${eventName}:`, params)
    }
    return
  }

  try {
    const gtag = (window as any).gtag
    gtag("event", eventName, {
      ...params,
      event_timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(`Failed to track GA4 event "${eventName}":`, error)
  }
}

// Specific event tracking functions

/**
 * Track PDF download event
 * @param type - 'summary' or 'full'
 * @param topic - Optional topic/category
 */
export function trackPDFDownload(
  type: "summary" | "full",
  topic?: string
): void {
  trackGA4Event("pdf_download", {
    type,
    topic: topic || "general",
    file_name: type === "summary" ? "profile-summary.pdf" : "full-profile.pdf",
  })
}

/**
 * Track proposal form submission
 * @param topic - Training topic of interest
 * @param groupSize - Size of the group
 * @param deliveryMode - Online, Physical, or Hybrid
 */
export function trackProposalSubmit(
  topic: string,
  groupSize: string,
  deliveryMode: string
): void {
  trackGA4Event("proposal_form_submit", {
    topic,
    group_size: groupSize,
    delivery_mode: deliveryMode,
  })
}

/**
 * Track WhatsApp CTA click
 * @param location - Where the CTA was clicked (e.g., 'sticky_bar', 'hero', 'footer')
 * @param context - Optional additional context
 */
export function trackWhatsAppClick(
  location: string,
  context?: string
): void {
  trackGA4Event("whatsapp_cta_click", {
    location,
    context: context || "general",
  })
}

/**
 * Track badge wallet view
 * @param badgeCount - Number of badges visible
 * @param source - How the user reached the badge wallet
 */
export function trackBadgeWalletView(
  badgeCount: number,
  source: string = "navigation"
): void {
  trackGA4Event("badge_wallet_view", {
    badge_count: badgeCount,
    source,
  })
}

/**
 * Track skill tree node click
 * @param nodeTitle - Title of the clicked node
 * @param nodeSlug - Slug of the clicked node
 * @param depth - Depth level in the tree (1-4)
 */
export function trackSkillTreeNodeClick(
  nodeTitle: string,
  nodeSlug: string,
  depth: number
): void {
  trackGA4Event("skill_tree_node_click", {
    node_title: nodeTitle,
    node_slug: nodeSlug,
    depth,
  })
}

/**
 * Track page view (for manual tracking in SPAs)
 * @param pagePath - Path of the page
 * @param pageTitle - Title of the page
 */
export function trackPageView(
  pagePath: string,
  pageTitle: string
): void {
  if (!isGA4Available()) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[GA4 Debug] page_view:`, { pagePath, pageTitle })
    }
    return
  }

  try {
    const gtag = (window as any).gtag
    gtag("event", "page_view", {
      page_path: pagePath,
      page_title: pageTitle,
      page_location: window.location.href,
    })
  } catch (error) {
    console.error("Failed to track page view:", error)
  }
}

/**
 * Track contact link click
 * @param type - Type of contact (email, phone, linkedin)
 * @param location - Where the link was clicked
 */
export function trackContactClick(
  type: "email" | "phone" | "linkedin" | "other",
  location: string
): void {
  trackGA4Event("contact_click", {
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
export function trackEventRegistration(
  courseId: string,
  courseTitle: string,
  utmSource?: string
): void {
  trackGA4Event("event_registration", {
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
export function trackDirectEnquirySubmit(
  hasOrganisation: boolean,
  messageLength: number
): void {
  trackGA4Event("direct_enquiry_submit", {
    has_organisation: hasOrganisation,
    message_length: messageLength,
  })
}

// React hook for tracking page views
import { useEffect } from "react"

export function usePageTracking(pagePath: string, pageTitle: string) {
  useEffect(() => {
    trackPageView(pagePath, pageTitle)
  }, [pagePath, pageTitle])
}
