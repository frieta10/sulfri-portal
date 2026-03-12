"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import toast from "react-hot-toast"
import {
  Search,
  Filter,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Clock,
  AlertTriangle,
} from "lucide-react"

interface EmailLog {
  id: string
  recipientEmail: string
  subject: string | null
  templateName: string | null
  status: "SENT" | "FAILED" | "RETRYING"
  sentAt: string | null
  errorMessage: string | null
  createdAt: string
  lead: {
    contactName: string
  } | null
}

interface StatusCounts {
  [key: string]: number
}

const statusColors: Record<string, string> = {
  SENT: "bg-green-100 text-green-800 border-green-200",
  FAILED: "bg-red-100 text-red-800 border-red-200",
  RETRYING: "bg-yellow-100 text-yellow-800 border-yellow-200",
}

const statusIcons: Record<string, React.ReactNode> = {
  SENT: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  FAILED: <XCircle className="w-4 h-4 text-red-500" />,
  RETRYING: <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />,
}

export default function EmailLogPage() {
  const [emails, setEmails] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({})
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null)
  const [showErrorModal, setShowErrorModal] = useState(false)

  const fetchEmails = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (statusFilter !== "all") params.append("status", statusFilter)

      const response = await fetch(`/api/admin/email-log?${params}`)
      if (response.ok) {
        const data = await response.json()
        setEmails(data.emails)
        setStatusCounts(data.countsByStatus)
      } else {
        toast.error("Failed to load email logs")
      }
    } catch (error) {
      console.error("Error fetching email logs:", error)
      toast.error("Failed to load email logs")
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    fetchEmails()
  }, [fetchEmails])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatTemplateName = (name: string | null) => {
    if (!name) return "-"
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  }

  const handleViewError = (email: EmailLog) => {
    setSelectedEmail(email)
    setShowErrorModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Email Log</h1>
          <p className="text-slate-400 mt-1">
            Track email delivery status and view failed messages
          </p>
        </div>
        <Button
          onClick={fetchEmails}
          variant="outline"
          className="border-green-500/20 hover:bg-green-500/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { key: "SENT", label: "Sent", icon: CheckCircle2, color: "text-green-400" },
          { key: "FAILED", label: "Failed", icon: XCircle, color: "text-red-400" },
          { key: "RETRYING", label: "Retrying", icon: RefreshCw, color: "text-yellow-400" },
        ].map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
            className={`p-4 rounded-lg border text-left transition-all ${
              statusFilter === key
                ? "bg-green-500/20 border-green-500/50"
                : "bg-slate-900/50 border-green-500/10 hover:border-green-500/30"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-5 h-5 ${color}`} />
              <span className="text-sm text-slate-400">{label}</span>
            </div>
            <span className="text-2xl font-bold text-white">
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
                placeholder="Search by recipient or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-950 border-green-500/20"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] bg-slate-950 border-green-500/20">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="RETRYING">Retrying</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Log Table */}
      <Card className="bg-slate-900/50 border-green-500/20">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
          ) : emails.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No email logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-green-500/10">
                    <th className="text-left p-4 text-sm font-medium text-slate-400">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-400">Recipient</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-400 hidden md:table-cell">Subject</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-400 hidden lg:table-cell">Template</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-400">Date</th>
                    <th className="text-center p-4 text-sm font-medium text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {emails.map((email) => (
                    <tr
                      key={email.id}
                      className="border-b border-green-500/5 hover:bg-green-500/5 transition-colors"
                    >
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[email.status]}`}>
                          {statusIcons[email.status]}
                          {email.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-white">
                          {email.lead?.contactName || "-"}
                        </div>
                        <a
                          href={`mailto:${email.recipientEmail}`}
                          className="text-sm text-green-400 hover:text-green-300"
                        >
                          {email.recipientEmail}
                        </a>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <div className="text-slate-300 truncate max-w-[200px]">
                          {email.subject || "-"}
                        </div>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <span className="text-sm text-slate-400">
                          {formatTemplateName(email.templateName)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Clock className="w-4 h-4" />
                          {formatDate(email.sentAt || email.createdAt)}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {email.status === "FAILED" && email.errorMessage && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewError(email)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            View Error
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Details Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="bg-slate-900 border-green-500/20">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              Email Delivery Error
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-slate-400">Recipient</Label>
              <div className="text-white mt-1">{selectedEmail?.recipientEmail}</div>
            </div>
            <div>
              <Label className="text-slate-400">Subject</Label>
              <div className="text-white mt-1">{selectedEmail?.subject || "-"}</div>
            </div>
            <div>
              <Label className="text-slate-400">Error Message</Label>
              <div className="mt-2 p-4 bg-red-950/30 border border-red-500/20 rounded-lg text-red-200 text-sm font-mono whitespace-pre-wrap">
                {selectedEmail?.errorMessage || "No error message available"}
              </div>
            </div>
            <div className="pt-4">
              <Button
                onClick={() => setShowErrorModal(false)}
                variant="outline"
                className="border-green-500/20"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Label component for the modal
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={`text-sm font-medium ${className}`}>
      {children}
    </label>
  )
}
