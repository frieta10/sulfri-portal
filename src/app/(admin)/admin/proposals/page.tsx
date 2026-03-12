"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  FileText,
  RotateCcw,
  Mail,
  Building,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import {
  getProposalStatusLabel,
  getProposalStatusColor,
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

interface ProposalsResponse {
  proposals: Proposal[]
  topics: string[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function ProposalsManagementPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [topicFilter, setTopicFilter] = useState<string>("ALL")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [exporting, setExporting] = useState(false)

  const fetchProposals = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("page", page.toString())
      params.append("limit", limit.toString())
      if (searchQuery) params.append("search", searchQuery)
      if (statusFilter !== "ALL") params.append("status", statusFilter)
      if (topicFilter !== "ALL") params.append("topic", topicFilter)
      if (dateFrom) params.append("dateFrom", dateFrom)
      if (dateTo) params.append("dateTo", dateTo)

      const response = await fetch(`/api/admin/proposals?${params}`)
      if (response.ok) {
        const data: ProposalsResponse = await response.json()
        setProposals(data.proposals)
        setTopics(data.topics)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      } else {
        toast.error("Failed to load proposals")
      }
    } catch (error) {
      console.error("Error fetching proposals:", error)
      toast.error("Failed to load proposals")
    } finally {
      setLoading(false)
    }
  }, [page, limit, searchQuery, statusFilter, topicFilter, dateFrom, dateTo])

  useEffect(() => {
    fetchProposals()
  }, [fetchProposals])

  const handleSearch = () => {
    setPage(1)
    fetchProposals()
  }

  const handleResetFilters = () => {
    setSearchQuery("")
    setStatusFilter("ALL")
    setTopicFilter("ALL")
    setDateFrom("")
    setDateTo("")
    setPage(1)
    fetchProposals()
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append("search", searchQuery)
      if (statusFilter !== "ALL") params.append("status", statusFilter)
      if (topicFilter !== "ALL") params.append("topic", topicFilter)
      if (dateFrom) params.append("dateFrom", dateFrom)
      if (dateTo) params.append("dateTo", dateTo)

      const response = await fetch(`/api/admin/proposals/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `proposals-export-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
        toast.success("Export downloaded successfully")
      } else {
        toast.error("Failed to export proposals")
      }
    } catch (error) {
      console.error("Error exporting proposals:", error)
      toast.error("Failed to export proposals")
    } finally {
      setExporting(false)
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

  const getStatusBadge = (status: string) => {
    const colorClass = getProposalStatusColor(status)
    return (
      <Badge className={`${colorClass} hover:opacity-80`}>
        {getProposalStatusLabel(status)}
      </Badge>
    )
  }

  if (loading && proposals.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Proposals</h1>
          <p className="text-slate-400 mt-1">
            Manage training proposal requests from potential clients
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={exporting || proposals.length === 0}
          variant="outline"
          className="gap-2 border-green-500/30 text-green-400 hover:bg-green-500/10"
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
      <Card className="bg-slate-900 border-green-500/20">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">
                Search
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  id="search"
                  placeholder="Search by name, organisation, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-40">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="SENT">Sent</SelectItem>
                    <SelectItem value="FOLLOWED_UP">Followed Up</SelectItem>
                    <SelectItem value="CONVERTED">Converted</SelectItem>
                    <SelectItem value="LOST">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full sm:w-48">
                <Select value={topicFilter} onValueChange={setTopicFilter}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Topic" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="ALL">All Topics</SelectItem>
                    {topics.map((topic) => (
                      <SelectItem key={topic} value={topic}>
                        {topic}
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
                    className="bg-slate-800 border-slate-700 text-white"
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
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSearch} 
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleResetFilters}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proposals Table */}
      <Card className="bg-slate-900 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-lg text-white">
            Proposals ({total})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800 border-b border-slate-700">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                    Contact
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                    Organisation
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                    Topic
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                    Submitted
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {proposals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p>No proposals found matching your criteria.</p>
                    </td>
                  </tr>
                ) : (
                  proposals.map((proposal) => (
                    <tr key={proposal.id} className="hover:bg-slate-800/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500" />
                          <div>
                            <div className="font-medium text-white">{proposal.contactName}</div>
                            <a 
                              href={`mailto:${proposal.email}`}
                              className="text-sm text-green-400 hover:text-green-300"
                            >
                              {proposal.email}
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Building className="w-4 h-4 text-slate-500" />
                          {proposal.organisation}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-300">{proposal.topicInterest}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                          <Calendar className="w-4 h-4" />
                          {formatDate(proposal.submittedAt)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(proposal.status)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-1">
                          <Link href={`/admin/proposals/${proposal.id}`}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-slate-400 hover:text-green-400 hover:bg-green-500/10"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
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
            <div className="flex items-center justify-between py-4 px-4 border-t border-slate-800">
              <p className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
