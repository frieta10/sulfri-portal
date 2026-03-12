"use client"

import { useState } from "react"
import { Download, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DownloadProfileCTAProps {
  variant?: "default" | "outline" | "ghost" | "hero" | "inline"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showIcon?: boolean
  label?: string
  pdfType?: "summary" | "full"
  trackAnalytics?: boolean
}

export function DownloadProfileCTA({
  variant = "default",
  size = "default",
  className,
  showIcon = true,
  label = "Download Profile",
  pdfType = "summary",
  trackAnalytics = true,
}: DownloadProfileCTAProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    try {
      setIsDownloading(true)

      // Track analytics event if enabled
      if (trackAnalytics) {
        try {
          await fetch("/api/analytics/track", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              eventType: "pdf_download",
              eventData: { type: pdfType },
              referrerUrl: window.location.href,
            }),
          })
        } catch (error) {
          // Silently fail analytics tracking
          console.error("Failed to track download:", error)
        }
      }

      // Trigger download
      const response = await fetch(`/api/profile/download-pdf?type=${pdfType}`)
      
      if (!response.ok) {
        throw new Error("Failed to download PDF")
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition")
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/) || contentDisposition?.match(/filename=(.+)/)
      const filename = filenameMatch ? filenameMatch[1] : `profile_${pdfType}.html`

      // Create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

    } catch (error) {
      console.error("Error downloading profile:", error)
      // Optionally show error toast here
    } finally {
      setIsDownloading(false)
    }
  }

  // Hero variant - large prominent CTA section
  if (variant === "hero") {
    return (
      <div className={cn("bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-8 lg:p-12", className)}>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-blue-300" />
              <span className="text-blue-200 text-sm font-medium">
                {pdfType === "summary" ? "2-Page Summary" : "Complete Portfolio"}
              </span>
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold text-white mb-2">
              Download Training Profile
            </h3>
            <p className="text-blue-200 max-w-md">
              Get an offline copy of my training credentials, expertise areas, and professional experience.
            </p>
          </div>
          <Button
            size="lg"
            onClick={handleDownload}
            disabled={isDownloading}
            className="bg-white text-blue-900 hover:bg-blue-50 font-semibold px-8 shadow-lg shrink-0"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                {label}
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // Inline variant - text link style
  if (variant === "inline") {
    return (
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={cn(
          "inline-flex items-center gap-2 text-blue-800 font-medium hover:text-blue-900 transition-colors",
          isDownloading && "opacity-70 cursor-not-allowed",
          className
        )}
      >
        {isDownloading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : showIcon ? (
          <Download className="w-4 h-4" />
        ) : null}
        {isDownloading ? "Generating..." : label}
      </button>
    )
  }

  // Standard button variants
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isDownloading}
      className={cn(
        variant === "default" && "bg-blue-900 hover:bg-blue-800",
        className
      )}
    >
      {isDownloading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          {showIcon && <Download className="w-4 h-4 mr-2" />}
          {label}
        </>
      )}
    </Button>
  )
}

// Compact card variant for sidebar or footer
export function DownloadProfileCard({ className }: { className?: string }) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    try {
      setIsDownloading(true)

      // Track analytics
      try {
        await fetch("/api/analytics/track", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventType: "pdf_download",
            eventData: { type: "summary" },
            referrerUrl: window.location.href,
          }),
        })
      } catch {
        // Silently fail
      }

      const response = await fetch(`/api/profile/download-pdf?type=summary`)
      
      if (!response.ok) {
        throw new Error("Failed to download PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "MSH_Trainer_Profile_Summary.html"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

    } catch (error) {
      console.error("Error downloading profile:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className={cn("bg-gray-50 border border-gray-200 rounded-xl p-6", className)}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
          <FileText className="w-6 h-6 text-blue-800" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">
            Training Profile
          </h4>
          <p className="text-sm text-gray-500 mb-4">
            Download a summary of my training credentials and experience.
          </p>
          <Button
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full bg-blue-900 hover:bg-blue-800"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DownloadProfileCTA
