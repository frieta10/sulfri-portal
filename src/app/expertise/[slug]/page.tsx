"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Award, ExternalLink, BookOpen, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "react-hot-toast"

interface Badge {
  id: string
  title: string
  slug: string
  description: string | null
  issuer: string
  issueDate: string | null
  fallbackImageUrl: string | null
  verificationUrl: string | null
  embedCode: string | null
}

interface ExpertiseNode {
  id: string
  title: string
  slug: string
  description: string | null
  domain: string | null
  proficiencyLevel: string
  parent: { id: string; title: string; slug: string } | null
  children: { id: string; title: string; slug: string; proficiencyLevel: string; description: string | null }[]
  badges: Badge[]
  assets: { id: string; title: string; url: string; assetType: string }[]
}

export default function ExpertiseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [node, setNode] = useState<ExpertiseNode | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.slug) {
      fetchExpertiseNode()
    }
  }, [params.slug])

  const fetchExpertiseNode = async () => {
    try {
      const response = await fetch(`/api/expertise/${params.slug}`)
      if (!response.ok) {
        if (response.status === 404) {
          router.push("/expertise")
          return
        }
        throw new Error("Failed to fetch expertise node")
      }
      const data = await response.json()
      setNode(data)
    } catch (error) {
      toast.error("Failed to load expertise details")
    } finally {
      setLoading(false)
    }
  }

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case "FOUNDATION":
        return "bg-blue-100 text-blue-800"
      case "INTERMEDIATE":
        return "bg-green-100 text-green-800"
      case "ADVANCED":
        return "bg-orange-100 text-orange-800"
      case "SPECIALIST":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAssetIcon = (type: string) => {
    switch (type) {
      case "OUTLINE":
        return <FileText className="w-5 h-5" />
      case "SAMPLE":
        return <BookOpen className="w-5 h-5" />
      case "CASE_STUDY":
        return <Award className="w-5 h-5" />
      default:
        return <ExternalLink className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!node) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Expertise not found</h2>
          <Link href="/expertise" className="text-blue-600 hover:underline">
            Back to expertise tree
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link
            href="/expertise"
            className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Expertise Tree
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-slate-900">{node.title}</h1>
            <Badge className={getProficiencyColor(node.proficiencyLevel)}>
              {node.proficiencyLevel}
            </Badge>
          </div>
          {node.domain && (
            <Badge variant="outline" className="mt-2">
              {node.domain}
            </Badge>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Description */}
        {node.description && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-2">About</h2>
              <p className="text-slate-700 leading-relaxed">{node.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Supporting Badges */}
        {node.badges.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Verified Credentials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {node.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-slate-50"
                  >
                    {badge.fallbackImageUrl && (
                      <img
                        src={badge.fallbackImageUrl}
                        alt={badge.title}
                        className="w-20 h-20 object-contain"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">{badge.title}</h3>
                      <p className="text-sm text-slate-500">{badge.issuer}</p>
                      {badge.issueDate && (
                        <p className="text-xs text-slate-400 mt-1">
                          Issued: {new Date(badge.issueDate).toLocaleDateString()}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Link href={`/badges/${badge.slug}`}>
                          <Button variant="outline" size="sm">
                            View Badge
                          </Button>
                        </Link>
                        {badge.verificationUrl && (
                          <a
                            href={badge.verificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Verify
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Related Assets */}
        {node.assets.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {node.assets.map((asset) => (
                  <a
                    key={asset.id}
                    href={asset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50"
                  >
                    {getAssetIcon(asset.assetType)}
                    <span className="flex-1 font-medium">{asset.title}</span>
                    <Badge variant="outline">{asset.assetType}</Badge>
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Related Topics */}
        {node.children.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Related Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {node.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/expertise/${child.slug}`}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50"
                  >
                    <div>
                      <h4 className="font-medium">{child.title}</h4>
                      {child.description && (
                        <p className="text-sm text-slate-500 line-clamp-1">
                          {child.description}
                        </p>
                      )}
                    </div>
                    <Badge className={getProficiencyColor(child.proficiencyLevel)}>
                      {child.proficiencyLevel}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
