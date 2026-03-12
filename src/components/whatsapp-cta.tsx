"use client"

import { useEffect, useState } from "react"
import { MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface WhatsAppCTAProps {
  phoneNumber?: string
  prefillMessage?: string
  className?: string
}

export function WhatsAppCTA({ 
  phoneNumber = "",
  prefillMessage = "Hi, I'm interested in your training services.",
  className 
}: WhatsAppCTAProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [settings, setSettings] = useState<{
    whatsappNumber: string | null
    whatsappPrefillMessage: string | null
    stickyCtaEnabled: boolean
  } | null>(null)

  useEffect(() => {
    // Fetch portal settings
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/portal-settings")
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        }
      } catch (error) {
        console.error("Error fetching portal settings:", error)
      }
    }

    fetchSettings()

    // Show button after a short delay for animation effect
    const timer = setTimeout(() => setIsVisible(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  // Track click analytics
  const handleClick = async () => {
    try {
      // Track the click event
      await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "whatsapp_click",
          eventData: { type: "sticky_cta" },
        }),
      })
    } catch (error) {
      console.error("Error tracking WhatsApp click:", error)
    }
  }

  // Determine the phone number to use
  const effectivePhoneNumber = phoneNumber || settings?.whatsappNumber || ""
  const effectiveMessage = prefillMessage || settings?.whatsappPrefillMessage || "Hi, I'm interested in your training services."

  // If no phone number is configured and sticky CTA is disabled, don't render
  if (!effectivePhoneNumber && settings?.stickyCtaEnabled === false) {
    return null
  }

  // Format phone number (remove non-numeric characters)
  const formattedPhone = effectivePhoneNumber.replace(/\D/g, "")

  // Build wa.me URL
  const waMeUrl = formattedPhone 
    ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(effectiveMessage)}`
    : "#"

  return (
    <a
      href={waMeUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105",
        "bg-green-500 text-white hover:bg-green-600",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0",
        className
      )}
      aria-label="Chat on WhatsApp"
    >
      <div className="relative">
        <MessageCircle className="w-6 h-6" fill="currentColor" />
        {/* Pulse animation ring */}
        <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
      </div>
      <span className="font-medium text-sm hidden sm:inline">Chat on WhatsApp</span>
    </a>
  )
}
