"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import toast from "react-hot-toast"
import { 
  Loader2, 
  Download, 
  QrCode, 
  Copy, 
  ExternalLink, 
  Info, 
  Calendar,
  Trash2,
  XCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from "lucide-react"

interface QRCodeData {
  id: string
  name: string
  utmSource: string | null
  eventStartDate: string | null
  eventEndDate: string | null
  status: "ACTIVE" | "EXPIRED" | "CLOSED"
  qrUrl: string
  qrDataUrl: string
  qrSvg: string
  scanCount: number
  createdAt: string
}

export default function QRCodeGeneratorPage() {
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  
  // Form state
  const [name, setName] = useState("")
  const [utmSource, setUtmSource] = useState("")
  const [eventStartDate, setEventStartDate] = useState("")
  const [eventEndDate, setEventEndDate] = useState("")
  
  // Selected QR code for viewing
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null)

  // Fetch QR codes on mount
  useEffect(() => {
    fetchQRCodes()
  }, [])

  const fetchQRCodes = async () => {
    try {
      const response = await fetch("/api/admin/event/qr")
      if (!response.ok) throw new Error("Failed to fetch QR codes")
      const data = await response.json()
      setQrCodes(data.qrCodes)
    } catch (error: any) {
      toast.error(error.message || "Failed to load QR codes")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!name.trim()) {
      toast.error("Event name is required")
      return
    }

    setGenerating(true)
    try {
      const response = await fetch("/api/admin/event/qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          utmSource: utmSource.trim() || undefined,
          eventStartDate: eventStartDate || undefined,
          eventEndDate: eventEndDate || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate QR code")
      }

      const data = await response.json()
      setQrCodes([data.qrCode, ...qrCodes])
      setSelectedQR(data.qrCode)
      
      // Reset form
      setName("")
      setUtmSource("")
      setEventStartDate("")
      setEventEndDate("")
      
      toast.success("QR code created successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to generate QR code")
    } finally {
      setGenerating(false)
    }
  }

  const handleCloseEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/event/qr/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" }),
      })

      if (!response.ok) throw new Error("Failed to close event")

      const data = await response.json()
      setQrCodes(qrCodes.map(qr => qr.id === id ? data.qrCode : qr))
      if (selectedQR?.id === id) {
        setSelectedQR(data.qrCode)
      }
      toast.success("Event closed successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to close event")
    }
  }

  const handleReopenEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/event/qr/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      })

      if (!response.ok) throw new Error("Failed to reopen event")

      const data = await response.json()
      setQrCodes(qrCodes.map(qr => qr.id === id ? data.qrCode : qr))
      if (selectedQR?.id === id) {
        setSelectedQR(data.qrCode)
      }
      toast.success("Event reopened successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to reopen event")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this QR code? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/event/qr/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete QR code")

      setQrCodes(qrCodes.filter(qr => qr.id !== id))
      if (selectedQR?.id === id) {
        setSelectedQR(null)
      }
      toast.success("QR code deleted successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to delete QR code")
    }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success("URL copied to clipboard!")
  }

  const handleDownloadPNG = (qrDataUrl: string, name: string) => {
    const link = document.createElement("a")
    link.href = qrDataUrl
    link.download = `qr-code-${name.toLowerCase().replace(/\s+/g, "-")}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadSVG = (qrSvg: string, name: string) => {
    const blob = new Blob([qrSvg], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `qr-code-${name.toLowerCase().replace(/\s+/g, "-")}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Active
          </Badge>
        )
      case "EXPIRED":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300">
            <AlertCircle className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        )
      case "CLOSED":
        return (
          <Badge className="bg-slate-100 text-slate-800 border-slate-300">
            <XCircle className="w-3 h-3 mr-1" />
            Closed
          </Badge>
        )
      default:
        return null
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set"
    return new Date(dateString).toLocaleDateString("en-MY", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">QR Code Generator</h1>
        <p className="text-slate-600 mt-1">
          Create and manage QR codes for event registration tracking
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Form and List */}
        <div className="space-y-6">
          {/* Create QR Code Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-500" />
                Create New QR Code
              </CardTitle>
              <CardDescription>
                Generate a trackable QR code for your event or campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Event Name */}
              <div>
                <Label htmlFor="name">
                  Event Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., March Career Fair 2024"
                  className="mt-1"
                />
              </div>

              {/* UTM Source */}
              <div>
                <Label htmlFor="utmSource">UTM Source (Optional)</Label>
                <Input
                  id="utmSource"
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  placeholder="e.g., Career Fair 2024"
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  This helps you track where registrations are coming from
                </p>
              </div>

              {/* Event Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Event Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={eventStartDate}
                    onChange={(e) => setEventStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Event End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={eventEndDate}
                    onChange={(e) => setEventEndDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generating || !name.trim()}
                className="bg-slate-900 hover:bg-slate-800 w-full"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <QrCode className="w-4 h-4 mr-2" />
                )}
                {generating ? "Generating..." : "Generate QR Code"}
              </Button>
            </CardContent>
          </Card>

          {/* QR Codes List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Your QR Codes</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchQRCodes}
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </CardTitle>
              <CardDescription>
                {qrCodes.length} QR code{qrCodes.length !== 1 ? "s" : ""} created
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              ) : qrCodes.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <QrCode className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No QR codes created yet</p>
                  <p className="text-sm">Create your first QR code above</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {qrCodes.map((qr) => (
                    <div
                      key={qr.id}
                      onClick={() => setSelectedQR(qr)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedQR?.id === qr.id
                          ? "border-amber-500 bg-amber-50"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-900 truncate">
                            {qr.name}
                          </h4>
                          {qr.utmSource && (
                            <p className="text-xs text-slate-500">
                              UTM: {qr.utmSource}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {formatDate(qr.eventStartDate)} - {formatDate(qr.eventEndDate)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          {getStatusBadge(qr.status)}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200">
                        {qr.status === "ACTIVE" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCloseEvent(qr.id)
                            }}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Close
                          </Button>
                        ) : qr.status === "CLOSED" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReopenEvent(qr.id)
                            }}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Reopen
                          </Button>
                        ) : null}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(qr.id)
                          }}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - QR Code Preview */}
        <div>
          {selectedQR ? (
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>{selectedQR.name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  {getStatusBadge(selectedQR.status)}
                  <span className="text-slate-500">
                    Created {new Date(selectedQR.createdAt).toLocaleDateString()}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* QR Code Image */}
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedQR.qrDataUrl}
                      alt={`QR Code for ${selectedQR.name}`}
                      className="w-64 h-64"
                    />
                  </div>
                </div>

                {/* Event Details */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Event Period:</span>
                    <span className="font-medium">
                      {formatDate(selectedQR.eventStartDate)} - {formatDate(selectedQR.eventEndDate)}
                    </span>
                  </div>
                  {selectedQR.utmSource && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">UTM Source:</span>
                      <span className="font-medium">{selectedQR.utmSource}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Scans:</span>
                    <span className="font-medium">{selectedQR.scanCount}</span>
                  </div>
                </div>

                {/* Landing Page URL */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <Label className="text-slate-700">Landing Page URL</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={selectedQR.qrUrl}
                      readOnly
                      className="bg-white text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopyUrl(selectedQR.qrUrl)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <a
                        href={selectedQR.qrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Download Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => handleDownloadPNG(selectedQR.qrDataUrl, selectedQR.name)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PNG
                  </Button>
                  <Button
                    onClick={() => handleDownloadSVG(selectedQR.qrSvg, selectedQR.name)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download SVG
                  </Button>
                </div>

                {/* Status Actions */}
                {selectedQR.status === "ACTIVE" && (
                  <Button
                    onClick={() => handleCloseEvent(selectedQR.id)}
                    variant="outline"
                    className="w-full text-amber-600 border-amber-300 hover:bg-amber-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Close Event
                  </Button>
                )}
                {selectedQR.status === "CLOSED" && (
                  <Button
                    onClick={() => handleReopenEvent(selectedQR.id)}
                    variant="outline"
                    className="w-full text-green-600 border-green-300 hover:bg-green-50"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Reopen Event
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="sticky top-6">
              <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
                <QrCode className="w-16 h-16 mb-4" />
                <p className="text-center">
                  Select a QR code from the list to view details
                  <br />
                  or create a new one
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Instructions Card */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <Info className="w-5 h-5" />
            How to Use
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-amber-800 list-decimal list-inside">
            <li>
              <strong>Create a QR code</strong> with an event name, optional UTM source,
              and event dates to track where registrations come from
            </li>
            <li>
              <strong>Download the QR code</strong> in your preferred format
              (PNG for print, SVG for scalable graphics)
            </li>
            <li>
              <strong>Add the QR code</strong> to your marketing materials,
              flyers, or presentation slides
            </li>
            <li>
              <strong>Track registrations</strong> in the dashboard to see how
              many people scanned the code and registered
            </li>
            <li>
              <strong>Close the event</strong> when it&apos;s over to disable the QR code,
              or let it expire automatically based on the end date
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
