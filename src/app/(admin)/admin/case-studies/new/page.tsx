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
import { ArrowLeft, Loader2, Save, Building2, BookOpen, Users, Clock, Target, Calendar, Eye } from "lucide-react"
import toast from "react-hot-toast"

export default function NewCaseStudyPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    clientLabel: "",
    trainingTopic: "",
    participantCount: null as number | null,
    durationText: "",
    outcomeSummary: "",
    studyDate: "",
    visibility: "PUBLIC" as "PUBLIC" | "HIDDEN",
    displayOrder: 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/api/admin/case-studies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          studyDate: formData.studyDate ? new Date(formData.studyDate).toISOString() : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create case study")
      }

      toast.success("Case study created successfully!")
      router.push("/admin/case-studies")
    } catch (error: any) {
      toast.error(error.message || "Failed to create case study")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof typeof formData, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/case-studies">
          <Button variant="outline" size="icon" className="border-green-500/20 hover:bg-green-500/10">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">New Case Study</h1>
          <p className="text-slate-400 mt-1">Add a new client success story</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Information */}
        <Card className="bg-slate-900/50 border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <Building2 className="w-5 h-5" />
              Client Information
            </CardTitle>
            <CardDescription className="text-slate-500">
              Details about the client organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientLabel" className="text-slate-300">
                Client Label <span className="text-red-400">*</span>
              </Label>
              <Input
                id="clientLabel"
                value={formData.clientLabel}
                onChange={(e) => handleChange("clientLabel", e.target.value)}
                placeholder="e.g., ABC Corporation, Ministry of Finance"
                required
                className="bg-slate-950 border-green-500/20 text-white placeholder:text-slate-600 focus:border-green-500/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Training Details */}
        <Card className="bg-slate-900/50 border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <BookOpen className="w-5 h-5" />
              Training Details
            </CardTitle>
            <CardDescription className="text-slate-500">
              Information about the training program
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trainingTopic" className="text-slate-300">
                Training Topic <span className="text-red-400">*</span>
              </Label>
              <Input
                id="trainingTopic"
                value={formData.trainingTopic}
                onChange={(e) => handleChange("trainingTopic", e.target.value)}
                placeholder="e.g., Cloud Security Fundamentals"
                required
                className="bg-slate-950 border-green-500/20 text-white placeholder:text-slate-600 focus:border-green-500/50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="participantCount" className="text-slate-300">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Participant Count
                  </span>
                </Label>
                <Input
                  id="participantCount"
                  type="number"
                  value={formData.participantCount ?? ""}
                  onChange={(e) => handleChange("participantCount", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 25"
                  className="bg-slate-950 border-green-500/20 text-white placeholder:text-slate-600 focus:border-green-500/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="durationText" className="text-slate-300">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Duration
                  </span>
                </Label>
                <Input
                  id="durationText"
                  value={formData.durationText}
                  onChange={(e) => handleChange("durationText", e.target.value)}
                  placeholder="e.g., 3 days"
                  className="bg-slate-950 border-green-500/20 text-white placeholder:text-slate-600 focus:border-green-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="studyDate" className="text-slate-300">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Study Date
                </span>
              </Label>
              <Input
                id="studyDate"
                type="date"
                value={formData.studyDate}
                onChange={(e) => handleChange("studyDate", e.target.value)}
                className="bg-slate-950 border-green-500/20 text-white placeholder:text-slate-600 focus:border-green-500/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Outcome */}
        <Card className="bg-slate-900/50 border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <Target className="w-5 h-5" />
              Outcome
            </CardTitle>
            <CardDescription className="text-slate-500">
              Summary of training results and impact
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="outcomeSummary" className="text-slate-300">
                Outcome Summary
              </Label>
              <Textarea
                id="outcomeSummary"
                value={formData.outcomeSummary}
                onChange={(e) => handleChange("outcomeSummary", e.target.value)}
                placeholder="Brief summary of the training outcome (max 200 characters)..."
                rows={3}
                maxLength={200}
                className="bg-slate-950 border-green-500/20 text-white placeholder:text-slate-600 focus:border-green-500/50"
              />
              <p className="text-xs text-slate-500">
                {formData.outcomeSummary.length}/200 characters
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
          <Link href="/admin/case-studies">
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
            {saving ? "Creating..." : "Create Case Study"}
          </Button>
        </div>
      </form>
    </div>
  )
}
