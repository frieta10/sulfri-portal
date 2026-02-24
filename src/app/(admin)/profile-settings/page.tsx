"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import toast from "react-hot-toast"
import {
  Save,
  X,
  Edit3,
  Camera,
  Upload,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Award,
  Briefcase,
  CheckCircle2,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { CredlySetupGuide } from "@/components/credly-badges"

type Profile = {
  displayName: string
  headline: string | null
  bio: string | null
  email: string | null
  phone: string | null
  linkedinUrl: string | null
  locationBase: string | null
  profilePhotoUrl: string | null
  credlyUsername: string | null
  lastUpdatedAt: string
}

interface EditableFieldProps {
  field: keyof Profile
  label: string
  value: string | null
  type?: string
  placeholder?: string
  multiline?: boolean
  icon?: React.ElementType
  editingField: string | null
  editValues: Partial<Profile>
  saving: boolean
  onStartEdit: (field: string) => void
  onSave: (field: keyof Profile) => void
  onCancel: () => void
  onChangeValue: (field: keyof Profile, value: string) => void
}

function EditableField({
  field,
  label,
  value,
  type = "text",
  placeholder,
  multiline = false,
  icon: Icon,
  editingField,
  editValues,
  saving,
  onStartEdit,
  onSave,
  onCancel,
  onChangeValue,
}: EditableFieldProps) {
  const isEditing = editingField === field

  if (isEditing) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">{label}</Label>
        {multiline ? (
          <Textarea
            value={(editValues[field] as string) || ""}
            onChange={(e) => onChangeValue(field, e.target.value)}
            placeholder={placeholder}
            rows={4}
            className="min-h-[120px] resize-none"
          />
        ) : (
          <Input
            type={type}
            value={(editValues[field] as string) || ""}
            onChange={(e) => onChangeValue(field, e.target.value)}
            placeholder={placeholder}
          />
        )}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => onSave(field)}
            disabled={saving}
            className="bg-slate-900 hover:bg-slate-800"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="group">
      <Label className="text-sm font-medium text-slate-500">{label}</Label>
      <div className="flex items-start justify-between gap-4 mt-1">
        <div className="flex items-center gap-3 flex-1">
          {Icon && <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />}
          <p className={`text-slate-900 ${multiline ? "whitespace-pre-wrap" : ""}`}>
            {value || <span className="text-slate-400 italic">Not set</span>}
          </p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onStartEdit(field)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Edit3 className="w-4 h-4 mr-1" />
          Edit
        </Button>
      </div>
    </div>
  )
}

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<Profile>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile")
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setEditValues(data)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast.error("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (field?: keyof Profile) => {
    try {
      setSaving(true)

      const dataToSave = field
        ? { [field]: editValues[field] }
        : editValues

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          ...dataToSave,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update profile")
      }

      const updated = await response.json()
      setProfile(updated)
      setEditingField(null)
      toast.success(`${field ? field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) : 'Profile'} updated successfully!`)
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValues(profile || {})
    setEditingField(null)
  }

  const handleValueChange = (field: keyof Profile, value: string) => {
    setEditValues(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to upload image")
      }

      const { url } = await response.json()

      // Update profile with new photo URL
      const updateResponse = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          profilePhotoUrl: url,
        }),
      })

      if (!updateResponse.ok) throw new Error("Failed to update profile photo")

      const updated = await updateResponse.json()
      setProfile(updated)
      setEditValues(updated)
      toast.success("Profile photo updated successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to upload photo")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  const fieldProps = {
    editingField,
    editValues,
    saving,
    onStartEdit: setEditingField,
    onSave: handleSave,
    onCancel: handleCancel,
    onChangeValue: handleValueChange,
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1>
          <p className="text-slate-600 mt-1">Manage your public profile information</p>
        </div>
        <Link href="/" target="_blank">
          <Button variant="outline" className="rounded-full">
            View Public Profile
          </Button>
        </Link>
      </div>

      {/* Profile Preview Card - Matches Landing Page */}
      <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Profile Photo with Upload */}
            <div className="flex-shrink-0">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white/20 bg-gradient-to-br from-amber-400 to-orange-500">
                  {profile?.profilePhotoUrl ? (
                    <img
                      src={profile.profilePhotoUrl}
                      alt={profile.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">
                        {profile?.displayName?.charAt(0) || "S"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Upload Button Overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {uploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </button>

                {/* HRD Corp Badge */}
                <div className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  HRD Corp
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  title="Upload profile photo"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Upload Button Below */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Change Photo
                  </>
                )}
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-6">
              {/* Display Name */}
              <div>
                {editingField === "displayName" ? (
                  <div className="space-y-2">
                    <Label className="text-white/70">Display Name</Label>
                    <Input
                      value={editValues.displayName || ""}
                      onChange={(e) => handleValueChange("displayName", e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSave("displayName")} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="group">
                    <div className="flex items-center gap-3">
                      <h2 className="text-3xl font-bold">{profile?.displayName}</h2>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingField("displayName")}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-white/70 hover:text-white hover:bg-white/10"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Headline */}
              <div>
                {editingField === "headline" ? (
                  <div className="space-y-2">
                    <Label className="text-white/70">Headline</Label>
                    <Input
                      value={editValues.headline || ""}
                      onChange={(e) => handleValueChange("headline", e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSave("headline")} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="group">
                    <div className="flex items-center gap-3">
                      <p className="text-xl text-white/80">{profile?.headline || "No headline set"}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingField("headline")}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-white/70 hover:text-white hover:bg-white/10"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bio */}
              <div>
                {editingField === "bio" ? (
                  <div className="space-y-2">
                    <Label className="text-white/70">Bio</Label>
                    <Textarea
                      value={editValues.bio || ""}
                      onChange={(e) => handleValueChange("bio", e.target.value)}
                      rows={4}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSave("bio")} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel} disabled={saving}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="group">
                    <div className="flex items-start gap-3">
                      <p className="text-white/70 leading-relaxed flex-1">
                        {profile?.bio || "No bio set. Add a description to tell visitors about yourself."}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingField("bio")}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-white/70 hover:text-white hover:bg-white/10 flex-shrink-0"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Credential Tags */}
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white/90 rounded-full text-sm">
                  <Briefcase className="w-3.5 h-3.5" />
                  Senior Corporate Trainer
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white/90 rounded-full text-sm">
                  <Award className="w-3.5 h-3.5" />
                  HRD Corp: 44523
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Contact Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EditableField
              {...fieldProps}
              field="email"
              label="Email Address"
              value={profile?.email || null}
              type="email"
              placeholder="your@email.com"
              icon={Mail}
            />

            <EditableField
              {...fieldProps}
              field="phone"
              label="Phone Number"
              value={profile?.phone || null}
              placeholder="+60 12 345 6789"
              icon={Phone}
            />

            <EditableField
              {...fieldProps}
              field="locationBase"
              label="Location"
              value={profile?.locationBase || null}
              placeholder="Kuala Lumpur, Malaysia"
              icon={MapPin}
            />

            <EditableField
              {...fieldProps}
              field="linkedinUrl"
              label="LinkedIn Profile"
              value={profile?.linkedinUrl || null}
              type="url"
              placeholder="https://linkedin.com/in/yourname"
              icon={Linkedin}
            />
          </div>
        </CardContent>
      </Card>

      {/* Credly Integration */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-orange-500" />
            Credly Integration
          </h3>

          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <EditableField
                {...fieldProps}
                field="credlyUsername"
                label="Credly Username"
                value={profile?.credlyUsername || null}
                placeholder="your-credly-username"
              />
              <p className="text-xs text-slate-500 mt-2">
                Your username from credly.com/users/<strong>username</strong>/badges
              </p>
            </div>

            <CredlySetupGuide />
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      {profile?.lastUpdatedAt && (
        <p className="text-center text-sm text-slate-400">
          Last updated: {new Date(profile.lastUpdatedAt).toLocaleString()}
        </p>
      )}
    </div>
  )
}
