"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import toast from "react-hot-toast"
import {
  Loader2,
  ArrowLeft,
  Mail,
  Phone,
  Building,
  Calendar,
  User,
  FileText,
  Download,
  Send,
  RefreshCw,
  Edit3,
  Users,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
} from "lucide-react"
import Link from "next/link"
import {
  getProposalStatusLabel,
  getProposalStatusColor,
  getIndustrySectorLabel,
  getGroupSizeLabel,
  getDeliveryModeLabel,
  getTimelineLabel,
} from "@/lib/validations/proposal"

interface Proposal {
  id: string
  contactName: string
  organisation: string
  email: string
  phone: string
  industrySector: string | null
  topicInterest: string
  groupSize: string
  deliveryMode: string
  preferredTimeline: string | null
  additionalNotes: string | null
  generatedPdfUrl: string | null
  status: "NEW" | "SENT" | "FOLLOWED_UP" | "CONVERTED" | "LOST"
  adminNotes: string | null
  submittedAt: string
  updatedAt: string
}

export default function ProposalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const proposalId = params.id as string

  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [regeneratingPdf, setRegeneratingPdf] = useState(false)
  const [sendingFollowUp, setSendingFollowUp] = useState(false)
  const [statusValue, setStatusValue] = useState<string>("")
  const [adminNotes, setAdminNotes] = useState("")
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false)
  const [followUpMessage, setFollowUpMessage] = useState("")

  useEffect(() => {
    fetchProposal()
  }, [proposalId])

  const fetchProposal = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/proposals/${proposalId}`)
      if (response.ok) {
        const data = await response.json()
        setProposal(data)
        setStatusValue(data.status)
        setAdminNotes(data.adminNotes || "")
      } else {
        toast.error("Failed to load proposal")
        router.push("/admin/proposals")
      }
    } catch (error) {
      console.error("Error fetching proposal:", error)
      toast.error("Failed to load proposal")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!proposal) return
    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusValue }),
      })

      if (response.ok) {
        const updated = await response.json()
        setProposal(updated)
        toast.success(`Status updated to ${getProposalStatusLabel(statusValue)}`)
      } else {
        toast.error("Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Failed to update status")
    } finally {
      setUpdating(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!proposal) return
    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes }),
      })

      if (response.ok) {
        const updated = await response.json()
        setProposal(updated)
        toast.success("Notes saved")
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

  const handleRegeneratePdf = async () => {
    setRegeneratingPdf(true)
    try {
      const response = await fetch(`/api/admin/proposals/${proposalId}/regenerate-pdf`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setProposal(data.proposal)
        toast.success("PDF regenerated successfully")
      } else {
        toast.error("Failed to regenerate PDF")
      }
    } catch (error) {
      console.error("Error regenerating PDF:", error)
      toast.error("Failed to regenerate PDF")
    } finally {
      setRegeneratingPdf(false)
    }
  }

  const handleSendFollowUp = async () => {
    setSendingFollowUp(true)
    try {
      const response = await fetch(`/api/admin/proposals/${proposalId}/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customMessage: followUpMessage || undefined }),
      })

      if (response.ok) {
        toast.success("Follow-up email sent successfully")
        setFollowUpDialogOpen(false)
        setFollowUpMessage("")
        fetchProposal() // Refresh to get updated status
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to send follow-up email")
      }
    } catch (error) {
      console.error("Error sending follow-up:", error)
      toast.error("Failed to send follow-up email")
    } finally {
      setSendingFollowUp(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: string) => {
    const colorClass = getProposalStatusColor(status)
    return (
      <Badge className={`${colorClass} text-sm px-3 py-1`}>
        {getProposalStatusLabel(status)}
      </Badge>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "NEW":
        return <HelpCircle className="w-5 h-5 text-blue-400" />
      case "SENT":
        return <Send className="w-5 h-5 text-amber-400" />
      case "FOLLOWED_UP":
        return <Mail className="w-5 h-5 text-purple-400" />
      case "CONVERTED":
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case "LOST":
        return <XCircle className="w-5 h-5 text-slate-400" />
      default:
        return <HelpCircle className="w-5 h-5 text-slate-400" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Proposal not found</p>
        <Link href="/admin/proposals">
          <Button className="mt-4 bg-green-600 hover:bg-green-700">
            Back to Proposals
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/proposals">
            <Button 
              variant="outline" 
              size="icon"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Proposal Details</h1>
              {getStatusBadge(proposal.status)}
            </div>
            <p className="text-slate-400 text-sm">
              Ref: {proposal.id.slice(-8).toUpperCase()} • Submitted {formatDate(proposal.submittedAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {proposal.generatedPdfUrl && (
            <a href={proposal.generatedPdfUrl} target="_blank" rel="noopener noreferrer">
              <Button 
                variant="outline"
                className="border-green-500/30 text-green-400 hover:bg-green-500/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </a>
          )}
          <Button
            onClick={() => setFollowUpDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Mail className="w-4 h-4 mr-2" />
            Send Follow-up
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Contact Info */}
        <Card className="bg-slate-900 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5 text-green-400" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-slate-500 text-sm">Contact Name</Label>
              <p className="text-white font-medium">{proposal.contactName}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-500 text-sm">Organisation</Label>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-500" />
                <p className="text-white">{proposal.organisation}</p>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-500 text-sm">Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500" />
                <a 
                  href={`mailto:${proposal.email}`}
                  className="text-green-400 hover:text-green-300"
                >
                  {proposal.email}
                </a>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-500 text-sm">Phone</Label>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-500" />
                <a 
                  href={`tel:${proposal.phone}`}
                  className="text-green-400 hover:text-green-300"
                >
                  {proposal.phone}
                </a>
              </div>
            </div>
            {proposal.industrySector && (
              <div className="space-y-1">
                <Label className="text-slate-500 text-sm">Industry/Sector</Label>
                <p className="text-white">{getIndustrySectorLabel(proposal.industrySector)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Middle Column - Training Requirements */}
        <Card className="bg-slate-900 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-400" />
              Training Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-slate-500 text-sm">Training Topic</Label>
              <p className="text-white font-medium">{proposal.topicInterest}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-500 text-sm">Group Size</Label>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                <p className="text-white">{getGroupSizeLabel(proposal.groupSize)}</p>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-500 text-sm">Delivery Mode</Label>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-500" />
                <p className="text-white">{getDeliveryModeLabel(proposal.deliveryMode)}</p>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-500 text-sm">Preferred Timeline</Label>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <p className="text-white">{getTimelineLabel(proposal.preferredTimeline)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Admin Actions */}
        <Card className="bg-slate-900 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-green-400" />
              Admin Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Update */}
            <div className="space-y-2">
              <Label className="text-slate-300">Update Status</Label>
              <div className="flex gap-2">
                <Select value={statusValue} onValueChange={setStatusValue}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="SENT">Proposal Sent</SelectItem>
                    <SelectItem value="FOLLOWED_UP">Followed Up</SelectItem>
                    <SelectItem value="CONVERTED">Converted</SelectItem>
                    <SelectItem value="LOST">Lost</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleUpdateStatus}
                  disabled={updating || statusValue === proposal.status}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update"}
                </Button>
              </div>
            </div>

            {/* Regenerate PDF */}
            <div className="space-y-2">
              <Label className="text-slate-300">Proposal PDF</Label>
              <Button
                onClick={handleRegeneratePdf}
                disabled={regeneratingPdf}
                variant="outline"
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                {regeneratingPdf ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Regenerate PDF
              </Button>
            </div>

            {/* Admin Notes */}
            <div className="space-y-2">
              <Label className="text-slate-300">Admin Notes</Label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add your notes about this proposal..."
                rows={4}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none"
              />
              <Button
                onClick={handleSaveNotes}
                disabled={updating}
                variant="outline"
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                {updating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save Notes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Notes Section */}
      {proposal.additionalNotes && (
        <Card className="bg-slate-900 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-white">Additional Notes from Client</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 whitespace-pre-wrap">{proposal.additionalNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Follow-up Dialog */}
      <Dialog open={followUpDialogOpen} onOpenChange={setFollowUpDialogOpen}>
        <DialogContent className="bg-slate-900 border-green-500/20 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-green-400" />
              Send Follow-up Email
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Send a follow-up email to {proposal.contactName} at {proposal.organisation}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Custom Message (Optional)</Label>
              <Textarea
                value={followUpMessage}
                onChange={(e) => setFollowUpMessage(e.target.value)}
                placeholder="Add a custom message to include in the follow-up email..."
                rows={4}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none"
              />
              <p className="text-xs text-slate-500">
                If left blank, a default follow-up message will be used.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFollowUpDialogOpen(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendFollowUp}
              disabled={sendingFollowUp}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {sendingFollowUp ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Follow-up
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
