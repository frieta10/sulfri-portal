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
  Quote,
  Star,
} from "lucide-react"
import toast from "react-hot-toast"

interface Testimonial {
  id: string
  quote: string
  authorName: string
  authorTitle: string | null
  authorOrganisation: string | null
  photoUrl: string | null
  rating: number | null
  visibility: "PUBLIC" | "HIDDEN"
  displayOrder: number
  createdAt: string
  updatedAt: string
}

const visibilityLabels: Record<string, string> = {
  PUBLIC: "Public",
  HIDDEN: "Hidden",
}

export default function TestimonialsManagementPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const fetchTestimonials = async () => {
    try {
      const response = await fetch("/api/admin/testimonials")
      if (response.ok) {
        const data = await response.json()
        setTestimonials(data)
      } else {
        toast.error("Failed to load testimonials")
      }
    } catch (error) {
      console.error("Error fetching testimonials:", error)
      toast.error("Failed to load testimonials")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return

    try {
      const response = await fetch(`/api/admin/testimonials/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete testimonial")
      }

      toast.success("Testimonial deleted!")
      fetchTestimonials()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete testimonial")
    }
  }

  const handleToggleVisibility = async (testimonial: Testimonial) => {
    const newVisibility = testimonial.visibility === "PUBLIC" ? "HIDDEN" : "PUBLIC"

    try {
      const response = await fetch(`/api/admin/testimonials/${testimonial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: newVisibility }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update visibility")
      }

      toast.success(`Testimonial ${newVisibility === "PUBLIC" ? "shown" : "hidden"}!`)
      fetchTestimonials()
    } catch (error: any) {
      toast.error(error.message || "Failed to update visibility")
    }
  }

  const handleMoveOrder = async (testimonial: Testimonial, direction: "up" | "down") => {
    const currentIndex = testimonials.findIndex((t) => t.id === testimonial.id)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= testimonials.length) return

    const targetTestimonial = testimonials[newIndex]
    const newOrder = targetTestimonial.displayOrder

    try {
      const response = await fetch(`/api/admin/testimonials/${testimonial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayOrder: newOrder }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to reorder testimonial")
      }

      toast.success("Testimonial reordered!")
      fetchTestimonials()
    } catch (error: any) {
      toast.error(error.message || "Failed to reorder testimonial")
    }
  }

  // Filter testimonials
  const filteredTestimonials = testimonials.filter((testimonial) => {
    const matchesSearch =
      searchQuery === "" ||
      testimonial.quote.toLowerCase().includes(searchQuery.toLowerCase()) ||
      testimonial.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (testimonial.authorOrganisation &&
        testimonial.authorOrganisation.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesSearch
  })

  // Sort by display order
  const sortedTestimonials = [...filteredTestimonials].sort((a, b) => a.displayOrder - b.displayOrder)

  // Render star rating
  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-slate-400">-</span>
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
          />
        ))}
      </div>
    )
  }

  // Truncate quote for preview
  const truncateQuote = (quote: string, maxLength: number = 80) => {
    if (quote.length <= maxLength) return quote
    return quote.substring(0, maxLength) + "..."
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
          <h1 className="text-3xl font-bold text-white">Testimonials</h1>
          <p className="text-slate-400 mt-1">Manage client testimonials and reviews</p>
        </div>
        <Link href="/admin/testimonials/new">
          <Button className="bg-green-600 hover:bg-green-500 text-slate-950 font-semibold">
            <Plus className="w-4 h-4 mr-2" />
            Add Testimonial
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
              placeholder="Search by quote, author, or organisation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-950 border-green-500/20 text-white placeholder:text-slate-500 focus:border-green-500/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Testimonials Table */}
      <Card className="bg-slate-900/50 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-400">All Testimonials ({sortedTestimonials.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedTestimonials.length === 0 ? (
            <div className="text-center py-12">
              <Quote className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500">No testimonials found.</p>
              <Link href="/admin/testimonials/new">
                <Button className="mt-4" variant="outline">
                  Add Your First Testimonial
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-green-500/20">
                    <th className="text-left py-3 px-4 font-medium text-green-400 w-16">Order</th>
                    <th className="text-left py-3 px-4 font-medium text-green-400">Quote Preview</th>
                    <th className="text-left py-3 px-4 font-medium text-green-400">Author</th>
                    <th className="text-left py-3 px-4 font-medium text-green-400">Organisation</th>
                    <th className="text-left py-3 px-4 font-medium text-green-400">Rating</th>
                    <th className="text-left py-3 px-4 font-medium text-green-400">Visibility</th>
                    <th className="text-left py-3 px-4 font-medium text-green-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTestimonials.map((testimonial, index) => (
                    <tr
                      key={testimonial.id}
                      className="border-b border-green-500/10 hover:bg-green-500/5 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-slate-400 w-6">
                            {testimonial.displayOrder}
                          </span>
                          <div className="flex flex-col">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 p-0 text-slate-500 hover:text-green-400"
                              onClick={() => handleMoveOrder(testimonial, "up")}
                              disabled={index === 0}
                            >
                              <ChevronUp className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 p-0 text-slate-500 hover:text-green-400"
                              onClick={() => handleMoveOrder(testimonial, "down")}
                              disabled={index === sortedTestimonials.length - 1}
                            >
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-2">
                          <Quote className="w-4 h-4 text-green-500/50 mt-1 flex-shrink-0" />
                          <span className="text-slate-300 text-sm max-w-xs">
                            {truncateQuote(testimonial.quote)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-white">{testimonial.authorName}</div>
                          {testimonial.authorTitle && (
                            <div className="text-sm text-slate-500">{testimonial.authorTitle}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-400">
                          {testimonial.authorOrganisation || "-"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {renderStars(testimonial.rating)}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleVisibility(testimonial)}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors hover:bg-green-500/10"
                        >
                          {testimonial.visibility === "PUBLIC" ? (
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
                          <Link href={`/admin/testimonials/${testimonial.id}`}>
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
                            onClick={() => handleDelete(testimonial.id)}
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
