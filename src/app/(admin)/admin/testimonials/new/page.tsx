"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Loader2, Save, Quote, Star, User, Building, Image, Eye } from "lucide-react"
import toast from "react-hot-toast"

export default function NewTestimonialPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    quote: "",
    authorName: "",
    authorTitle: "",
    authorOrganisation: "",
    photoUrl: "",
    rating: 5,
    visibility: "PUBLIC" as "PUBLIC" | "HIDDEN",
    displayOrder: 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/api/admin/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create testimonial")
      }

      toast.success("Testimonial created successfully!")
      router.push("/admin/testimonials")
    } catch (error: any) {
      toast.error(error.message || "Failed to create testimonial")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Render star rating selector
  const renderStarSelector = () => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleChange("rating", i + 1)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`w-6 h-6 ${i < formData.rating ? "fill-amber-400 text-amber-400" : "text-slate-600"}`}
            />
          </button>
        ))}
        <span className="ml-2 text-slate-400">({formData.rating}/5)</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/testimonials">
          <Button variant="outline" size="icon" className="border-green-500/20 hover:bg-green-500/10">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">New Testimonial</h1>
          <p className="text-slate-400 mt-1">Add a new client testimonial</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quote Section */}
        <Card className="bg-slate-900/50 border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <Quote className="w-5 h-5" />
              Testimonial Content
            </CardTitle>
            <CardDescription className="text-slate-500">
              The main testimonial quote and rating
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quote" className="text-slate-300">
                Quote <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="quote"
                value={formData.quote}
                onChange={(e) => handleChange("quote", e.target.value)}
                placeholder="Enter the testimonial quote..."
                rows={5}
                required
                className="bg-slate-950 border-green-500/20 text-white placeholder:text-slate-600 focus:border-green-500/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating" className="text-slate-300">
                Rating
              </Label>
              {renderStarSelector()}
            </div>
          </CardContent>
        </Card>

        {/* Author Section */}
        <Card className="bg-slate-900/50 border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <User className="w-5 h-5" />
              Author Information
            </CardTitle>
            <CardDescription className="text-slate-500">
              Details about the person giving the testimonial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="authorName" className="text-slate-300">
                Author Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="authorName"
                value={formData.authorName}
                onChange={(e) => handleChange("authorName", e.target.value)}
                placeholder="e.g., John Smith"
                required
                className="bg-slate-950 border-green-500/20 text-white placeholder:text-slate-600 focus:border-green-500/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="authorTitle" className="text-slate-300">
                Title / Position
              </Label>
              <Input
                id="authorTitle"
                value={formData.authorTitle}
                onChange={(e) => handleChange("authorTitle", e.target.value)}
                placeholder="e.g., CEO, Training Manager"
                className="bg-slate-950 border-green-500/20 text-white placeholder:text-slate-600 focus:border-green-500/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="authorOrganisation" className="text-slate-300">
                <span className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Organisation
                </span>
              </Label>
              <Input
                id="authorOrganisation"
                value={formData.authorOrganisation}
                onChange={(e) => handleChange("authorOrganisation", e.target.value)}
                placeholder="e.g., ABC Corporation"
                className="bg-slate-950 border-green-500/20 text-white placeholder:text-slate-600 focus:border-green-500/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photoUrl" className="text-slate-300">
                <span className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Photo URL
                </span>
              </Label>
              <Input
                id="photoUrl"
                type="url"
                value={formData.photoUrl}
                onChange={(e) => handleChange("photoUrl", e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="bg-slate-950 border-green-500/20 text-white placeholder:text-slate-600 focus:border-green-500/50"
              />
              <p className="text-xs text-slate-500">
                URL to the author&apos;s photo (optional)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card className="bg-slate-900/50 border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <Eye className="w-5 h-5" />
              Display Settings
            </CardTitle>
            <CardDescription className="text-slate-500">
              Control visibility and ordering
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="visibility" className="text-slate-300">
                  Visibility
                </Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value: "PUBLIC" | "HIDDEN") => handleChange("visibility", value)}
                >
                  <SelectTrigger className="bg-slate-950 border-green-500/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-green-500/20">
                    <SelectItem value="PUBLIC" className="text-white focus:bg-green-500/20 focus:text-white">
                      Public - Visible on website
                    </SelectItem>
                    <SelectItem value="HIDDEN" className="text-white focus:bg-green-500/20 focus:text-white">
                      Hidden - Not displayed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayOrder" className="text-slate-300">
                  Display Order
                </Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => handleChange("displayOrder", parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="bg-slate-950 border-green-500/20 text-white placeholder:text-slate-600 focus:border-green-500/50"
                />
                <p className="text-xs text-slate-500">
                  Lower numbers appear first
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/admin/testimonials">
            <Button
              type="button"
              variant="outline"
              className="border-green-500/20 text-slate-300 hover:bg-green-500/10 hover:text-white"
            >
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={saving}
            className="bg-green-600 hover:bg-green-500 text-slate-950 font-semibold"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saving ? "Creating..." : "Create Testimonial"}
          </Button>
        </div>
      </form>
    </div>
  )
}
