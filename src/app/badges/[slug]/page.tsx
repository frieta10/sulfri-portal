"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Award, 
  Loader2, 
  RefreshCw, 
  Shield,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  Calendar,
  Building,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"

interface Skill {
  id: string
  name: string
  slug: string
}

interface BadgeDetail {
  id: string
  title: string
  slug: string
  description: string | null
  issuer: string
  issueDate: string | null
  expiryDate: string | null
  credlyBadgeId: string
  credlyHost: string
  iframeWidth: number
  iframeHeight: number
  verificationUrl: string | null
  featured: boolean
  fallbackImageUrl: string | null
  skills: Skill[]
}

export default function BadgeDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  const [badge, setBadge] = useState<BadgeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBadge()
  }, [slug])

  const fetchBadge = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/badges/${slug}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch badge")
      }
      
      setBadge(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load badge")
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
            <p className="text-slate-400 mt-4">Loading badge...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !badge) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Link href="/badges" className="inline-flex items-center text-slate-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Badges
          </Link>
          <Card className="bg-red-950/30 border-red-500/30">
            <CardContent className="py-12 text-center">
              <p className="text-red-400">{error || "Badge not found"}</p>
              <Button 
                variant="outline" 
                onClick={fetchBadge}
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
          <Link href="/badges" className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Badges
          </Link>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Badge Image */}
            <div className="w-full md:w-48 flex-shrink-0">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 flex items-center justify-center border border-slate-700">
                {badge.fallbackImageUrl ? (
                  <img
                    src={badge.fallbackImageUrl}
                    alt={badge.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Award className="w-24 h-24 text-slate-600" />
                )}
              </div>
            </div>

            {/* Badge Info */}
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-slate-900" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white">
                    {badge.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <Badge className="bg-slate-800 text-slate-300 border-slate-700">
                      <Building className="w-3 h-3 mr-1" />
                      {badge.issuer}
                    </Badge>
                    {badge.featured && (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {badge.description && (
                <p className="text-slate-300 mt-6 max-w-3xl">
                  {badge.description}
                </p>
              )}

              {/* Dates */}
              <div className="flex flex-wrap gap-6 mt-6">
                {badge.issueDate && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="w-5 h-5 text-amber-500" />
                    <span>
                      Earned on {new Date(badge.issueDate).toLocaleDateString("en-US", { 
                        month: "long", 
                        day: "numeric", 
                        year: "numeric" 
                      })}
                    </span>
                  </div>
                )}
                {badge.expiryDate && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <CheckCircle className="w-5 h-5 text-amber-500" />
                    <span>
                      Expires on {new Date(badge.expiryDate).toLocaleDateString("en-US", { 
                        month: "long", 
                        day: "numeric", 
                        year: "numeric" 
                      })}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 mt-8">
                {badge.verificationUrl && (
                  <a 
                    href={badge.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Verify on Credly
                    </Button>
                  </a>
                )}
                <Link href="/badges">
                  <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                    View All Badges
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills Section */}
      {badge.skills.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-xl font-semibold text-white mb-6">Validated Skills</h2>
          <div className="flex flex-wrap gap-3">
            {badge.skills.map((skill) => (
              <Link key={skill.id} href={`/skills/${skill.slug}`}>
                <Badge 
                  className="bg-slate-800 text-slate-300 hover:bg-amber-500/20 hover:text-amber-400 border-slate-700 cursor-pointer transition-colors px-4 py-2"
                >
                  {skill.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Credly Embed */}
      {badge.credlyBadgeId && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-xl font-semibold text-white mb-6">Live Badge</h2>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-8 flex justify-center">
              <div 
                data-iframe-width={badge.iframeWidth}
                data-iframe-height={badge.iframeHeight}
                data-share-badge-id={badge.credlyBadgeId}
                data-share-badge-host={badge.credlyHost}
              />
              <script
                async
                type="text/javascript"
                src="//cdn.credly.com/assets/utilities/embed.js"
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
