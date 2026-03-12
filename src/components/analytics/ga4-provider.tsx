"use client"

import { useEffect } from "react"
import Script from "next/script"

interface GA4ProviderProps {
  measurementId?: string | null
}

// GA4 initialization script
const GA4_INIT_SCRIPT = `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
`

export function GA4Provider({ measurementId }: GA4ProviderProps) {
  // Track page views on route changes
  useEffect(() => {
    if (!measurementId || typeof window === "undefined" || !(window as any).gtag) {
      return
    }

    const gtag = (window as any).gtag
    
    // Track initial page view
    gtag("config", measurementId, {
      page_path: window.location.pathname,
      page_title: document.title,
    })
  }, [measurementId])

  // Don't render anything if no measurement ID
  if (!measurementId) {
    return null
  }

  return (
    <>
      {/* Google Analytics 4 Script */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          ${GA4_INIT_SCRIPT}
          gtag('config', '${measurementId}', {
            send_page_view: true,
            cookie_flags: 'SameSite=None;Secure',
            cookie_expires: 63072000, // 2 years
            cookie_update: true,
          });
        `}
      </Script>
    </>
  )
}

// Helper to check if GA4 is available
export function isGA4Available(): boolean {
  if (typeof window === "undefined") return false
  return typeof (window as any).gtag === "function"
}
