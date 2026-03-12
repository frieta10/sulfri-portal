"use client"

import { useEffect, useState, useCallback } from "react"
import { HeadMeta } from "@/components/seo/head-meta"
import { StickyCtaBar, useStickyCtaSettings } from "@/components/mobile/sticky-cta-bar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Award, 
  ExternalLink, 
  Loader2, 
  RefreshCw, 
  Shield, 
  Sparkles,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"

interface Skill {
  id: string
  name: string
  slug: string
}

interface BadgeItem {
  id: string
  title: string
  slug: string
  description: string | null
  issuer: string
  issueDate: string | null
  credlyBadgeId: string
  credlyHost: string
  iframeWidth: number
  iframeHeight: number
  verificationUrl: string | null
  featured: boolean
  fallbackImageUrl: string | null
  skills: Skill[]
}

function BadgesPageContent() {
  const { settings: ctaSettings, loading: ctaLoading } = useStickyCtaSettings()
  const [badges, setBadges] = useState<BadgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "featured" | "alphabetical">("featured")
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null)
  
  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const limit = 12

  const fetchBadges = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (searchQuery) params.append("search", searchQuery)
      params.append("sort", sortBy)
      params.append("page", page.toString())
      params.append("limit", limit.toString())
      
      const response = await fetch(`/api/badges?${params}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch badges")
      }
      
      setBadges(data.badges || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setHasMore(data.pagination?.hasMore || false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load badges")
    } finally {
      setLoading(false)
    }
  }, [searchQuery, sortBy, page])

  useEffect(() => {
    fetchBadges()
  }, [fetchBadges])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchBadges()
  }

  if (loading && badges.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
            <p className="text-slate-400 mt-4">Loading certifications...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && badges.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="bg-red-950/30 border-red-500/30">
            <CardContent className="py-12 text-center">
              <p className="text-red-400">{error}</p>
              <Button 
                variant="outline" 
                onClick={fetchBadges}
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
                Verified Credentials
              </h1>
              <p className="text-slate-400 mt-2">
                Professional certifications and digital badges from Credly
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-500" />
              <span className="text-slate-400 text-sm">Verified by Credly</span>
            </div>
          </div>

          {/* Search and Filter */}
          <form onSubmit={handleSearch} className="mt-8 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search badges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as "newest" | "featured" | "alphabetical")
                  setPage(1)
                }}
                className="px-4 py-2 rounded-md bg-slate-800 border border-slate-700 text-white text-sm"
              >
                <option value="featured">Featured First</option>
                <option value="newest">Newest First</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {badges.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="py-16 text-center">
              <Award className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300">No badges found</h3>
              <p className="text-slate-500 mt-2">
                {searchQuery ? "Try adjusting your search terms" : "Check back later for new certifications"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="group relative bg-slate-900 rounded-2xl border border-slate-800 p-4 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedBadge(badge)}
                >
                  {/* Badge Image */}
                  <div className="relative aspect-square mb-4 overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900">
                    {badge.fallbackImageUrl ? (
                      <img
                        src={badge.fallbackImageUrl}
                        alt={badge.title}
                        className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Award className="w-16 h-16 text-slate-600" />
                      </div>
                    )}
                    {/* Verified Badge */}
                    <div className="absolute top-2 right-2 w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center shadow-md">
                      <Shield className="w-4 h-4 text-slate-900" />
                    </div>
                    {/* Featured Badge */}
                    {badge.featured && (
                      <div className="absolute top-2 left-2 bg-amber-500/90 backdrop-blur-sm rounded-full px-2 py-1">
                        <Sparkles className="w-3 h-3 text-slate-900" />
                      </div>
                    )}
                  </div>
                  
                  {/* Badge Info */}
                  <h3 className="font-semibold text-sm text-slate-100 line-clamp-2 group-hover:text-amber-400 transition-colors">
                    {badge.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {badge.issuer}
                  </p>
                  
                  {badge.issueDate && (
                    <p className="text-xs text-slate-600 mt-2">
                      {new Date(badge.issueDate).toLocaleDateString("en-US", { 
                        month: "short", 
                        year: "numeric" 
                      })}
                    </p>
                  )}
                  
                  {/* Skills Preview */}
                  {badge.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {badge.skills.slice(0, 2).map((skill) => (
                        <Badge 
                          key={skill.id} 
                          variant="secondary" 
                          className="text-[10px] px-1.5 py-0 bg-slate-800 text-slate-300 border-slate-700"
                        >
                          {skill.name}
                        </Badge>
                      ))}
                      {badge.skills.length > 2 && (
                        <Badge 
                          variant="outline" 
                          className="text-[10px] px-1.5 py-0 border-slate-700 text-slate-500"
                        >
                          +{badge.skills.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
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

      {/* Sticky Mobile CTA */}
      {!ctaLoading && (
        <StickyCtaBar
          whatsappNumber={ctaSettings.whatsappNumber}
          whatsappPrefillMessage={ctaSettings.whatsappPrefillMessage}
          enabled={ctaSettings.enabled}
        />
      )}

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedBadge(null)}
        >
          <Card 
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Badge Image */}
                <div className="w-full md:w-48 flex-shrink-0">
                  <div className="aspect-square rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-4 flex items-center justify-center">
                    {selectedBadge.fallbackImageUrl ? (
                      <img
                        src={selectedBadge.fallbackImageUrl}
                        alt={selectedBadge.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Award className="w-20 h-20 text-slate-600" />
                    )}
                  </div>
                </div>

                {/* Badge Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {selectedBadge.title}
                      </h2>
                      <p className="text-slate-400 mt-1">
                        Issued by {selectedBadge.issuer}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-slate-900" />
                    </div>
                  </div>

                  {selectedBadge.description && (
                    <p className="text-slate-300 mt-4">
                      {selectedBadge.description}
                    </p>
                  )}

                  {/* Issue Date */}
                  {selectedBadge.issueDate && (
                    <div className="flex items-center gap-2 text-sm text-slate-400 mt-4">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Earned on {new Date(selectedBadge.issueDate).toLocaleDateString("en-US", { 
                        month: "long", 
                        day: "numeric", 
                        year: "numeric" 
                      })}
                    </div>
                  )}

                  {/* Skills */}
                  {selectedBadge.skills.length > 0 && (
                    <div className="mt-6">
                      <p className="text-sm font-medium text-slate-400 mb-2">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedBadge.skills.map((skill) => (
                          <Link key={skill.id} href={`/skills/${skill.slug}`}>
                            <Badge 
                              variant="secondary" 
                              className="bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700 cursor-pointer"
                            >
                              {skill.name}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedBadge(null)}
                      className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      Close
                    </Button>
                    {selectedBadge.verificationUrl && (
                      <a 
                        href={selectedBadge.verificationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Verify on Credly
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Credly Embed Preview */}
              {selectedBadge.credlyBadgeId && (
                <div className="mt-8 pt-6 border-t border-slate-800">
                  <p className="text-sm font-medium text-slate-400 mb-4">Live Badge Preview</p>
                  <div className="flex justify-center bg-slate-950 rounded-xl p-4">
                    <div 
                      data-iframe-width={selectedBadge.iframeWidth}
                      data-iframe-height={selectedBadge.iframeHeight}
                      data-share-badge-id={selectedBadge.credlyBadgeId}
                      data-share-badge-host={selectedBadge.credlyHost}
                    />
                    <script
                      async
                      type="text/javascript"
                      src="//cdn.credly.com/assets/utilities/embed.js"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default function BadgesPage() {
  return (
    <>
      <HeadMeta
        title="Verified Credentials"
        description="Professional certifications and digital badges from Credly. Verified credentials in project management, digital transformation, and leadership."
        canonical="/badges"
      />
      <BadgesPageContent />
    </>
  )
}
