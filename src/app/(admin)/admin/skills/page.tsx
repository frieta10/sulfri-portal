"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import toast from "react-hot-toast"
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Loader2,
  Tag,
  Eye,
  EyeOff,
  Award,
} from "lucide-react"
import Link from "next/link"

interface Skill {
  id: string
  name: string
  slug: string
  description: string | null
  visibility: "PUBLIC" | "HIDDEN"
  displayOrder: number
  badgeCount: number
  createdAt: string
  updatedAt: string
}

export default function SkillsManagementPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    visibility: "PUBLIC" as "PUBLIC" | "HIDDEN",
    displayOrder: 0,
  })

  useEffect(() => {
    fetchSkills()
  }, [])

  const fetchSkills = async () => {
    try {
      const response = await fetch("/api/admin/skills")
      if (response.ok) {
        const data = await response.json()
        setSkills(data)
      } else {
        toast.error("Failed to load skills")
      }
    } catch (error) {
      console.error("Error fetching skills:", error)
      toast.error("Failed to load skills")
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .substring(0, 100)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingSkill ? `/api/admin/skills/${editingSkill.id}` : "/api/admin/skills"
      const method = editingSkill ? "PUT" : "POST"
      
      const body = {
        ...formData,
        slug: formData.slug || generateSlug(formData.name),
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save skill")
      }

      toast.success(editingSkill ? "Skill updated!" : "Skill created!")
      resetForm()
      fetchSkills()
    } catch (error: any) {
      toast.error(error.message || "Failed to save skill")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this skill?")) return

    try {
      const response = await fetch(`/api/admin/skills/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete skill")
      }

      toast.success("Skill deleted!")
      fetchSkills()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete skill")
    }
  }

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill)
    setFormData({
      name: skill.name,
      slug: skill.slug,
      description: skill.description || "",
      visibility: skill.visibility,
      displayOrder: skill.displayOrder,
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingSkill(null)
    setFormData({
      name: "",
      slug: "",
      description: "",
      visibility: "PUBLIC",
      displayOrder: 0,
    })
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
          <h1 className="text-3xl font-bold text-slate-900">Skills Wallet</h1>
          <p className="text-slate-600 mt-1">
            Manage skills associated with your badges
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-slate-900 hover:bg-slate-800"
        >
          {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {showForm ? "Cancel" : "Add Skill"}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingSkill ? "Edit Skill" : "Add New Skill"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Skill Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        name: e.target.value,
                        slug: editingSkill ? formData.slug : generateSlug(e.target.value),
                      })
                    }}
                    placeholder="e.g., Cloud Computing"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug {editingSkill && "*"}</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="cloud-computing"
                    required={!!editingSkill}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this skill..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="visibility">Visibility</Label>
                  <select
                    id="visibility"
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value as "PUBLIC" | "HIDDEN" })}
                    className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="HIDDEN">Hidden</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={saving} className="bg-slate-900">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {saving ? "Saving..." : (editingSkill ? "Update Skill" : "Create Skill")}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Skills List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">No skills added yet.</p>
              <Button onClick={() => setShowForm(true)} className="mt-4" variant="outline">
                Add Your First Skill
              </Button>
            </CardContent>
          </Card>
        ) : (
          skills.map((skill) => (
            <Card key={skill.id} className={skill.visibility === "HIDDEN" ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{skill.name}</h3>
                      {skill.visibility === "HIDDEN" && (
                        <EyeOff className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{skill.slug}</p>
                    
                    {skill.description && (
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                        {skill.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-3">
                      <Link
                        href={`/skills/${skill.slug}`}
                        target="_blank"
                        className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700"
                      >
                        <Award className="w-4 h-4" />
                        {skill.badgeCount} badge{skill.badgeCount !== 1 ? "s" : ""}
                      </Link>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-400">
                        Order: {skill.displayOrder}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(skill)}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(skill.id)}
                      disabled={skill.badgeCount > 0}
                      title={skill.badgeCount > 0 ? "Cannot delete skill with associated badges" : ""}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
