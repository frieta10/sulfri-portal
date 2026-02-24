"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { profileSchema, type ProfileFormData } from "@/lib/validations/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import toast from "react-hot-toast"
import { Save, Eye } from "lucide-react"
import Link from "next/link"
import { useUnsavedChanges } from "@/lib/hooks/use-unsaved-changes"

export default function ProfileSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  useUnsavedChanges(isDirty)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile")
      if (response.ok) {
        const data = await response.json()
        reset({
          displayName: data.displayName || "",
          headline: data.headline || "",
          bio: data.bio || "",
          email: data.email || "",
          phone: data.phone || "",
          linkedinUrl: data.linkedinUrl || "",
          locationBase: data.locationBase || "",
          profilePhotoUrl: data.profilePhotoUrl || "",
          credlyUsername: data.credlyUsername || "",
        })
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast.error("Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setSaving(true)
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to update profile")
      toast.success("Profile updated successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Loading profile settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">Update your public profile information</p>
        </div>
        <Link href="/" target="_blank">
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            View Public Profile
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Displayed on your public profile page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="displayName">Display Name *</Label>
                <Input id="displayName" {...register("displayName")} placeholder="Your full name" disabled={saving} />
                {errors.displayName && <p className="text-sm text-red-600 mt-1">{errors.displayName.message}</p>}
              </div>
              <div>
                <Label htmlFor="headline">Headline</Label>
                <Input id="headline" {...register("headline")} placeholder="e.g., Professional Trainer & Consultant" disabled={saving} />
              </div>
            </div>
            <div>
              <Label htmlFor="bio">Biography</Label>
              <Textarea id="bio" {...register("bio")} placeholder="Tell people about yourself, your expertise, and experience..." rows={5} disabled={saving} />
            </div>
            <div>
              <Label htmlFor="profilePhotoUrl">Profile Photo URL</Label>
              <Input id="profilePhotoUrl" {...register("profilePhotoUrl")} placeholder="https://example.com/photo.jpg" disabled={saving} />
              {errors.profilePhotoUrl && <p className="text-sm text-red-600 mt-1">{errors.profilePhotoUrl.message}</p>}
              <p className="text-xs text-gray-500 mt-1">Paste a URL to your profile photo.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>How people can reach you. All fields are optional.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Public Email</Label>
                <Input id="email" type="email" {...register("email")} placeholder="contact@example.com" disabled={saving} />
                {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" {...register("phone")} placeholder="+1 (555) 123-4567" disabled={saving} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="locationBase">Location</Label>
                <Input id="locationBase" {...register("locationBase")} placeholder="e.g., Kuala Lumpur, Malaysia" disabled={saving} />
              </div>
              <div>
                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                <Input id="linkedinUrl" {...register("linkedinUrl")} placeholder="https://linkedin.com/in/yourname" disabled={saving} />
                {errors.linkedinUrl && <p className="text-sm text-red-600 mt-1">{errors.linkedinUrl.message}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="credlyUsername">
                Credly Username
                <span className="ml-2 text-xs font-normal text-slate-500">(for displaying verified badges)</span>
              </Label>
              <Input 
                id="credlyUsername" 
                {...register("credlyUsername")} 
                placeholder="e.g., mohd-sulfri (from credly.com/users/your-username/badges)" 
                disabled={saving} 
              />
              <p className="text-xs text-gray-500 mt-1">
                Your Credly username from your public profile URL. Leave empty to hide badges section.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </form>
    </div>
  )
}
