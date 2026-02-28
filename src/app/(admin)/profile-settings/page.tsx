"use client"

import { useEffect, useState, useCallback } from "react"
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
} from "lucide-react"
import Link from "next/link"
import { ImageCropper } from "@/components/image-cropper"

type Profile = {
  displayName: string
  headline: string | null
  bio: string | null
  email: string | null
  phone: string | null
  linkedinUrl: string | null
  locationBase: string | null
  profilePhotoUrl: string | null
  lastUpdatedAt: string
}

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<Profile>>({})
  
  // Cropper state
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
  const [tempFile, setTempFile] = useState<File | null>(null)

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
      } else {
        const error = await response.json().catch(() => ({ error: "Unknown error" }))
        toast.error(error.error || "Failed to load profile")
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast.error("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = useCallback(async (field?: keyof Profile) => {
    if (!profile) return
    
    try {
      setSaving(true)

      // Build data to save
      const dataToSave: any = {
        displayName: field === "displayName" ? editValues.displayName : profile.displayName,
        headline: field === "headline" ? editValues.headline : profile.headline,
        bio: field === "bio" ? editValues.bio : profile.bio,
        email: field === "email" ? editValues.email : profile.email,
        phone: field === "phone" ? editValues.phone : profile.phone,
        linkedinUrl: field === "linkedinUrl" ? editValues.linkedinUrl : profile.linkedinUrl,
        locationBase: field === "locationBase" ? editValues.locationBase : profile.locationBase,
        profilePhotoUrl: field === "profilePhotoUrl" ? editValues.profilePhotoUrl : profile.profilePhotoUrl,
      }

      console.log("Saving profile:", dataToSave)

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      })

      const responseData = await response.json().catch(() => ({ error: "Invalid response" }))
      console.log("Save response:", response.status, responseData)

      if (!response.ok) {
        throw new Error(responseData.error || `Failed to update profile: ${response.status}`)
      }

      setProfile(responseData)
      setEditingField(null)
      toast.success(`${field || 'Profile'} updated successfully!`)
    } catch (error: any) {
      console.error("Save error:", error)
      toast.error(error.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }, [profile, editValues])

  const handleCancel = useCallback(() => {
    setEditValues(profile || {})
    setEditingField(null)
  }, [profile])

  const handleValueChange = useCallback((field: keyof Profile, value: string) => {
    setEditValues(prev => ({ ...prev, [field]: value }))
  }, [])

  // File select handler - shows cropper
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Create object URL for the cropper
    const objectUrl = URL.createObjectURL(file)
    setCropImageSrc(objectUrl)
    setTempFile(file)
    
    // Reset input
    e.target.value = ""
  }, [])

  // Handle crop complete
  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!profile) return

    try {
      setUploading(true)
      toast.loading("Uploading photo...", { id: "upload" })

      // Create file from blob
      const croppedFile = new File([croppedBlob], tempFile?.name || "profile.jpg", {
        type: "image/jpeg",
      })

      const formData = new FormData()
      formData.append("file", croppedFile)

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({ error: "Upload failed" }))
        throw new Error(errorData.error || `Upload failed: ${uploadResponse.status}`)
      }

      const { url } = await uploadResponse.json()

      // Update profile
      const updateData = {
        displayName: profile.displayName,
        headline: profile.headline,
        bio: profile.bio,
        email: profile.email,
        phone: profile.phone,
        linkedinUrl: profile.linkedinUrl,
        locationBase: profile.locationBase,
        profilePhotoUrl: url,
      }

      const updateResponse = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      const updateResult = await updateResponse.json()

      if (!updateResponse.ok) {
        throw new Error(updateResult.error || "Failed to update profile photo")
      }

      setProfile(updateResult)
      setEditValues(updateResult)
      toast.success("Profile photo updated!", { id: "upload" })
      
      // Close cropper
      handleCropCancel()
    } catch (error: any) {
      console.error("Upload/Update error:", error)
      toast.error(error.message || "Failed to upload photo", { id: "upload" })
    } finally {
      setUploading(false)
    }
  }

  // Handle crop cancel
  const handleCropCancel = () => {
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc)
    }
    setCropImageSrc(null)
    setTempFile(null)
  }

  // Trigger file input click
  const triggerFileInput = useCallback(() => {
    const input = document.getElementById("profile-photo-input") as HTMLInputElement
    if (input) {
      input.click()
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Cropper Modal */}
      {cropImageSrc && (
        <ImageCropper
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

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

      {/* Profile Preview Card */}
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

                {/* Upload Overlay */}
                <div
                  onClick={!uploading ? triggerFileInput : undefined}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {uploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </div>

                {/* HRD Corp Badge */}
                <div className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  HRD Corp
                </div>

                {/* Hidden File Input */}
                <input
                  id="profile-photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
              </div>

              {/* Change Photo Button */}
              <button
                type="button"
                onClick={triggerFileInput}
                disabled={uploading}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors disabled:opacity-50"
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
                      className="bg-white/10 border-white/20 text-white"
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
                      className="bg-white/10 border-white/20 text-white"
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
                      className="bg-white/10 border-white/20 text-white resize-none"
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
            <Award className="w-5 h-5 text-amber-500" />
            Contact Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <EditableField
              field="email"
              label="Email Address"
              value={profile?.email || null}
              type="email"
              placeholder="your@email.com"
              icon={Mail}
              editingField={editingField}
              editValues={editValues}
              saving={saving}
              onStartEdit={setEditingField}
              onSave={handleSave}
              onCancel={handleCancel}
              onChangeValue={handleValueChange}
            />

            {/* Phone */}
            <EditableField
              field="phone"
              label="Phone Number"
              value={profile?.phone || null}
              placeholder="+60 12 345 6789"
              icon={Phone}
              editingField={editingField}
              editValues={editValues}
              saving={saving}
              onStartEdit={setEditingField}
              onSave={handleSave}
              onCancel={handleCancel}
              onChangeValue={handleValueChange}
            />

            {/* Location */}
            <EditableField
              field="locationBase"
              label="Location"
              value={profile?.locationBase || null}
              placeholder="Kuala Lumpur, Malaysia"
              icon={MapPin}
              editingField={editingField}
              editValues={editValues}
              saving={saving}
              onStartEdit={setEditingField}
              onSave={handleSave}
              onCancel={handleCancel}
              onChangeValue={handleValueChange}
            />

            {/* LinkedIn */}
            <EditableField
              field="linkedinUrl"
              label="LinkedIn Profile"
              value={profile?.linkedinUrl || null}
              type="url"
              placeholder="https://linkedin.com/in/yourname"
              icon={Linkedin}
              editingField={editingField}
              editValues={editValues}
              saving={saving}
              onStartEdit={setEditingField}
              onSave={handleSave}
              onCancel={handleCancel}
              onChangeValue={handleValueChange}
            />
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

// Editable Field Component
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
