"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import toast from "react-hot-toast"
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Award,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  Code,
  Sparkles,
  Wand2,
  CheckCircle,
  AlertCircle,
  Upload,
} from "lucide-react"
import Link from "next/link"
import { extractCredlyEmbedData } from "@/lib/validations/badge"

interface Skill {
  id: string
  name: string
  slug: string
}

interface BadgeItem {
  id: string
  title: string
  slug: string
  description: string | null
  issuer: string
  issueDate: string | null
  expiryDate: string | null
  credlyBadgeId: string
  credlyHost: string
  iframeWidth: number
  iframeHeight: number
  verificationUrl: string | null
  featured: boolean
  visibility: "PUBLIC" | "HIDDEN"
  displayOrder: number
  fallbackImageUrl: string | null
  embedCode: string | null
  autoSyncEnabled: boolean
  lastSyncedAt: string | null
  createdAt: string
  skills: Skill[]
}

export default function BadgesManagementPage() {
  const [badges, setBadges] = useState<BadgeItem[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBadge, setEditingBadge] = useState<BadgeItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"manual" | "embed" | "ob3" | "sync">("manual")

  // Embed code input for batch import
  const [embedCodeInput, setEmbedCodeInput] = useState("")
  const [extractingEmbed, setExtractingEmbed] = useState(false)

  // OB3 import
  const [ob3InputMethod, setOb3InputMethod] = useState<"image" | "json">("image")
  const [ob3Content, setOb3Content] = useState("")
  const [validatingOB3, setValidatingOB3] = useState(false)
  const [ob3Valid, setOb3Valid] = useState<boolean | null>(null)
  const [ob3BadgeCount, setOb3BadgeCount] = useState(0)
  const [importingOB3, setImportingOB3] = useState(false)
  const [ob3ImageFile, setOb3ImageFile] = useState<File | null>(null)
  const [uploadingOB3Image, setUploadingOB3Image] = useState(false)
  const [ob3ImageDiag, setOb3ImageDiag] = useState<{
    error?: string
    details?: string
    chunks?: { type: string; keyword: string; preview: string; length?: number }[]
    isPNG?: boolean
    credentialFound?: boolean
    textChunksFound?: number
    credentialPreview?: string
  } | null>(null)
  const [checkingOB3Image, setCheckingOB3Image] = useState(false)

  // Sync configuration
  const [credlyUserId, setCredlyUserId] = useState("")
  const [syncing, setSyncing] = useState(false)
  const [syncLogs, setSyncLogs] = useState<any[]>([])
  const [apiUnavailable, setApiUnavailable] = useState(false)
  
  // OAuth state
  const [oauthConnected, setOauthConnected] = useState(false)
  const [oauthUsername, setOauthUsername] = useState<string | null>(null)
  const [connectingOAuth, setConnectingOAuth] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    issuer: "",
    issueDate: "",
    expiryDate: "",
    credlyBadgeId: "",
    credlyHost: "https://www.credly.com",
    iframeWidth: 150,
    iframeHeight: 270,
    verificationUrl: "",
    featured: false,
    visibility: "PUBLIC" as "PUBLIC" | "HIDDEN",
    displayOrder: 0,
    fallbackImageUrl: "",
    embedCode: "",
    skillIds: [] as string[],
  })

  useEffect(() => {
    fetchBadges()
    fetchSkills()
    fetchSyncStatus()
    checkOAuthStatus()
    
    // Check for OAuth callback params
    const urlParams = new URLSearchParams(window.location.search)
    const oauthSuccess = urlParams.get('oauth_success')
    const oauthError = urlParams.get('oauth_error')
    const username = urlParams.get('username')
    
    if (oauthSuccess) {
      toast.success(`Connected to Credly as ${username || 'user'}!`)
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname)
      checkOAuthStatus()
    } else if (oauthError) {
      toast.error(`OAuth failed: ${oauthError}`)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const fetchBadges = async () => {
    try {
      const response = await fetch("/api/admin/badges")
      if (response.ok) {
        const data = await response.json()
        setBadges(data)
      } else {
        toast.error("Failed to load badges")
      }
    } catch (error) {
      console.error("Error fetching badges:", error)
      toast.error("Failed to load badges")
    } finally {
      setLoading(false)
    }
  }

  const fetchSkills = async () => {
    try {
      const response = await fetch("/api/admin/skills")
      if (response.ok) {
        const data = await response.json()
        setSkills(data)
      }
    } catch (error) {
      console.error("Error fetching skills:", error)
    }
  }

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch("/api/admin/badges/sync")
      if (response.ok) {
        const data = await response.json()
        if (data.config?.credlyUserId) {
          setCredlyUserId(data.config.credlyUserId)
        }
        setSyncLogs(data.logs || [])
      }
    } catch (error) {
      console.error("Error fetching sync status:", error)
    }
  }

  const checkOAuthStatus = async () => {
    try {
      const response = await fetch("/api/admin/badges/oauth-status")
      if (response.ok) {
        const data = await response.json()
        setOauthConnected(data.connected)
        setOauthUsername(data.username)
      }
    } catch (error) {
      console.error("Error checking OAuth status:", error)
    }
  }

  const handleConnectOAuth = async () => {
    setConnectingOAuth(true)
    try {
      const response = await fetch("/api/credly/oauth")
      const data = await response.json()
      
      if (response.ok && data.authUrl) {
        // Redirect to Credly OAuth page
        window.location.href = data.authUrl
      } else {
        toast.error(data.error || "Failed to initiate OAuth connection")
        if (data.message) {
          toast.error(data.message)
        }
      }
    } catch (error) {
      toast.error("Failed to connect to Credly")
    } finally {
      setConnectingOAuth(false)
    }
  }

  const handleDisconnectOAuth = async () => {
    if (!confirm("Disconnect from Credly? This will stop automatic syncing.")) return
    
    try {
      const response = await fetch("/api/admin/badges/oauth-disconnect", { method: "POST" })
      if (response.ok) {
        toast.success("Disconnected from Credly")
        setOauthConnected(false)
        setOauthUsername(null)
      } else {
        toast.error("Failed to disconnect")
      }
    } catch (error) {
      toast.error("Failed to disconnect from Credly")
    }
  }

  const handleOB3Validation = async () => {
    if (!ob3Content.trim()) {
      toast.error("Please paste OB3 JSON content")
      return
    }

    setValidatingOB3(true)
    try {
      const response = await fetch("/api/admin/badges/import-ob3", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonContent: ob3Content }),
      })

      const data = await response.json()

      if (response.ok) {
        setOb3Valid(data.valid)
        setOb3BadgeCount(data.badgeCount)
        if (data.valid) {
          toast.success(`Valid OB3 file! Found ${data.badgeCount} badge(s)`)
        } else {
          toast.error("Invalid OB3 format")
        }
      } else {
        toast.error(data.error || "Validation failed")
      }
    } catch (error: any) {
      toast.error(error.message || "Validation failed")
    } finally {
      setValidatingOB3(false)
    }
  }

  const handleOB3Import = async () => {
    if (!ob3Content.trim()) {
      toast.error("Please paste OB3 JSON content")
      return
    }

    setImportingOB3(true)
    try {
      const response = await fetch("/api/admin/badges/import-ob3", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          jsonContent: ob3Content,
          autoCreateSkills: true 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Import failed")
      }

      if (data.results.imported > 0) {
        toast.success(
          `Import complete! ${data.results.imported} imported, ${data.results.skipped} skipped`
        )
      } else if (data.results.skipped > 0) {
        const reason = data.results.errors?.length
          ? data.results.errors[0]
          : "badges may already exist"
        toast.error(`Nothing imported — ${data.results.skipped} skipped (${reason})`)
      } else {
        toast.error("Nothing imported")
      }

      setOb3Content("")
      setOb3Valid(null)
      setOb3BadgeCount(0)
      fetchBadges()
      fetchSkills()
    } catch (error: any) {
      toast.error(error.message || "Import failed")
    } finally {
      setImportingOB3(false)
    }
  }

  const handleOB3ImageCheck = async () => {
    if (!ob3ImageFile) {
      toast.error("Please select an image file")
      return
    }

    setCheckingOB3Image(true)
    setOb3ImageDiag(null)
    try {
      const fd = new FormData()
      fd.append("image", ob3ImageFile)

      const response = await fetch("/api/admin/badges/import-ob3-image", {
        method: "PUT",
        body: fd,
      })

      const data = await response.json()
      setOb3ImageDiag(data)
    } catch (error: any) {
      setOb3ImageDiag({ error: error.message || "Check failed" })
    } finally {
      setCheckingOB3Image(false)
    }
  }

  const handleOB3ImageImport = async () => {
    if (!ob3ImageFile) {
      toast.error("Please select an image file")
      return
    }

    setUploadingOB3Image(true)
    setOb3ImageDiag(null)
    try {
      const fd = new FormData()
      fd.append("image", ob3ImageFile)
      fd.append("autoCreateSkills", "true")

      const response = await fetch("/api/admin/badges/import-ob3-image", {
        method: "POST",
        body: fd,
      })

      const data = await response.json()

      if (!response.ok) {
        // Store diagnostic info inline so user can see the full details
        setOb3ImageDiag({ error: data.error, details: data.details, chunks: data.chunks })
        throw new Error(data.error || "Import failed")
      }

      if (data.results.imported > 0) {
        toast.success(
          `Import complete! ${data.results.imported} imported, ${data.results.skipped} skipped`
        )
        setOb3ImageFile(null)
        fetchBadges()
        fetchSkills()
      } else if (data.results.skipped > 0) {
        const reason = data.results.errors?.length
          ? data.results.errors[0]
          : "badge may already exist"
        toast.error(`Nothing imported — ${data.results.skipped} skipped (${reason})`)
      } else if (data.results.errors?.length > 0) {
        // Exception was caught during import — surface the actual error
        setOb3ImageDiag({ error: "Import error", details: data.results.errors[0] })
        toast.error(`Import error: ${data.results.errors[0]}`)
      } else {
        toast.error("No credential found in this image")
      }
    } catch (error: any) {
      toast.error(error.message || "Import failed")
    } finally {
      setUploadingOB3Image(false)
    }
  }

  const handleExtractEmbed = async () => {
    if (!embedCodeInput.trim()) {
      toast.error("Please paste an embed code")
      return
    }

    setExtractingEmbed(true)
    try {
      const embedData = extractCredlyEmbedData(embedCodeInput)
      
      setFormData({
        ...formData,
        credlyBadgeId: embedData.badgeId,
        credlyHost: embedData.host,
        iframeWidth: embedData.width,
        iframeHeight: embedData.height,
        embedCode: embedCodeInput,
        verificationUrl: `https://www.credly.com/badges/${embedData.badgeId}/public_url`,
      })

      toast.success("Embed code extracted successfully!")
      setActiveTab("manual")
    } catch (error: any) {
      toast.error(error.message || "Failed to extract embed code")
    } finally {
      setExtractingEmbed(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = "/api/admin/badges"
      const method = editingBadge ? "PUT" : "POST"
      const body = editingBadge 
        ? { ...formData, id: editingBadge.id }
        : formData

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save badge")
      }

      toast.success(editingBadge ? "Badge updated!" : "Badge created!")
      resetForm()
      fetchBadges()
    } catch (error: any) {
      toast.error(error.message || "Failed to save badge")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this badge?")) return

    try {
      const response = await fetch(`/api/admin/badges/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete badge")

      toast.success("Badge deleted!")
      fetchBadges()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete badge")
    }
  }

  const handleEdit = (badge: BadgeItem) => {
    setEditingBadge(badge)
    setFormData({
      title: badge.title,
      slug: badge.slug,
      description: badge.description || "",
      issuer: badge.issuer,
      issueDate: badge.issueDate ? new Date(badge.issueDate).toISOString().split("T")[0] : "",
      expiryDate: badge.expiryDate ? new Date(badge.expiryDate).toISOString().split("T")[0] : "",
      credlyBadgeId: badge.credlyBadgeId,
      credlyHost: badge.credlyHost,
      iframeWidth: badge.iframeWidth,
      iframeHeight: badge.iframeHeight,
      verificationUrl: badge.verificationUrl || "",
      featured: badge.featured,
      visibility: badge.visibility,
      displayOrder: badge.displayOrder,
      fallbackImageUrl: badge.fallbackImageUrl || "",
      embedCode: badge.embedCode || "",
      skillIds: badge.skills?.map(s => s.id) || [],
    })
    setShowForm(true)
    setActiveTab("manual")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingBadge(null)
    setFormData({
      title: "",
      slug: "",
      description: "",
      issuer: "",
      issueDate: "",
      expiryDate: "",
      credlyBadgeId: "",
      credlyHost: "https://www.credly.com",
      iframeWidth: 150,
      iframeHeight: 270,
      verificationUrl: "",
      featured: false,
      visibility: "PUBLIC",
      displayOrder: 0,
      fallbackImageUrl: "",
      embedCode: "",
      skillIds: [],
    })
    setEmbedCodeInput("")
  }

  const handleSync = async () => {
    if (!credlyUserId.trim()) {
      toast.error("Please enter a Credly User ID")
      return
    }

    setSyncing(true)
    setApiUnavailable(false)
    
    try {
      const response = await fetch("/api/admin/badges/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credlyUserId: credlyUserId.trim(),
          syncInterval: "MANUAL",
          autoCreateSkills: true,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle 401 - API now requires authentication
        if (response.status === 401) {
          setApiUnavailable(true)
          throw new Error(data.error || "Credly API requires authentication")
        }
        throw new Error(data.error || "Sync failed")
      }

      // Show appropriate success message based on method used
      if (data.method === "fallback") {
        toast.success(`Sync complete via fallback! ${data.results.created} created, ${data.results.updated} updated`)
      } else {
        toast.success(`Sync complete! ${data.results.created} created, ${data.results.updated} updated`)
      }
      
      fetchBadges()
      fetchSkills()
      fetchSyncStatus()
    } catch (error: any) {
      toast.error(error.message || "Sync failed")
    } finally {
      setSyncing(false)
    }
  }

  const handleSyncOAuth = async () => {
    if (!oauthConnected) {
      toast.error("Please connect your Credly account first")
      return
    }

    setSyncing(true)
    
    try {
      const response = await fetch("/api/admin/badges/sync-oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autoCreateSkills: true,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.action === "reconnect_oauth") {
          setOauthConnected(false)
          toast.error("Session expired. Please reconnect your Credly account.")
        } else {
          throw new Error(data.error || "OAuth sync failed")
        }
        return
      }

      toast.success(`OAuth Sync complete! ${data.results.created} created, ${data.results.updated} updated`)
      fetchBadges()
      fetchSkills()
    } catch (error: any) {
      toast.error(error.message || "OAuth sync failed")
    } finally {
      setSyncing(false)
    }
  }

  const toggleSkill = (skillId: string) => {
    setFormData(prev => ({
      ...prev,
      skillIds: prev.skillIds.includes(skillId)
        ? prev.skillIds.filter(id => id !== skillId)
        : [...prev.skillIds, skillId],
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Badge Wallet</h1>
          <p className="text-slate-600 mt-1">
            Manage your Credly badges and certifications
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/badge-mappings">
            <Button variant="outline">
              Link to Expertise
            </Button>
          </Link>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-slate-900 hover:bg-slate-800"
          >
            {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {showForm ? "Cancel" : "Add Badge"}
          </Button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingBadge ? "Edit Badge" : "Add New Badge"}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Tabs */}
            {!editingBadge && (
              <div className="flex gap-2 mb-6">
                <Button
                  type="button"
                  variant={activeTab === "manual" ? "default" : "outline"}
                  onClick={() => setActiveTab("manual")}
                  className={activeTab === "manual" ? "bg-slate-900" : ""}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Manual
                </Button>
                <Button
                  type="button"
                  variant={activeTab === "embed" ? "default" : "outline"}
                  onClick={() => setActiveTab("embed")}
                  className={activeTab === "embed" ? "bg-slate-900" : ""}
                >
                  <Code className="w-4 h-4 mr-2" />
                  From Embed Code
                </Button>
                <Button
                  type="button"
                  variant={activeTab === "ob3" ? "default" : "outline"}
                  onClick={() => setActiveTab("ob3")}
                  className={activeTab === "ob3" ? "bg-slate-900" : ""}
                >
                  <Award className="w-4 h-4 mr-2" />
                  Import OB3
                </Button>
              </div>
            )}

            {/* Embed Code Tab */}
            {activeTab === "embed" && !editingBadge && (
              <div className="space-y-4 mb-6">
                <div>
                  <Label>Paste Credly Embed Code</Label>
                  <Textarea
                    value={embedCodeInput}
                    onChange={(e) => setEmbedCodeInput(e.target.value)}
                    placeholder='<div data-iframe-width="150" data-iframe-height="270" data-share-badge-id="..." data-share-badge-host="https://www.credly.com"></div><script type="text/javascript" async src="//cdn.credly.com/assets/utilities/embed.js"></script>'
                    rows={4}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Copy the embed code from your Credly badge page
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleExtractEmbed}
                  disabled={extractingEmbed}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                >
                  {extractingEmbed ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Wand2 className="w-4 h-4 mr-2" />
                  )}
                  Extract Data
                </Button>
              </div>
            )}

            {/* Open Badges 3.0 Import Tab */}
            {activeTab === "ob3" && !editingBadge && (
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Import from Open Badges 3.0
                  </h4>
                  <p className="text-sm text-blue-700">
                    Import your Credly badges using a downloaded badge PNG image (recommended) or exported OB3 JSON.
                    No OAuth setup required.
                  </p>
                </div>

                {/* Sub-tab selector */}
                <div className="flex gap-2 border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => setOb3InputMethod("image")}
                    className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                      ob3InputMethod === "image"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Upload className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                    Upload Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setOb3InputMethod("json")}
                    className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
                      ob3InputMethod === "json"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    Paste JSON
                  </button>
                </div>

                {/* Image upload mode */}
                {ob3InputMethod === "image" && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <Label>Badge PNG Image</Label>
                      <Input
                        type="file"
                        accept=".png,image/png"
                        className="mt-1"
                        onChange={(e) => {
                          setOb3ImageFile(e.target.files?.[0] ?? null)
                          setOb3ImageDiag(null)
                        }}
                      />
                      {ob3ImageFile && (
                        <p className="text-xs text-slate-500 mt-1">Selected: {ob3ImageFile.name}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        Upload a Credly badge PNG downloaded with the &quot;Open Badges&quot; option —
                        the credential is embedded inside the image.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleOB3ImageCheck}
                        disabled={checkingOB3Image || !ob3ImageFile}
                      >
                        {checkingOB3Image ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Check Image
                      </Button>
                      <Button
                        type="button"
                        onClick={handleOB3ImageImport}
                        disabled={uploadingOB3Image || !ob3ImageFile}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                      >
                        {uploadingOB3Image ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        Import from Image
                      </Button>
                    </div>

                    {/* Inline diagnostic panel */}
                    {ob3ImageDiag && (
                      <div className={`p-3 rounded-lg text-sm border ${
                        ob3ImageDiag.credentialFound
                          ? "bg-green-50 border-green-200 text-green-800"
                          : "bg-red-50 border-red-200 text-red-800"
                      }`}>
                        {ob3ImageDiag.credentialFound ? (
                          <div className="flex items-center gap-2 font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Credential found! Ready to import.
                            {ob3ImageDiag.credentialPreview && (
                              <span className="font-mono text-xs font-normal ml-2 truncate max-w-xs">{ob3ImageDiag.credentialPreview}</span>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-start gap-2 font-medium">
                              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>{ob3ImageDiag.error || "No credential found"}</span>
                            </div>
                            {ob3ImageDiag.details && (
                              <p className="text-xs ml-6">{ob3ImageDiag.details}</p>
                            )}
                            {ob3ImageDiag.isPNG === false && (
                              <p className="text-xs ml-6">File does not appear to be a valid PNG.</p>
                            )}
                            {ob3ImageDiag.isPNG === true && ob3ImageDiag.textChunksFound === 0 && (
                              <p className="text-xs ml-6">
                                This PNG has no text metadata — it is likely a plain image download, not an Open Badges baked PNG.
                                On Credly, use <strong>Download → Open Badges</strong> (not &quot;Download PNG&quot;).
                              </p>
                            )}
                            {ob3ImageDiag.chunks && ob3ImageDiag.chunks.length > 0 && (
                              <div className="ml-6 mt-2">
                                <p className="text-xs font-medium mb-1">Text chunks found:</p>
                                {ob3ImageDiag.chunks.map((c, i) => (
                                  <div key={i} className="text-xs font-mono bg-white bg-opacity-60 rounded p-1 mb-1 break-all">
                                    <span className="font-bold">{c.type}[{c.keyword}]</span>
                                    {c.length != null && <span className="text-slate-500"> ({c.length} chars)</span>}:{" "}
                                    {c.preview}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-sm text-slate-500">
                      <p className="font-medium">How to download the badge image from Credly:</p>
                      <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Go to your Credly profile</li>
                        <li>Click on a badge to open it</li>
                        <li>Click &quot;Download&quot; and choose &quot;Open Badges&quot; (PNG with embedded credential)</li>
                        <li>Upload that PNG file here</li>
                      </ol>
                    </div>
                  </div>
                )}

                {/* JSON paste mode */}
                {ob3InputMethod === "json" && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <Label>Paste OB3 JSON Content</Label>
                      <Textarea
                        value={ob3Content}
                        onChange={(e) => {
                          setOb3Content(e.target.value)
                          setOb3Valid(null)
                        }}
                        placeholder={`{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "type": ["VerifiableCredential"],
  "issuer": { "name": "Credly" },
  "credentialSubject": {
    "achievement": {
      "name": "Badge Name",
      "description": "Badge description"
    }
  }
}`}
                        rows={8}
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Paste the complete JSON content from your OB3 export file
                      </p>
                    </div>

                    {ob3Valid !== null && (
                      <div className={`p-3 rounded-lg ${ob3Valid ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                        {ob3Valid ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            <span>Valid OB3 format! Found {ob3BadgeCount} badge(s)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            <span>Invalid OB3 format. Please check your JSON.</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleOB3Validation}
                        disabled={validatingOB3 || !ob3Content.trim()}
                      >
                        {validatingOB3 ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        Validate
                      </Button>
                      <Button
                        type="button"
                        onClick={handleOB3Import}
                        disabled={importingOB3 || !ob3Valid || ob3BadgeCount === 0}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                      >
                        {importingOB3 ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Award className="w-4 h-4 mr-2" />
                        )}
                        Import Badges
                      </Button>
                    </div>

                    <div className="text-sm text-slate-500">
                      <p className="font-medium">How to export from Credly:</p>
                      <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Go to your Credly profile</li>
                        <li>Click on a badge</li>
                        <li>Look for &quot;Download&quot; or &quot;Export&quot; option</li>
                        <li>Select &quot;Open Badges 3.0&quot; format</li>
                        <li>Copy the JSON content and paste above</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Manual Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Badge Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., AWS Certified Solutions Architect"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="aws-certified-solutions-architect"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="issuer">Issuer *</Label>
                  <Input
                    id="issuer"
                    value={formData.issuer}
                    onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                    placeholder="e.g., Amazon Web Services"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="credlyBadgeId">Credly Badge ID *</Label>
                  <Input
                    id="credlyBadgeId"
                    value={formData.credlyBadgeId}
                    onChange={(e) => setFormData({ ...formData, credlyBadgeId: e.target.value })}
                    placeholder="e.g., abc123-def456"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this certification..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fallbackImageUrl">Fallback Image URL</Label>
                  <Input
                    id="fallbackImageUrl"
                    type="url"
                    value={formData.fallbackImageUrl}
                    onChange={(e) => setFormData({ ...formData, fallbackImageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label htmlFor="verificationUrl">Verification URL</Label>
                  <Input
                    id="verificationUrl"
                    type="url"
                    value={formData.verificationUrl}
                    onChange={(e) => setFormData({ ...formData, verificationUrl: e.target.value })}
                    placeholder="https://www.credly.com/badges/..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="iframeWidth">Iframe Width</Label>
                  <Input
                    id="iframeWidth"
                    type="number"
                    value={formData.iframeWidth}
                    onChange={(e) => setFormData({ ...formData, iframeWidth: parseInt(e.target.value) || 150 })}
                  />
                </div>
                <div>
                  <Label htmlFor="iframeHeight">Iframe Height</Label>
                  <Input
                    id="iframeHeight"
                    type="number"
                    value={formData.iframeHeight}
                    onChange={(e) => setFormData({ ...formData, iframeHeight: parseInt(e.target.value) || 270 })}
                  />
                </div>
                <div>
                  <Label htmlFor="visibility">Visibility</Label>
                  <select
                    id="visibility"
                    title="Visibility"
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value as "PUBLIC" | "HIDDEN" })}
                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="HIDDEN">Hidden</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="featured"
                    title="Featured"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="featured" className="mb-0">Featured</Label>
                </div>
              </div>

              {/* Skills Selection */}
              <div>
                <Label>Associated Skills</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((skill) => (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => toggleSkill(skill.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        formData.skillIds.includes(skill.id)
                          ? "bg-amber-500 text-slate-900"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {formData.skillIds.includes(skill.id) && (
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                      )}
                      {skill.name}
                    </button>
                  ))}
                  {skills.length === 0 && (
                    <p className="text-sm text-slate-400">
                      No skills available. <Link href="/admin/skills" className="text-amber-600 hover:underline">Create skills first</Link>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={saving} className="bg-slate-900">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {saving ? "Saving..." : (editingBadge ? "Update Badge" : "Create Badge")}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* OAuth Connection Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            Connect with Credly
          </CardTitle>
        </CardHeader>
        <CardContent>
          {oauthConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-800">
                    Connected to Credly
                  </p>
                  {oauthUsername && (
                    <p className="text-sm text-green-700">
                      Username: {oauthUsername}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleSyncOAuth}
                  disabled={syncing}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                >
                  {syncing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Sync Badges via OAuth
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDisconnectOAuth}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-600">
                Connect your Credly account to automatically sync badges using OAuth authentication. 
                This provides reliable access to your Credly data.
              </p>
              
              <Button
                onClick={handleConnectOAuth}
                disabled={connectingOAuth}
                className="bg-[#0073b1] hover:bg-[#005a8e] text-white"
              >
                {connectingOAuth ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-2" />
                )}
                Connect with Credly
              </Button>
              
              <p className="text-xs text-slate-400">
                You&apos;ll be redirected to Credly to authorize this application.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legacy Auto Sync Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-600">
            <RefreshCw className="w-5 h-5" />
            Legacy Sync (Public API)
            <Badge variant="secondary" className="text-xs">Deprecated</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* API Unavailable Warning */}
          {apiUnavailable && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Credly Public API Unavailable
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Credly has restricted public API access. Please use <strong>Connect with Credly</strong> above or the <strong>Manual</strong> / <strong>From Embed Code</strong> tabs instead.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="credlyUserId">Credly User ID</Label>
              <Input
                id="credlyUserId"
                value={credlyUserId}
                onChange={(e) => setCredlyUserId(e.target.value)}
                placeholder="e.g., mohd-sulfri"
                disabled={apiUnavailable}
              />
              <p className="text-xs text-slate-500 mt-1">
                Legacy method - may not work due to API restrictions
              </p>
            </div>
            <Button
              onClick={handleSync}
              disabled={syncing || apiUnavailable}
              variant="outline"
            >
              {syncing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Try Sync
            </Button>
          </div>

          {/* Sync Logs */}
          {syncLogs.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Recent Sync Activity</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {syncLogs.slice(0, 5).map((log, index) => (
                  <div
                    key={index}
                    className={`text-sm p-2 rounded flex items-start gap-2 ${
                      log.status === "success" ? "bg-green-50 text-green-700" :
                      log.status === "error" ? "bg-red-50 text-red-700" :
                      "bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    {log.status === "success" ? (
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    ) : log.status === "error" ? (
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <span className="font-medium">{new Date(log.timestamp).toLocaleString()}</span>
                      <p>{log.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Badge List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {badges.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No badges added yet.</p>
              <Button onClick={() => setShowForm(true)} className="mt-4" variant="outline">
                Add Your First Badge
              </Button>
            </CardContent>
          </Card>
        ) : (
          badges.map((badge) => (
            <Card key={badge.id} className={badge.visibility === "HIDDEN" ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden">
                    {badge.fallbackImageUrl ? (
                      <img
                        src={badge.fallbackImageUrl}
                        alt={badge.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Award className="w-full h-full p-4 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-slate-900 truncate">{badge.title}</h3>
                        <p className="text-sm text-slate-500">{badge.issuer}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(badge)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(badge.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {badge.featured && (
                        <Badge className="bg-amber-500 text-slate-900">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {badge.visibility === "HIDDEN" && (
                        <Badge variant="outline" className="text-slate-400">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Hidden
                        </Badge>
                      )}
                      {badge.autoSyncEnabled && (
                        <Badge variant="outline" className="text-blue-500">
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Auto-Sync
                        </Badge>
                      )}
                    </div>

                    {badge.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {badge.skills.slice(0, 3).map((skill) => (
                          <span key={skill.id} className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {skill.name}
                          </span>
                        ))}
                        {badge.skills.length > 3 && (
                          <span className="text-xs text-slate-400">+{badge.skills.length - 3}</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                      <span>Order: {badge.displayOrder}</span>
                      {badge.issueDate && (
                        <>
                          <span>•</span>
                          <span>{new Date(badge.issueDate).toLocaleDateString()}</span>
                        </>
                      )}
                      {badge.verificationUrl && (
                        <>
                          <span>•</span>
                          <a
                            href={badge.verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Verify <ExternalLink className="w-3 h-3" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
