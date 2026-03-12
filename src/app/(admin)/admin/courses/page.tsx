"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  Loader2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Users,
  X,
  Save,
  Download,
  Upload,
  FileSpreadsheet,
} from "lucide-react"
import toast from "react-hot-toast"

interface Course {
  id: string
  title: string
  shortDescription: string | null
  fullDescription: string | null
  deliveryMode: "ONLINE" | "PHYSICAL" | "HYBRID"
  startDate: string | null
  endDate: string | null
  location: string | null
  status: "DRAFT" | "PUBLISHED" | "COMPLETED" | "RETIRED"
  visibility: "PUBLIC" | "HIDDEN"
  displayOrder: number
  registrantCount: number
  createdAt: string
  updatedAt: string
}

const deliveryModeLabels: Record<string, string> = {
  ONLINE: "Online",
  PHYSICAL: "Physical",
  HYBRID: "Hybrid",
}

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  COMPLETED: "Completed",
  RETIRED: "Retired",
}

const visibilityLabels: Record<string, string> = {
  PUBLIC: "Public",
  HIDDEN: "Hidden",
}

export default function CoursesManagementPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all")
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    fullDescription: "",
    deliveryMode: "ONLINE" as "ONLINE" | "PHYSICAL" | "HYBRID",
    startDate: "",
    endDate: "",
    location: "",
    status: "DRAFT" as "DRAFT" | "PUBLISHED" | "COMPLETED" | "RETIRED",
    visibility: "PUBLIC" as "PUBLIC" | "HIDDEN",
    displayOrder: 0,
  })

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/admin/event/courses")
      if (response.ok) {
        const data = await response.json()
        setCourses(data)
      } else {
        toast.error("Failed to load courses")
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast.error("Failed to load courses")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingCourse
        ? `/api/admin/event/courses/${editingCourse.id}`
        : "/api/admin/event/courses"
      const method = editingCourse ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save course")
      }

      toast.success(editingCourse ? "Course updated!" : "Course created!")
      resetForm()
      fetchCourses()
    } catch (error: any) {
      toast.error(error.message || "Failed to save course")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return

    try {
      const response = await fetch(`/api/admin/event/courses/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete course")
      }

      toast.success("Course deleted!")
      fetchCourses()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete course")
    }
  }

  const handleRetire = async (course: Course) => {
    if (!confirm(`Are you sure you want to retire "${course.title}"?`)) return

    try {
      const response = await fetch(`/api/admin/event/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RETIRED" }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to retire course")
      }

      toast.success("Course retired!")
      fetchCourses()
    } catch (error: any) {
      toast.error(error.message || "Failed to retire course")
    }
  }

  const handleMoveOrder = async (course: Course, direction: "up" | "down") => {
    const currentIndex = courses.findIndex((c) => c.id === course.id)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= courses.length) return

    const targetCourse = courses[newIndex]
    const newOrder = targetCourse.displayOrder

    try {
      const response = await fetch(`/api/admin/event/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayOrder: newOrder }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to reorder course")
      }

      toast.success("Course reordered!")
      fetchCourses()
    } catch (error: any) {
      toast.error(error.message || "Failed to reorder course")
    }
  }

  const openCreateDialog = () => {
    setEditingCourse(null)
    setFormData({
      title: "",
      shortDescription: "",
      fullDescription: "",
      deliveryMode: "ONLINE",
      startDate: "",
      endDate: "",
      location: "",
      status: "DRAFT",
      visibility: "PUBLIC",
      displayOrder: courses.length,
    })
    setShowDialog(true)
  }

  const openEditDialog = (course: Course) => {
    setEditingCourse(course)
    setFormData({
      title: course.title,
      shortDescription: course.shortDescription || "",
      fullDescription: course.fullDescription || "",
      deliveryMode: course.deliveryMode,
      startDate: course.startDate ? new Date(course.startDate).toISOString().split("T")[0] : "",
      endDate: course.endDate ? new Date(course.endDate).toISOString().split("T")[0] : "",
      location: course.location || "",
      status: course.status,
      visibility: course.visibility,
      displayOrder: course.displayOrder,
    })
    setShowDialog(true)
  }

  const resetForm = () => {
    setShowDialog(false)
    setEditingCourse(null)
    setFormData({
      title: "",
      shortDescription: "",
      fullDescription: "",
      deliveryMode: "ONLINE",
      startDate: "",
      endDate: "",
      location: "",
      status: "DRAFT",
      visibility: "PUBLIC",
      displayOrder: 0,
    })
  }

  // Download CSV template
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/admin/event/courses/template")
      if (!response.ok) throw new Error("Failed to download template")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "courses-template.csv"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success("Template downloaded!")
    } catch (error: any) {
      toast.error(error.message || "Failed to download template")
    }
  }

  // Handle bulk upload
  const handleBulkUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a CSV file")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/api/admin/event/courses/bulk", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Upload failed")
      }

      // Show summary
      const { summary } = result
      let message = `Created: ${summary.created}, Failed: ${summary.failed}`
      
      if (summary.parseErrors?.length > 0) {
        message += `, Parse errors: ${summary.parseErrors.length}`
      }

      if (summary.failed === 0 && summary.parseErrors?.length === 0) {
        toast.success(`Successfully created ${summary.created} courses!`)
      } else if (summary.created > 0) {
        toast(message, { icon: "⚠️" })
      } else {
        toast.error("Failed to create any courses. Check the errors.")
      }

      // Show detailed errors if any
      if (result.errors?.length > 0) {
        console.error("Upload errors:", result.errors)
        result.errors.slice(0, 3).forEach((err: string) => toast.error(err))
        if (result.errors.length > 3) {
          toast(`...and ${result.errors.length - 3} more errors`)
        }
      }

      // Show parse errors if any
      if (summary.parseErrors?.length > 0) {
        console.error("Parse errors:", summary.parseErrors)
        summary.parseErrors.slice(0, 3).forEach((err: string) => toast.error(err))
        if (summary.parseErrors.length > 3) {
          toast(`...and ${summary.parseErrors.length - 3} more parse errors`)
        }
      }

      // Refresh courses list
      fetchCourses()
      
      // Close dialog and reset
      setBulkUploadOpen(false)
      setSelectedFile(null)
    } catch (error: any) {
      toast.error(error.message || "Failed to upload courses")
    } finally {
      setUploading(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-100 text-green-800 hover:bg-green-100"
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
      case "COMPLETED":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100"
      case "RETIRED":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  const getDeliveryModeBadgeVariant = (mode: string) => {
    switch (mode) {
      case "ONLINE":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100"
      case "PHYSICAL":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100"
      case "HYBRID":
        return "bg-teal-100 text-teal-800 hover:bg-teal-100"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100"
    }
  }

  // Filter courses
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      searchQuery === "" ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.shortDescription &&
        course.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (course.location && course.location.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === "all" || course.status === statusFilter
    const matchesVisibility = visibilityFilter === "all" || course.visibility === visibilityFilter

    return matchesSearch && matchesStatus && matchesVisibility
  })

  // Sort by display order
  const sortedCourses = [...filteredCourses].sort((a, b) => a.displayOrder - b.displayOrder)

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
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Courses</h1>
          <p className="text-slate-600 mt-1">Manage event courses and training programs</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="hidden sm:flex"
          >
            <Download className="w-4 h-4 mr-2" />
            Template
          </Button>
          <Button
            variant="outline"
            onClick={() => setBulkUploadOpen(true)}
            className="hidden sm:flex"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Button onClick={openCreateDialog} className="bg-slate-900 hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-2" />
            Add Course
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-40">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="RETIRED">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Visibility</SelectItem>
                  <SelectItem value="PUBLIC">Public</SelectItem>
                  <SelectItem value="HIDDEN">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Courses ({sortedCourses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedCourses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No courses found.</p>
              <Button onClick={openCreateDialog} className="mt-4" variant="outline">
                Add Your First Course
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-700 w-16">Order</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Mode</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Visibility</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Registrants</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Dates</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCourses.map((course, index) => (
                    <tr
                      key={course.id}
                      className={`border-b border-slate-100 hover:bg-slate-50 ${
                        course.status === "RETIRED" ? "opacity-50" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-slate-600 w-6">
                            {course.displayOrder}
                          </span>
                          <div className="flex flex-col">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 p-0"
                              onClick={() => handleMoveOrder(course, "up")}
                              disabled={index === 0}
                            >
                              <ChevronUp className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 p-0"
                              onClick={() => handleMoveOrder(course, "down")}
                              disabled={index === sortedCourses.length - 1}
                            >
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-slate-900">{course.title}</div>
                          {course.shortDescription && (
                            <div className="text-sm text-slate-500 line-clamp-1">
                              {course.shortDescription}
                            </div>
                          )}
                          {course.location && (
                            <div className="text-xs text-slate-400">📍 {course.location}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="secondary"
                          className={getDeliveryModeBadgeVariant(course.deliveryMode)}
                        >
                          {deliveryModeLabels[course.deliveryMode]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="secondary"
                          className={getStatusBadgeVariant(course.status)}
                        >
                          {statusLabels[course.status]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {course.visibility === "PUBLIC" ? (
                            <Eye className="w-4 h-4 text-green-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="text-sm text-slate-600">
                            {visibilityLabels[course.visibility]}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">{course.registrantCount}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-slate-600">
                          {course.startDate && (
                            <div>
                              {new Date(course.startDate).toLocaleDateString()}
                              {course.endDate && (
                                <span>
                                  {" "}
                                  - {new Date(course.endDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}
                          {!course.startDate && <span className="text-slate-400">-</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(course)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          {course.status !== "RETIRED" ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-amber-600 hover:text-amber-700"
                              onClick={() => handleRetire(course)}
                              title="Retire course"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(course.id)}
                              title="Delete course"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Edit Course" : "Add New Course"}</DialogTitle>
            <DialogDescription>
              {editingCourse
                ? "Update the course details below."
                : "Fill in the details to create a new course."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Advanced Cloud Architecture"
                required
              />
            </div>

            <div>
              <Label htmlFor="shortDescription">Short Description</Label>
              <Input
                id="shortDescription"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="Brief summary for listings..."
              />
            </div>

            <div>
              <Label htmlFor="fullDescription">Full Description</Label>
              <Textarea
                id="fullDescription"
                value={formData.fullDescription}
                onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                placeholder="Detailed course description..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deliveryMode">Delivery Mode</Label>
                <Select
                  value={formData.deliveryMode}
                  onValueChange={(value: "ONLINE" | "PHYSICAL" | "HYBRID") =>
                    setFormData({ ...formData, deliveryMode: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ONLINE">Online</SelectItem>
                    <SelectItem value="PHYSICAL">Physical</SelectItem>
                    <SelectItem value="HYBRID">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Kuala Lumpur or Zoom link"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "DRAFT" | "PUBLISHED" | "COMPLETED" | "RETIRED") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="RETIRED">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value: "PUBLIC" | "HIDDEN") =>
                    setFormData({ ...formData, visibility: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                    <SelectItem value="HIDDEN">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800">
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saving ? "Saving..." : editingCourse ? "Update Course" : "Create Course"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              Bulk Upload Courses
            </DialogTitle>
            <DialogDescription>
              Upload multiple courses at once using a CSV file.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Instructions */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
              <p className="font-medium mb-2">Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  <button
                    onClick={handleDownloadTemplate}
                    className="text-amber-700 underline hover:text-amber-900"
                  >
                    Download the CSV template
                  </button>
                </li>
                <li>Fill in your course data following the template format</li>
                <li>Upload the completed CSV file below</li>
              </ol>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="csvFile">CSV File</Label>
              <Input
                id="csvFile"
                type="file"
                accept=".csv"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                disabled={uploading}
              />
              {selectedFile && (
                <p className="text-sm text-slate-600">
                  Selected: <span className="font-medium">{selectedFile.name}</span>
                  {" "}({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* CSV Format Info */}
            <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-3 rounded">
              <p className="font-medium text-slate-700">Required columns:</p>
              <p>title, deliveryMode (ONLINE/PHYSICAL/HYBRID), status (DRAFT/PUBLISHED/COMPLETED/RETIRED), visibility (PUBLIC/HIDDEN)</p>
              <p className="font-medium text-slate-700 mt-2">Optional columns:</p>
              <p>shortDescription, fullDescription, startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), location, displayOrder</p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setBulkUploadOpen(false)
                  setSelectedFile(null)
                }}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkUpload}
                disabled={!selectedFile || uploading}
                className="bg-slate-900 hover:bg-slate-800"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Courses
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
