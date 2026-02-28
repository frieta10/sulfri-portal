"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Tag, 
  Award, 
  Loader2, 
  RefreshCw, 
  Shield,
  Sparkles,
  ArrowLeft,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"

interface Badge {
  id: string
  title: string
  slug: string
  description: string | null
  issuer: string
  issueDate: string | null
  fallbackImageUrl: string | null
  credlyBadgeId: string
  credlyHost: string
  iframeWidth: number
  iframeHeight: number
  verificationUrl: string | null
  featured: boolean
}

interface SkillDetail {
  id: string
  name: string
  slug: string
  description: string | null
  badgeCount: number
  badges: Badge[]
}

export default function SkillDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  const [skill, setSkill] = useState<SkillDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)

  useEffect(() => {
    fetchSkill()
  }, [slug])

  const fetchSkill = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/skills/${slug}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch skill")
      }
      
      setSkill(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load skill")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
            <p className="text-slate-400 mt-4">Loading skill...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !skill) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Link href="/skills" className="inline-flex items-center text-slate-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Skills
          </Link>
          <Card className="bg-red-950/30 border-red-500/30">
            <CardContent className="py-12 text-center">
              <p className="text-red-400">{error || "Skill not found"}</p>
              <Button 
                variant="outline" 
                onClick={fetchSkill}
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
          <Link href="/skills" className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Skills
          </Link>

          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-8 h-8 text-slate-900" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {skill.name}
              </h1>
              <div className="flex items-center gap-3 mt-3">
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                  <Award className="w-3 h-3 mr-1" />
                  {skill.badgeCount} validating badge{skill.badgeCount !== 1 ? "s" : ""}
                </Badge>
              </div>
            </div>
          </div>

          {skill.description && (
            <p className="text-slate-400 mt-6 max-w-3xl">
              {skill.description}
            </p>
          )}
        </div>
      </div>

      {/* Badges List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-xl font-semibold text-white mb-6">
          Certifications validating this skill
        </h2>

        {skill.badges.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="py-12 text-center">
              <Award className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No badges found for this skill</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skill.badges.map((badge) => (
              <Card 
                key={badge.id} 
                className="bg-slate-900 border-slate-800 hover:border-amber-500/30 transition-colors cursor-pointer"
                onClick={() => setSelectedBadge(badge)}
              >
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    {/* Badge Image */}
                    <div className="w-16 h-16 flex-shrink-0 bg-slate-800 rounded-xl overflow-hidden">
                      {badge.fallbackImageUrl ? (
                        <img
                          src={badge.fallbackImageUrl}
                          alt={badge.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Award className="w-8 h-8 text-slate-600" />
                        </div>
                      )}
                    </div>

                    {/* Badge Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <h3 className="font-semibold text-white line-clamp-2">
                          {badge.title}
                        </h3>
                        {badge.featured && (
                          <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
                        {badge.issuer}
                      </p>
                      {badge.issueDate && (
                        <p className="text-xs text-slate-500 mt-2">
                          Earned {new Date(badge.issueDate).toLocaleDateString("en-US", { 
                            month: "short", 
                            year: "numeric" 
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

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
                    <Link href={`/badges/${selectedBadge.slug}`}>
                      <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                        View Full Details
                      </Button>
                    </Link>
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
