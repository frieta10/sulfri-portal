"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Archive,
  Send,
  Calendar,
  MessageSquare,
  Download,
  Loader2,
  Mail,
  Phone,
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  X,
} from "lucide-react"
import Link from "next/link"

interface Lead {
  id: string
  source: string
  contactName: string
  email: string
  organisation: string | null
  topicInterest: string | null
  status: string
  followUpDate: string | null
  adminNotes: string | null
  lastActivityAt: string
  createdAt: string
  _count: {
    emailLogs: number
  }
}

interface StatusCounts {
  [key: string]: number
}

const statusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800 border-blue-200",
  CONTACTED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PROPOSAL_SENT: "bg-purple-100 text-purple-800 border-purple-200",
  NEGOTIATING: "bg-orange-100 text-orange-800 border-orange-200",
  CONVERTED: "bg-green-100 text-green-800 border-green-200",
  LOST: "bg-gray-100 text-gray-800 border-gray-200",
  ARCHIVED: "bg-slate-100 text-slate-800 border-slate-200",
}

const sourceLabels: Record<string, string> = {
  PROPOSAL: "Proposal",
  EVENT: "Event",
  DIRECT_ENQUIRY: "Direct Enquiry",
}

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form states
  const [newLeadForm, setNewLeadForm] = useState({
    contactName: "",
    email: "",
    organisation: "",
    topicInterest: "",
    source: "DIRECT_ENQUIRY",
    status: "NEW",
    followUpDate: "",
    adminNotes: "",
  })

  const [emailForm, setEmailForm] = useState({
    subject: "",
    message: "",
  })

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (sourceFilter !== "all") params.append("source", sourceFilter)

      const response = await fetch(`/api/admin/pipeline?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leads)
        setStatusCounts(data.countsByStatus)
      } else {
        toast.error("Failed to load leads")
      }
    } catch (error) {
      console.error("Error fetching leads:", error)
      toast.error("Failed to load leads")
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, sourceFilter])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/api/admin/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLeadForm),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create lead")
      }

      toast.success("Lead created successfully!")
      setShowAddModal(false)
      setNewLeadForm({
        contactName: "",
        email: "",
        organisation: "",
        topicInterest: "",
        source: "DIRECT_ENQUIRY",
        status: "NEW",
        followUpDate: "",
        adminNotes: "",
      })
      fetchLeads()
    } catch (error: any) {
      toast.error(error.message || "Failed to create lead")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/pipeline/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update status")
      }

      toast.success(`Status updated to ${newStatus.replace("_", " ")}`)
      fetchLeads()
    } catch (error) {
      toast.error("Failed to update status")
    }
  }

  const handleArchiveLead = async (leadId: string) => {
    if (!confirm("Are you sure you want to archive this lead?")) return

    try {
      const response = await fetch(`/api/admin/pipeline/${leadId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to archive lead")
      }

      toast.success("Lead archived successfully")
      fetchLeads()
    } catch (error) {
      toast.error("Failed to archive lead")
    }
  }

  const handleUpdateNotes = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLead) return

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/pipeline/${selectedLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminNotes: selectedLead.adminNotes,
          followUpDate: selectedLead.followUpDate,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update notes")
      }

      toast.success("Notes updated successfully")
      setShowNotesModal(false)
      fetchLeads()
    } catch (error) {
      toast.error("Failed to update notes")
    } finally {
      setSaving(false)
    }
  }

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLead) return

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/pipeline/${selectedLead.id}/send-followup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailForm),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to send email")
      }

      toast.success("Follow-up email sent successfully")
      setShowEmailModal(false)
      setEmailForm({ subject: "", message: "" })
      fetchLeads()
    } catch (error: any) {
      toast.error(error.message || "Failed to send email")
    } finally {
      setSaving(false)
    }
  }

  const handleExportCSV = () => {
    const csvContent = [
      ["Source", "Contact Name", "Email", "Organisation", "Status", "Topic Interest", "Last Activity", "Created At"],
      ...leads.map((lead) => [
        sourceLabels[lead.source] || lead.source,
        lead.contactName,
        lead.email,
        lead.organisation || "",
        lead.status,
        lead.topicInterest || "",
        new Date(lead.lastActivityAt).toLocaleString(),
        new Date(lead.createdAt).toLocaleString(),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pipeline-leads-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success("Leads exported successfully")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return formatDate(dateString)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">CRM Pipeline</h1>
          <p className="text-slate-400 mt-1">
            Manage leads and track your sales pipeline
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="border-green-500/20 hover:bg-green-500/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { key: "NEW", label: "New", icon: FileText },
          { key: "CONTACTED", label: "Contacted", icon: Mail },
          { key: "PROPOSAL_SENT", label: "Proposal", icon: Send },
          { key: "NEGOTIATING", label: "Negotiating", icon: MessageSquare },
          { key: "CONVERTED", label: "Converted", icon: CheckCircle2 },
          { key: "LOST", label: "Lost", icon: X },
          { key: "ARCHIVED", label: "Archived", icon: Archive },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
            className={`p-3 rounded-lg border text-left transition-all ${
              statusFilter === key
                ? "bg-green-500/20 border-green-500/50"
                : "bg-slate-900/50 border-green-500/10 hover:border-green-500/30"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-4 h-4 text-green-400" />
              <span className="text-xs text-slate-400">{label}</span>
            </div>
            <span className="text-xl font-bold text-white">
              {statusCounts[key] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-slate-900/50 border-green-500/20">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, or organisation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-950 border-green-500/20"
              />
            </div>
            <div className="flex gap-2">
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[180px] bg-slate-950 border-green-500/20">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="PROPOSAL">Proposal</SelectItem>
                  <SelectItem value="EVENT">Event</SelectItem>
                  <SelectItem value="DIRECT_ENQUIRY">Direct Enquiry</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="bg-slate-900/50 border-green-500/20">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No leads found</p>
              <Button
                onClick={() => setShowAddModal(true)}
                variant="outline"
                className="mt-4 border-green-500/20"
              >
                Add Your First Lead
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-green-500/10">
                    <th className="text-left p-4 text-sm font-medium text-slate-400">Source</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-400">Contact</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-400 hidden lg:table-cell">Organisation</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-400">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-400 hidden md:table-cell">Last Activity</th>
                    <th className="text-right p-4 text-sm font-medium text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-green-500/5 hover:bg-green-500/5 transition-colors"
                    >
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                          {sourceLabels[lead.source] || lead.source}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-white">{lead.contactName}</div>
                        <a
                          href={`mailto:${lead.email}`}
                          className="text-sm text-green-400 hover:text-green-300"
                        >
                          {lead.email}
                        </a>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <div className="text-slate-300">{lead.organisation || "-"}</div>
                        {lead.topicInterest && (
                          <div className="text-xs text-slate-500 truncate max-w-[200px]">
                            {lead.topicInterest}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <Select
                          value={lead.status}
                          onValueChange={(value) => handleUpdateStatus(lead.id, value)}
                        >
                          <SelectTrigger className={`w-[140px] text-xs ${statusColors[lead.status]}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NEW">New</SelectItem>
                            <SelectItem value="CONTACTED">Contacted</SelectItem>
                            <SelectItem value="PROPOSAL_SENT">Proposal Sent</SelectItem>
                            <SelectItem value="NEGOTIATING">Negotiating</SelectItem>
                            <SelectItem value="CONVERTED">Converted</SelectItem>
                            <SelectItem value="LOST">Lost</SelectItem>
                            <SelectItem value="ARCHIVED">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Clock className="w-4 h-4" />
                          {formatTimeAgo(lead.lastActivityAt)}
                        </div>
                        {lead._count.emailLogs > 0 && (
                          <div className="text-xs text-green-400 mt-1">
                            {lead._count.emailLogs} email{lead._count.emailLogs !== 1 ? "s" : ""} sent
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedLead(lead)
                              setEmailForm({
                                subject: "Following up on your inquiry",
                                message: `Hi ${lead.contactName},\n\nI hope this email finds you well. I wanted to follow up on your recent inquiry about our training services.\n\nBest regards,`,
                              })
                              setShowEmailModal(true)
                            }}
                            title="Send follow-up email"
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedLead(lead)
                              setShowNotesModal(true)
                            }}
                            title="Edit notes"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleArchiveLead(lead.id)}
                            title="Archive lead"
                            className="text-red-400 hover:text-red-300"
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
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

      {/* Add Lead Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-slate-900 border-green-500/20 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Lead</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateLead} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactName">Contact Name *</Label>
                <Input
                  id="contactName"
                  value={newLeadForm.contactName}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, contactName: e.target.value })}
                  className="bg-slate-950 border-green-500/20"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newLeadForm.email}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                  className="bg-slate-950 border-green-500/20"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="organisation">Organisation</Label>
              <Input
                id="organisation"
                value={newLeadForm.organisation}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, organisation: e.target.value })}
                className="bg-slate-950 border-green-500/20"
              />
            </div>
            <div>
              <Label htmlFor="topicInterest">Topic Interest</Label>
              <Input
                id="topicInterest"
                value={newLeadForm.topicInterest}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, topicInterest: e.target.value })}
                className="bg-slate-950 border-green-500/20"
                placeholder="e.g., Leadership Training, Cloud Computing..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="source">Source</Label>
                <Select
                  value={newLeadForm.source}
                  onValueChange={(value) => setNewLeadForm({ ...newLeadForm, source: value })}
                >
                  <SelectTrigger className="bg-slate-950 border-green-500/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DIRECT_ENQUIRY">Direct Enquiry</SelectItem>
                    <SelectItem value="PROPOSAL">Proposal</SelectItem>
                    <SelectItem value="EVENT">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newLeadForm.status}
                  onValueChange={(value) => setNewLeadForm({ ...newLeadForm, status: value })}
                >
                  <SelectTrigger className="bg-slate-950 border-green-500/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="CONTACTED">Contacted</SelectItem>
                    <SelectItem value="PROPOSAL_SENT">Proposal Sent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="followUpDate">Follow-up Date</Label>
              <Input
                id="followUpDate"
                type="datetime-local"
                value={newLeadForm.followUpDate}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, followUpDate: e.target.value })}
                className="bg-slate-950 border-green-500/20"
              />
            </div>
            <div>
              <Label htmlFor="adminNotes">Notes</Label>
              <Textarea
                id="adminNotes"
                value={newLeadForm.adminNotes}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, adminNotes: e.target.value })}
                className="bg-slate-950 border-green-500/20"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Lead"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Notes Modal */}
      <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
        <DialogContent className="bg-slate-900 border-green-500/20">
          <DialogHeader>
            <DialogTitle className="text-white">
              Edit Notes - {selectedLead?.contactName}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateNotes} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="editNotes">Admin Notes</Label>
              <Textarea
                id="editNotes"
                value={selectedLead?.adminNotes || ""}
                onChange={(e) => setSelectedLead(prev => prev ? { ...prev, adminNotes: e.target.value } : null)}
                className="bg-slate-950 border-green-500/20"
                rows={5}
                placeholder="Add your notes about this lead..."
              />
            </div>
            <div>
              <Label htmlFor="editFollowUpDate">Follow-up Date</Label>
              <Input
                id="editFollowUpDate"
                type="datetime-local"
                value={selectedLead?.followUpDate ? new Date(selectedLead.followUpDate).toISOString().slice(0, 16) : ""}
                onChange={(e) => setSelectedLead(prev => prev ? { ...prev, followUpDate: e.target.value } : null)}
                className="bg-slate-950 border-green-500/20"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowNotesModal(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Email Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="bg-slate-900 border-green-500/20 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">
              Send Follow-up Email
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSendEmail} className="space-y-4 mt-4">
            <div>
              <Label>To</Label>
              <div className="text-slate-300 p-2 bg-slate-950 rounded border border-green-500/20">
                {selectedLead?.contactName} ({selectedLead?.email})
              </div>
            </div>
            <div>
              <Label htmlFor="emailSubject">Subject *</Label>
              <Input
                id="emailSubject"
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                className="bg-slate-950 border-green-500/20"
                required
              />
            </div>
            <div>
              <Label htmlFor="emailMessage">Message *</Label>
              <Textarea
                id="emailMessage"
                value={emailForm.message}
                onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                className="bg-slate-950 border-green-500/20"
                rows={8}
                required
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Send Email</>}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowEmailModal(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
