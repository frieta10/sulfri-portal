"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import toast from "react-hot-toast"
import { Loader2, Save, Settings, Clock, FileText, Type, AlignLeft } from "lucide-react"

interface EventSettings {
  yayasanNoticeText: string
  registrationPageTitle: string
  registrationPageTagline: string
  duplicateCooldownHours: number
}

const defaultSettings: EventSettings = {
  yayasanNoticeText: "",
  registrationPageTitle: "",
  registrationPageTagline: "",
  duplicateCooldownHours: 24,
}

export default function EventSettingsPage() {
  const [settings, setSettings] = useState<EventSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/event/settings")
      if (response.ok) {
        const data = await response.json()
        setSettings({
          yayasanNoticeText: data.yayasanNoticeText || "",
          registrationPageTitle: data.registrationPageTitle || "",
          registrationPageTagline: data.registrationPageTagline || "",
          duplicateCooldownHours: data.duplicateCooldownHours || 24,
        })
      } else {
        toast.error("Failed to load settings")
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast.error("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/api/admin/event/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save settings")
      }

      toast.success("Settings saved successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof EventSettings, value: string | number) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
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
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Event Settings</h1>
        <p className="text-slate-600 mt-1">
          Configure registration page content and registration policies
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* YAYASAN Notice */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              YAYASAN PENERAJU Notice
            </CardTitle>
            <CardDescription>
              Display a notice on the registration page for YAYASAN PENERAJU
              participants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="yayasanNoticeText">Notice Text</Label>
              <Textarea
                id="yayasanNoticeText"
                value={settings.yayasanNoticeText}
                onChange={(e) =>
                  handleChange("yayasanNoticeText", e.target.value)
                }
                placeholder="Enter notice text for YAYASAN PENERAJU participants..."
                rows={4}
              />
              <p className="text-xs text-slate-500">
                This text will be displayed as a notice or banner on the
                registration page
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Registration Page Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="w-5 h-5 text-amber-500" />
              Registration Page Content
            </CardTitle>
            <CardDescription>
              Customize the title and tagline shown on the registration page
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="registrationPageTitle">Page Title</Label>
              <Input
                id="registrationPageTitle"
                value={settings.registrationPageTitle}
                onChange={(e) =>
                  handleChange("registrationPageTitle", e.target.value)
                }
                placeholder="e.g., Register for Training"
              />
              <p className="text-xs text-slate-500">
                The main heading displayed at the top of the registration page
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationPageTagline">Page Tagline</Label>
              <Input
                id="registrationPageTagline"
                value={settings.registrationPageTagline}
                onChange={(e) =>
                  handleChange("registrationPageTagline", e.target.value)
                }
                placeholder="e.g., Join our professional training program"
              />
              <p className="text-xs text-slate-500">
                A brief description shown below the title
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Registration Policy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Registration Policy
            </CardTitle>
            <CardDescription>
              Configure duplicate registration prevention settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="duplicateCooldownHours">
                Duplicate Registration Cooldown (Hours)
              </Label>
              <Input
                id="duplicateCooldownHours"
                type="number"
                min={1}
                max={168}
                value={settings.duplicateCooldownHours}
                onChange={(e) =>
                  handleChange(
                    "duplicateCooldownHours",
                    parseInt(e.target.value) || 24
                  )
                }
              />
              <p className="text-xs text-slate-500">
                Number of hours to prevent duplicate registrations from the same
                email address (1-168 hours). Default: 24 hours.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="bg-slate-900 hover:bg-slate-800"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  )
}
