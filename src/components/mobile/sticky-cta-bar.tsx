"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, MessageCircle, X, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface StickyCtaBarProps {
  whatsappNumber?: string | null
  whatsappPrefillMessage?: string | null
  enabled?: boolean
  onDismiss?: () => void
}

export function StickyCtaBar({
  whatsappNumber,
  whatsappPrefillMessage = "Hi, I'm interested in your training services.",
  enabled = true,
  onDismiss,
}: StickyCtaBarProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isDismissed, setIsDismissed] = useState(false)

  // Check if user has previously dismissed the bar
  useEffect(() => {
    const dismissed = localStorage.getItem("stickyCtaDismissed")
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      const now = Date.now()
      const oneDay = 24 * 60 * 60 * 1000
      // Reset after 24 hours
      if (now - dismissedTime > oneDay) {
        localStorage.removeItem("stickyCtaDismissed")
      } else {
        setIsDismissed(true)
      }
    }
  }, [])

  if (!enabled || isDismissed || !isVisible) {
    return null
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    localStorage.setItem("stickyCtaDismissed", Date.now().toString())
    onDismiss?.()
  }

  const handleWhatsAppClick = () => {
    // Track analytics event
    if (typeof window !== "undefined" && "gtag" in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).gtag?.("event", "whatsapp_click", {
        event_category: "engagement",
        event_label: "sticky_cta_bar",
      })
    }

    // Track custom analytics
    fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "whatsapp_click",
        eventData: { source: "sticky_cta_bar" },
      }),
    }).catch(() => {
      // Silently fail - analytics shouldn't break functionality
    })
  }

  const handlePdfDownloadClick = () => {
    // Track analytics event
    if (typeof window !== "undefined" && "gtag" in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).gtag?.("event", "pdf_download", {
        event_category: "engagement",
        event_label: "sticky_cta_bar",
      })
    }

    // Track custom analytics
    fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "pdf_download",
        eventData: { source: "sticky_cta_bar", type: "summary" },
      }),
    }).catch(() => {
      // Silently fail
    })
  }

  const handleProposalClick = () => {
    // Track analytics event
    if (typeof window !== "undefined" && "gtag" in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).gtag?.("event", "proposal_click", {
        event_category: "conversion",
        event_label: "sticky_cta_bar",
      })
    }

    // Track custom analytics
    fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "proposal_click",
        eventData: { source: "sticky_cta_bar" },
      }),
    }).catch(() => {
      // Silently fail
    })
  }

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(whatsappPrefillMessage || "")}`
    : null

  return (
    <>
      {/* Spacer for mobile to prevent content from being hidden behind the bar */}
      <div className="h-20 md:hidden" />

      {/* Sticky CTA Bar - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        {/* Backdrop blur background */}
        <div className="absolute inset-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]" />

        <div className="relative px-4 py-3">
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute -top-3 right-2 w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-3 h-3 text-gray-600" />
          </button>

          {/* Button row */}
          <div className="flex items-center gap-2">
            {/* Request Training Button */}
            <Link href="/proposal" className="flex-1" onClick={handleProposalClick}>
              <Button
                size="sm"
                className="w-full bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium h-11"
              >
                <Calendar className="w-4 h-4 mr-1.5" />
                Request Training
              </Button>
            </Link>

            {/* Download Profile Button */}
            <Link href="/?download=pdf" className="flex-1" onClick={handlePdfDownloadClick}>
              <Button
                size="sm"
                variant="outline"
                className="w-full border-blue-200 text-blue-900 hover:bg-blue-50 text-xs font-medium h-11"
              >
                <FileText className="w-4 h-4 mr-1.5" />
                Download Profile
              </Button>
            </Link>

            {/* WhatsApp Button */}
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWhatsAppClick}
                className="flex-shrink-0"
              >
                <Button
                  size="sm"
                  className={cn(
                    "bg-green-500 hover:bg-green-600 text-white h-11 px-3"
                  )}
                >
                  <MessageCircle className="w-5 h-5" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// Hook to fetch sticky CTA settings
export function useStickyCtaSettings() {
  const [settings, setSettings] = useState<{
    enabled: boolean
    whatsappNumber: string | null
    whatsappPrefillMessage: string | null
  }>({
    enabled: true,
    whatsappNumber: null,
    whatsappPrefillMessage: "Hi, I'm interested in your training services.",
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings/public")
        if (response.ok) {
          const data = await response.json()
          setSettings({
            enabled: data.stickyCtaEnabled ?? true,
            whatsappNumber: data.whatsappNumber,
            whatsappPrefillMessage: data.whatsappPrefillMessage,
          })
        }
      } catch (error) {
        console.error("Error fetching sticky CTA settings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  return { settings, loading }
}
