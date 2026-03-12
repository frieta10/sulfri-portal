"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Save, Globe, MessageCircle, Mail, FileText, BarChart3 } from "lucide-react"
import toast from "react-hot-toast"

interface PortalSettings {
  // SEO Settings
  seoHomepageTitle: string | null
  seoHomepageDescription: string | null
  ogImageUrl: string | null

  // WhatsApp Configuration
  whatsappNumber: string | null
  whatsappPrefillMessage: string | null

  // Sticky CTA
  stickyCtaEnabled: boolean

  // Google Analytics
  ga4MeasurementId: string | null

  // Proposal Settings
  proposalDuplicateCooldownHours: number

  // Follow-up Automation
  followUpTriggerDays: number

  // Email Templates
  emailConfirmationSubject: string | null
  emailConfirmationBody: string | null
  emailFollowupSubject: string | null
  emailFollowupBody: string | null

  // PDF Generation Toggles
  pdfIncludeCertifications: boolean
  pdfIncludeExpertise: boolean
  pdfIncludeClients: boolean
  pdfIncludeExperience: boolean
}

const defaultSettings: PortalSettings = {
  seoHomepageTitle: "MSH Corporate Trainer | Professional Training & Consulting",
  seoHomepageDescription: "",
  ogImageUrl: "",
  whatsappNumber: "",
  whatsappPrefillMessage: "Hi, I'm interested in your training services.",
  stickyCtaEnabled: true,
  ga4MeasurementId: "",
  proposalDuplicateCooldownHours: 48,
  followUpTriggerDays: 3,
  emailConfirmationSubject: "Thank you for your interest",
  emailConfirmationBody: "",
  emailFollowupSubject: "Following up on your training inquiry",
  emailFollowupBody: "",
  pdfIncludeCertifications: true,
  pdfIncludeExpertise: true,
  pdfIncludeClients: true,
  pdfIncludeExperience: true,
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<PortalSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("seo")

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (!response.ok) throw new Error("Failed to fetch settings")
      const data = await response.json()
      setSettings({ ...defaultSettings, ...data })
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast.error("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (!response.ok) throw new Error("Failed to save settings")

      toast.success("Settings saved successfully")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = <K extends keyof PortalSettings>(
    key: K,
    value: PortalSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Portal Settings</h1>
          <p className="text-slate-400 mt-1">
            Configure SEO, WhatsApp, email templates, and more
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-500 hover:bg-green-600 text-slate-900"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="seo" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
            <Globe className="w-4 h-4 mr-2" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
            <Mail className="w-4 h-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="pdf" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
            <BarChart3 className="w-4 h-4 mr-2" />
            GA4
          </TabsTrigger>
        </TabsList>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">SEO Settings</CardTitle>
              <CardDescription className="text-slate-400">
                Configure homepage meta tags and Open Graph settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="seoHomepageTitle" className="text-slate-300">
                  Homepage Title
                </Label>
                <Input
                  id="seoHomepageTitle"
                  value={settings.seoHomepageTitle || ""}
                  onChange={(e) => updateSetting("seoHomepageTitle", e.target.value)}
                  placeholder="MSH Corporate Trainer | Professional Training & Consulting"
                  className="bg-slate-950 border-slate-800 text-white"
                />
                <p className="text-xs text-slate-500">
                  Recommended: 50-60 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoHomepageDescription" className="text-slate-300">
                  Meta Description
                </Label>
                <Textarea
                  id="seoHomepageDescription"
                  value={settings.seoHomepageDescription || ""}
                  onChange={(e) => updateSetting("seoHomepageDescription", e.target.value)}
                  placeholder="Professional corporate training and consulting services..."
                  rows={3}
                  className="bg-slate-950 border-slate-800 text-white resize-none"
                />
                <p className="text-xs text-slate-500">
                  Recommended: 150-160 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ogImageUrl" className="text-slate-300">
                  Open Graph Image URL
                </Label>
                <Input
                  id="ogImageUrl"
                  value={settings.ogImageUrl || ""}
                  onChange={(e) => updateSetting("ogImageUrl", e.target.value)}
                  placeholder="https://example.com/og-image.jpg"
                  className="bg-slate-950 border-slate-800 text-white"
                />
                <p className="text-xs text-slate-500">
                  Recommended size: 1200x630 pixels
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WhatsApp Tab */}
        <TabsContent value="whatsapp" className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">WhatsApp Configuration</CardTitle>
              <CardDescription className="text-slate-400">
                Configure WhatsApp click-to-chat and sticky CTA settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="whatsappNumber" className="text-slate-300">
                  WhatsApp Number
                </Label>
                <Input
                  id="whatsappNumber"
                  value={settings.whatsappNumber || ""}
                  onChange={(e) => updateSetting("whatsappNumber", e.target.value)}
                  placeholder="+60123456789"
                  className="bg-slate-950 border-slate-800 text-white"
                />
                <p className="text-xs text-slate-500">
                  Include country code (e.g., +60 for Malaysia)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsappPrefillMessage" className="text-slate-300">
                  Prefill Message
                </Label>
                <Textarea
                  id="whatsappPrefillMessage"
                  value={settings.whatsappPrefillMessage || ""}
                  onChange={(e) => updateSetting("whatsappPrefillMessage", e.target.value)}
                  placeholder="Hi, I'm interested in your training services."
                  rows={3}
                  className="bg-slate-950 border-slate-800 text-white resize-none"
                />
                <p className="text-xs text-slate-500">
                  Message that appears when users click the WhatsApp button
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div>
                  <Label htmlFor="stickyCtaEnabled" className="text-slate-300 font-medium">
                    Enable Sticky CTA Bar
                  </Label>
                  <p className="text-xs text-slate-500 mt-1">
                    Show floating action buttons on mobile devices
                  </p>
                </div>
                <Switch
                  id="stickyCtaEnabled"
                  checked={settings.stickyCtaEnabled}
                  onCheckedChange={(checked: boolean) => updateSetting("stickyCtaEnabled", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Email Templates</CardTitle>
              <CardDescription className="text-slate-400">
                Configure automated email templates for proposals and follow-ups
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Confirmation Email */}
              <div className="space-y-4 p-4 bg-slate-950 rounded-lg border border-slate-800">
                <h3 className="text-sm font-medium text-slate-300">Confirmation Email</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="emailConfirmationSubject" className="text-slate-400 text-xs">
                    Subject Line
                  </Label>
                  <Input
                    id="emailConfirmationSubject"
                    value={settings.emailConfirmationSubject || ""}
                    onChange={(e) => updateSetting("emailConfirmationSubject", e.target.value)}
                    placeholder="Thank you for your interest"
                    className="bg-slate-900 border-slate-800 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailConfirmationBody" className="text-slate-400 text-xs">
                    Email Body
                  </Label>
                  <Textarea
                    id="emailConfirmationBody"
                    value={settings.emailConfirmationBody || ""}
                    onChange={(e) => updateSetting("emailConfirmationBody", e.target.value)}
                    placeholder="Thank you for submitting your training proposal request..."
                    rows={5}
                    className="bg-slate-900 border-slate-800 text-white resize-none"
                  />
                  <p className="text-xs text-slate-500">
                    Use {'{{name}}'}, {'{{organisation}}'} as placeholders
                  </p>
                </div>
              </div>

              {/* Follow-up Email */}
              <div className="space-y-4 p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-300">Follow-up Email</h3>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="followUpTriggerDays" className="text-slate-400 text-xs">
                      Send after
                    </Label>
                    <Input
                      id="followUpTriggerDays"
                      type="number"
                      min={1}
                      max={30}
                      value={settings.followUpTriggerDays}
                      onChange={(e) => updateSetting("followUpTriggerDays", parseInt(e.target.value) || 3)}
                      className="w-16 bg-slate-900 border-slate-800 text-white text-center"
                    />
                    <span className="text-slate-400 text-xs">days</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emailFollowupSubject" className="text-slate-400 text-xs">
                    Subject Line
                  </Label>
                  <Input
                    id="emailFollowupSubject"
                    value={settings.emailFollowupSubject || ""}
                    onChange={(e) => updateSetting("emailFollowupSubject", e.target.value)}
                    placeholder="Following up on your training inquiry"
                    className="bg-slate-900 border-slate-800 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailFollowupBody" className="text-slate-400 text-xs">
                    Email Body
                  </Label>
                  <Textarea
                    id="emailFollowupBody"
                    value={settings.emailFollowupBody || ""}
                    onChange={(e) => updateSetting("emailFollowupBody", e.target.value)}
                    placeholder="I wanted to follow up on your recent inquiry about our training services..."
                    rows={5}
                    className="bg-slate-900 border-slate-800 text-white resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PDF Tab */}
        <TabsContent value="pdf" className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">PDF Profile Settings</CardTitle>
              <CardDescription className="text-slate-400">
                Configure which sections to include in generated PDF profiles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div>
                  <Label className="text-slate-300 font-medium">Certifications</Label>
                  <p className="text-xs text-slate-500 mt-1">
                    Include badges and credentials section
                  </p>
                </div>
                <Switch
                  checked={settings.pdfIncludeCertifications}
                  onCheckedChange={(checked: boolean) => updateSetting("pdfIncludeCertifications", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div>
                  <Label className="text-slate-300 font-medium">Expertise Tree</Label>
                  <p className="text-xs text-slate-500 mt-1">
                    Include training expertise and skills
                  </p>
                </div>
                <Switch
                  checked={settings.pdfIncludeExpertise}
                  onCheckedChange={(checked: boolean) => updateSetting("pdfIncludeExpertise", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div>
                  <Label className="text-slate-300 font-medium">Client List</Label>
                  <p className="text-xs text-slate-500 mt-1">
                    Include past clients and organizations
                  </p>
                </div>
                <Switch
                  checked={settings.pdfIncludeClients}
                  onCheckedChange={(checked: boolean) => updateSetting("pdfIncludeClients", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div>
                  <Label className="text-slate-300 font-medium">Teaching Experience</Label>
                  <p className="text-xs text-slate-500 mt-1">
                    Include training history and classes
                  </p>
                </div>
                <Switch
                  checked={settings.pdfIncludeExperience}
                  onCheckedChange={(checked: boolean) => updateSetting("pdfIncludeExperience", checked)}
                />
              </div>

              <div className="mt-6 p-4 bg-slate-950 rounded-lg border border-slate-800">
                <Label htmlFor="proposalDuplicateCooldownHours" className="text-slate-300 font-medium">
                  Proposal Cooldown Period
                </Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    id="proposalDuplicateCooldownHours"
                    type="number"
                    min={1}
                    max={168}
                    value={settings.proposalDuplicateCooldownHours}
                    onChange={(e) => updateSetting("proposalDuplicateCooldownHours", parseInt(e.target.value) || 48)}
                    className="w-24 bg-slate-900 border-slate-800 text-white text-center"
                  />
                  <span className="text-slate-400 text-sm">hours</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Minimum time between proposal submissions from the same email
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GA4 Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Google Analytics 4</CardTitle>
              <CardDescription className="text-slate-400">
                Configure GA4 tracking for the portal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ga4MeasurementId" className="text-slate-300">
                  Measurement ID
                </Label>
                <Input
                  id="ga4MeasurementId"
                  value={settings.ga4MeasurementId || ""}
                  onChange={(e) => updateSetting("ga4MeasurementId", e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  className="bg-slate-950 border-slate-800 text-white"
                />
                <p className="text-xs text-slate-500">
                  Your GA4 Measurement ID (starts with G-)
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <h4 className="text-sm font-medium text-slate-300 mb-2">
                  Tracked Events
                </h4>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• PDF downloads (type, source page)</li>
                  <li>• WhatsApp clicks (source)</li>
                  <li>• Proposal form submissions</li>
                  <li>• Sticky CTA interactions</li>
                  <li>• Badge views and clicks</li>
                  <li>• Resource downloads</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
