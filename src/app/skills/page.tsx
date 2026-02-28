"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Tag, 
  Award, 
  Loader2, 
  RefreshCw, 
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import Link from "next/link"

interface BadgeSummary {
  id: string
  title: string
  slug: string
  fallbackImageUrl: string | null
  issuer: string
}

interface Skill {
  id: string
  name: string
  slug: string
  description: string | null
  badgeCount: number
  badges?: BadgeSummary[]
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"badges" | "alphabetical">("badges")
  
  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const limit = 20

  const fetchSkills = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (searchQuery) params.append("search", searchQuery)
      params.append("sort", sortBy)
      params.append("page", page.toString())
      params.append("limit", limit.toString())
      params.append("withBadges", "true")
      
      const response = await fetch(`/api/skills?${params}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch skills")
      }
      
      setSkills(data.skills || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setHasMore(data.pagination?.hasMore || false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load skills")
    } finally {
      setLoading(false)
    }
  }, [searchQuery, sortBy, page])

  useEffect(() => {
    fetchSkills()
  }, [fetchSkills])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchSkills()
  }

  if (loading && skills.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
            <p className="text-slate-400 mt-4">Loading skills...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && skills.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="bg-red-950/30 border-red-500/30">
            <CardContent className="py-12 text-center">
              <p className="text-red-400">{error}</p>
              <Button 
                variant="outline" 
                onClick={fetchSkills}
                className="mt-4 border-red-500/30 text-red-400 hover:bg-red-950/50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Skills Wallet
              </h1>
              <p className="text-slate-400 mt-2">
                Professional skills validated through certifications
              </p>
            </div>
          </div>

          {/* Search and Filter */}
          <form onSubmit={handleSearch} className="mt-8 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as "badges" | "alphabetical")
                  setPage(1)
                }}
                className="px-4 py-2 rounded-md bg-slate-800 border border-slate-700 text-white text-sm"
              >
                <option value="badges">Most Badges First</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                Search
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Skills Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {skills.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="py-16 text-center">
              <Tag className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300">No skills found</h3>
              <p className="text-slate-500 mt-2">
                {searchQuery ? "Try adjusting your search terms" : "Check back later for new skills"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skills.map((skill) => (
                <Card 
                  key={skill.id} 
                  className="bg-slate-900 border-slate-800 hover:border-amber-500/30 transition-colors"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link href={`/skills/${skill.slug}`}>
                          <h3 className="text-lg font-semibold text-white hover:text-amber-400 transition-colors">
                            {skill.name}
                          </h3>
                        </Link>
                        
                        {skill.description && (
                          <p className="text-slate-400 text-sm mt-2 line-clamp-2">
                            {skill.description}
                          </p>
                        )}

                        {/* Badge Count */}
                        <div className="flex items-center gap-2 mt-4">
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                            <Award className="w-3 h-3 mr-1" />
                            {skill.badgeCount} badge{skill.badgeCount !== 1 ? "s" : ""}
                          </Badge>
                        </div>

                        {/* Associated Badges Preview */}
                        {skill.badges && skill.badges.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-slate-800">
                            <p className="text-xs text-slate-500 mb-3">Validating badges:</p>
                            <div className="flex flex-wrap gap-2">
                              {skill.badges.slice(0, 4).map((badge) => (
                                <Link key={badge.id} href={`/badges/${badge.slug}`}>
                                  <div 
                                    className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden hover:ring-2 hover:ring-amber-500/50 transition-all"
                                    title={badge.title}
                                  >
                                    {badge.fallbackImageUrl ? (
                                      <img
                                        src={badge.fallbackImageUrl}
                                        alt={badge.title}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Award className="w-5 h-5 text-slate-600" />
                                      </div>
                                    )}
                                  </div>
                                </Link>
                              ))}
                              {skill.badges.length > 4 && (
                                <Link href={`/skills/${skill.slug}`}>
                                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xs text-slate-400 hover:bg-slate-700 transition-colors">
                                    +{skill.badges.length - 4}
                                  </div>
                                </Link>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Skill Icon */}
                      <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 ml-4">
                        <Sparkles className="w-6 h-6 text-amber-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {(hasMore || page > 1) && (
              <div className="flex justify-center items-center gap-4 mt-12">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <span className="text-slate-400">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => p + 1)}
                  disabled={!hasMore || loading}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
