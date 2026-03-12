"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  Building2,
  Users,
  Calendar,
} from "lucide-react"
import toast from "react-hot-toast"

interface CaseStudy {
  id: string
  clientLabel: string
  trainingTopic: string
  participantCount: number | null
  durationText: string | null
  outcomeSummary: string | null
  studyDate: string | null
  visibility: "PUBLIC" | "HIDDEN"
  displayOrder: number
  createdAt: string
  updatedAt: string
}

const visibilityLabels: Record<string, string> = {
  PUBLIC: "Public",
  HIDDEN: "Hidden",
}

export default function CaseStudiesManagementPage() {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchCaseStudies()
  }, [])

  const fetchCaseStudies = async () => {
    try {
      const response = await fetch("/api/admin/case-studies")
      if (response.ok) {
        const data = await response.json()
        setCaseStudies(data)
      } else {
        toast.error("Failed to load case studies")
      }
    } catch (error) {
      console.error("Error fetching case studies:", error)
      toast.error("Failed to load case studies")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this case study?")) return

    try {
      const response = await fetch(`/api/admin/case-studies/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete case study")
      }

      toast.success("Case study deleted!")
      fetchCaseStudies()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete case study")
    }
  }

  const handleToggleVisibility = async (caseStudy: CaseStudy) => {
    const newVisibility = caseStudy.visibility === "PUBLIC" ? "HIDDEN" : "PUBLIC"

    try {
      const response = await fetch(`/api/admin/case-studies/${caseStudy.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: newVisibility }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update visibility")
      }

      toast.success(`Case study ${newVisibility === "PUBLIC" ? "shown" : "hidden"}!`)
      fetchCaseStudies()
    } catch (error: any) {
      toast.error(error.message || "Failed to update visibility")
    }
  }

  const handleMoveOrder = async (caseStudy: CaseStudy, direction: "up" | "down") => {
    const currentIndex = caseStudies.findIndex((c) => c.id === caseStudy.id)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= caseStudies.length) return

    const targetCaseStudy = caseStudies[newIndex]
    const newOrder = targetCaseStudy.displayOrder

    try {
      const response = await fetch(`/api/admin/case-studies/${caseStudy.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayOrder: newOrder }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to reorder case study")
      }

      toast.success("Case study reordered!")
      fetchCaseStudies()
    } catch (error: any) {
      toast.error(error.message || "Failed to reorder case study")
    }
  }

  // Filter case studies
  const filteredCaseStudies = caseStudies.filter((caseStudy) => {
    const matchesSearch =
      searchQuery === "" ||
      caseStudy.clientLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseStudy.trainingTopic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (caseStudy.outcomeSummary &&
        caseStudy.outcomeSummary.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesSearch
  })

  // Sort by display order
  const sortedCaseStudies = [...filteredCaseStudies].sort((a, b) => a.displayOrder - b.displayOrder)

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Case Studies</h1>
          <p className="text-slate-400 mt-1">Manage client success stories and training outcomes</p>
        </div>
        <Link href="/admin/case-studies/new">
          <Button className="bg-green-600 hover:bg-green-500 text-slate-950 font-semibold">
            <Plus className="w-4 h-4 mr-2" />
            Add Case Study
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900/50 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-400">Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search by client, topic, or outcome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-950 border-green-500/20 text-white placeholder:text-slate-500 focus:border-green-500/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Case Studies Table */}
      <Card className="bg-slate-900/50 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-400">All Case Studies ({sortedCaseStudies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedCaseStudies.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500">No case studies found.</p>
              <Link href="/admin/case-studies/new">
                <Button className="mt-4" variant="outline">
                  Add Your First Case Study
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-green-500/20">
                    <th className="text-left py-3 px-4 font-medium text-green-400 w-16">Order</th>
                    <th className="text-left py-3 px-4 font-medium text-green-400">Client</th>
                    <th className="text-left py-3 px-4 font-medium text-green-400">Training Topic</th>
                    <th className="text-left py-3 px-4 font-medium text-green-400">Participants</th>
                    <th className="text-left py-3 px-4 font-medium text-green-400">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-green-400">Visibility</th>
                    <th className="text-left py-3 px-4 font-medium text-green-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCaseStudies.map((caseStudy, index) => (
                    <tr
                      key={caseStudy.id}
                      className="border-b border-green-500/10 hover:bg-green-500/5 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-slate-400 w-6">
                            {caseStudy.displayOrder}
                          </span>
                          <div className="flex flex-col">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 p-0 text-slate-500 hover:text-green-400"
                              onClick={() => handleMoveOrder(caseStudy, "up")}
                              disabled={index === 0}
                            >
                              <ChevronUp className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 p-0 text-slate-500 hover:text-green-400"
                              onClick={() => handleMoveOrder(caseStudy, "down")}
                              disabled={index === sortedCaseStudies.length - 1}
                            >
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-green-500/50" />
                          <span className="font-medium text-white">{caseStudy.clientLabel}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-300">{caseStudy.trainingTopic}</span>
                        {caseStudy.outcomeSummary && (
                          <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                            {caseStudy.outcomeSummary}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Users className="w-4 h-4" />
                          <span>{caseStudy.participantCount ?? "-"}</span>
                          {caseStudy.durationText && (
                            <span className="text-slate-600">({caseStudy.durationText})</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(caseStudy.studyDate)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleVisibility(caseStudy)}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors hover:bg-green-500/10"
                        >
                          {caseStudy.visibility === "PUBLIC" ? (
                            <>
                              <Eye className="w-4 h-4 text-green-400" />
                              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-0">
                                Public
                              </Badge>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-4 h-4 text-slate-500" />
                              <Badge variant="secondary" className="bg-slate-700 text-slate-400 border-0">
                                Hidden
                              </Badge>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Link href={`/admin/case-studies/${caseStudy.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-green-400"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-400"
                            onClick={() => handleDelete(caseStudy.id)}
                          >
                            <Trash2 className="w-4 h-4" />
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
    </div>
  )
}
