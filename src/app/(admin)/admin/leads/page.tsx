"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import toast from "react-hot-toast"
import {
  Loader2,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  Archive,
  RotateCcw,
  Phone,
  Mail,
  Building,
  Calendar,
  GraduationCap,
  User,
  FileText,
  ExternalLink,
} from "lucide-react"

interface Course {
  id: string
  title: string
  slug: string
}

interface Lead {
  id: string
  fullName: string
  email: string
  phone: string | null
  organisation: string | null
  courses: Course[]
  utmSource: string | null
  consentGiven: boolean
  notes: string | null
  status: "NEW" | "CONTACTED" | "ARCHIVED"
  createdAt: string
  updatedAt: string
}

interface LeadsResponse {
  leads: Lead[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function LeadsManagementPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [courseFilter, setCourseFilter] = useState<string>("ALL")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Detail dialog
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [notesInput, setNotesInput] = useState("")

  // Export loading
  const [exporting, setExporting] = useState(false)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("page", page.toString())
      params.append("limit", limit.toString())
      if (searchQuery) params.append("search", searchQuery)
      if (statusFilter !== "ALL") params.append("status", statusFilter)
      if (courseFilter !== "ALL") params.append("courseId", courseFilter)
      if (dateFrom) params.append("dateFrom", dateFrom)
      if (dateTo) params.append("dateTo", dateTo)

      const response = await fetch(`/api/admin/event/leads?${params}`)
      if (response.ok) {
        const data: LeadsResponse = await response.json()
        setLeads(data.leads)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      } else {
        toast.error("Failed to load leads")
      }
    } catch (error) {
      console.error("Error fetching leads:", error)
      toast.error("Failed to load leads")
    } finally {
      setLoading(false)
    }
  }, [page, limit, searchQuery, statusFilter, courseFilter, dateFrom, dateTo])

  const fetchCourses = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/event/courses")
      if (response.ok) {
        const data = await response.json()
        setCourses(data)
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
    fetchCourses()
  }, [fetchLeads, fetchCourses])

  const handleSearch = () => {
    setPage(1)
    fetchLeads()
  }

  const handleResetFilters = () => {
    setSearchQuery("")
    setStatusFilter("ALL")
    setCourseFilter("ALL")
    setDateFrom("")
    setDateTo("")
    setPage(1)
    fetchLeads()
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append("search", searchQuery)
      if (statusFilter !== "ALL") params.append("status", statusFilter)
      if (courseFilter !== "ALL") params.append("courseId", courseFilter)
      if (dateFrom) params.append("dateFrom", dateFrom)
      if (dateTo) params.append("dateTo", dateTo)

      const response = await fetch(`/api/admin/event/leads/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `leads-export-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
        toast.success("Export downloaded successfully")
      } else {
        toast.error("Failed to export leads")
      }
    } catch (error) {
      console.error("Error exporting leads:", error)
      toast.error("Failed to export leads")
    } finally {
      setExporting(false)
    }
  }

  const handleViewDetail = async (leadId: string) => {
    try {
      const response = await fetch(`/api/admin/event/leads/${leadId}`)
      if (response.ok) {
        const lead: Lead = await response.json()
        setSelectedLead(lead)
        setNotesInput(lead.notes || "")
        setDetailOpen(true)
      } else {
        toast.error("Failed to load lead details")
      }
    } catch (error) {
      console.error("Error fetching lead details:", error)
      toast.error("Failed to load lead details")
    }
  }

  const updateLeadStatus = async (leadId: string, status: "NEW" | "CONTACTED" | "ARCHIVED") => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/event/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes: notesInput }),
      })

      if (response.ok) {
        toast.success(`Lead marked as ${status.toLowerCase()}`)
        setLeads(prev =>
          prev.map(lead => (lead.id === leadId ? { ...lead, status } : lead))
        )
        if (selectedLead) {
          setSelectedLead({ ...selectedLead, status })
        }
      } else {
        toast.error("Failed to update lead")
      }
    } catch (error) {
      console.error("Error updating lead:", error)
      toast.error("Failed to update lead")
    } finally {
      setUpdating(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!selectedLead) return
    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/event/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesInput }),
      })

      if (response.ok) {
        toast.success("Notes saved")
        setSelectedLead({ ...selectedLead, notes: notesInput })
        setLeads(prev =>
          prev.map(lead => (lead.id === selectedLead.id ? { ...lead, notes: notesInput } : lead))
        )
      } else {
        toast.error("Failed to save notes")
      }
    } catch (error) {
      console.error("Error saving notes:", error)
      toast.error("Failed to save notes")
    } finally {
      setUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">New</Badge>
      case "CONTACTED":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Contacted</Badge>
      case "ARCHIVED":
        return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100">Archived</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading && leads.length === 0) {
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
          <h1 className="text-3xl font-bold text-slate-900">Event Leads</h1>
          <p className="text-slate-600 mt-1">
            Manage event registrations and course inquiries
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={exporting || leads.length === 0}
          variant="outline"
          className="gap-2"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or organisation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-40">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="CONTACTED">Contacted</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-48">
                <Select value={courseFilter} onValueChange={setCourseFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Courses</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <div>
                  <Label htmlFor="dateFrom" className="sr-only">
                    From
                  </Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    placeholder="From"
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo" className="sr-only">
                    To
                  </Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    placeholder="To"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSearch} className="bg-slate-900 hover:bg-slate-800">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" onClick={handleResetFilters}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Leads ({total})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">
                    Full Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">
                    Phone
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">
                    Organisation
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">
                    Courses
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p>No leads found matching your criteria.</p>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{lead.fullName}</div>
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={`mailto:${lead.email}`}
                          className="text-amber-600 hover:text-amber-700"
                        >
                          {lead.email}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {lead.phone || "-"}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {lead.organisation || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {lead.courses.map((course) => (
                            <span
                              key={course.id}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800"
                            >
                              {course.title}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">
                        {formatDate(lead.createdAt)}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(lead.status)}</td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetail(lead.id)}
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {lead.status !== "CONTACTED" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateLeadStatus(lead.id, "CONTACTED")}
                              title="Mark as Contacted"
                              disabled={updating}
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
                          {lead.status !== "ARCHIVED" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateLeadStatus(lead.id, "ARCHIVED")}
                              title="Archive"
                              disabled={updating}
                            >
                              <Archive className="w-4 h-4 text-slate-600" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between py-4 px-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
            <DialogDescription>
              View and manage lead information
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Full Name</p>
                      <p className="font-medium text-slate-900">{selectedLead.fullName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Email</p>
                      <a
                        href={`mailto:${selectedLead.email}`}
                        className="font-medium text-amber-600 hover:text-amber-700"
                      >
                        {selectedLead.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Phone</p>
                      <p className="font-medium text-slate-900">
                        {selectedLead.phone || "Not provided"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Building className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Organisation</p>
                      <p className="font-medium text-slate-900">
                        {selectedLead.organisation || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Courses */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                  Selected Courses
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedLead.courses.length === 0 ? (
                    <p className="text-slate-500">No courses selected</p>
                  ) : (
                    selectedLead.courses.map((course) => (
                      <Badge
                        key={course.id}
                        variant="secondary"
                        className="px-3 py-1 text-sm"
                      >
                        <GraduationCap className="w-3 h-3 mr-1" />
                        {course.title}
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              {/* Registration Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                  Registration Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Registration Date</p>
                      <p className="font-medium text-slate-900">
                        {formatDate(selectedLead.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <ExternalLink className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">UTM Source</p>
                      <p className="font-medium text-slate-900">
                        {selectedLead.utmSource || "Direct"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Consent Status</p>
                      <p className="font-medium text-slate-900">
                        {selectedLead.consentGiven ? (
                          <span className="text-green-600">Given</span>
                        ) : (
                          <span className="text-red-600">Not Given</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-500">Current Status</p>
                      <div className="mt-1">{getStatusBadge(selectedLead.status)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                  Admin Notes
                </h3>
                <Textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Add your notes about this lead..."
                  rows={4}
                />
                <Button
                  onClick={handleSaveNotes}
                  disabled={updating}
                  variant="outline"
                  size="sm"
                >
                  {updating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    "Save Notes"
                  )}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedLead && selectedLead.status !== "CONTACTED" && (
              <Button
                onClick={() => {
                  updateLeadStatus(selectedLead.id, "CONTACTED")
                }}
                disabled={updating}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Contacted
              </Button>
            )}
            {selectedLead && selectedLead.status !== "ARCHIVED" && (
              <Button
                onClick={() => {
                  updateLeadStatus(selectedLead.id, "ARCHIVED")
                  setDetailOpen(false)
                }}
                disabled={updating}
                variant="outline"
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive Lead
              </Button>
            )}
            {selectedLead && selectedLead.status === "ARCHIVED" && (
              <Button
                onClick={() => updateLeadStatus(selectedLead.id, "NEW")}
                disabled={updating}
                variant="outline"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore to New
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
