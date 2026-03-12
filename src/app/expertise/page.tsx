"use client"

import { useEffect, useState } from "react"
import { HeadMeta } from "@/components/seo/head-meta"
import { StickyCtaBar, useStickyCtaSettings } from "@/components/mobile/sticky-cta-bar"
import { useRouter } from "next/navigation"
import { Search, Award, BookOpen, Grid3X3, List } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "react-hot-toast"

interface ExpertiseNode {
  id: string
  title: string
  slug: string
  description: string | null
  domain: string | null
  proficiencyLevel: string
  badgeCount: number
  children: ExpertiseNode[]
}

function ExpertisePageContent() {
  const { settings: ctaSettings, loading: ctaLoading } = useStickyCtaSettings()
  const [nodes, setNodes] = useState<ExpertiseNode[]>([])
  const [filteredNodes, setFilteredNodes] = useState<ExpertiseNode[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDomain, setSelectedDomain] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"tree" | "list">("tree")
  const router = useRouter()

  useEffect(() => {
    fetchExpertiseTree()
  }, [])

  useEffect(() => {
    filterNodes()
  }, [nodes, searchTerm, selectedDomain])

  const fetchExpertiseTree = async () => {
    try {
      const response = await fetch("/api/expertise/tree")
      if (!response.ok) throw new Error("Failed to fetch expertise tree")
      const data = await response.json()
      setNodes(data)
    } catch (error) {
      toast.error("Failed to load expertise data")
    } finally {
      setLoading(false)
    }
  }

  const filterNodes = () => {
    let filtered = [...nodes]

    if (selectedDomain !== "all") {
      filtered = filtered.filter((node) => node.domain === selectedDomain)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (node) =>
          node.title.toLowerCase().includes(term) ||
          node.description?.toLowerCase().includes(term) ||
          node.children.some(
            (child) =>
              child.title.toLowerCase().includes(term) ||
              child.description?.toLowerCase().includes(term)
          )
      )
    }

    setFilteredNodes(filtered)
  }

  const domains = [...new Set(nodes.map((n) => n.domain).filter((d): d is string => Boolean(d)))]

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

  const renderTreeNode = (node: ExpertiseNode, level: number = 0) => (
    <div
      key={node.id}
      className={`relative ${level > 0 ? "ml-8 border-l-2 border-slate-200 pl-4" : ""}`}
    >
      <Card
        className={`cursor-pointer hover:shadow-lg transition-shadow ${
          level === 0 ? "border-l-4 border-l-blue-500" : ""
        }`}
        onClick={() => router.push(`/expertise/${node.slug}`)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">{node.title}</h3>
                <Badge className={getProficiencyColor(node.proficiencyLevel)}>
                  {node.proficiencyLevel.toLowerCase()}
                </Badge>
              </div>
              {node.description && (
                <p className="text-sm text-slate-600 line-clamp-2">{node.description}</p>
              )}
              {node.domain && (
                <Badge variant="outline" className="mt-2 text-xs">
                  {node.domain}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4">
              {node.badgeCount > 0 && (
                <div className="flex items-center gap-1 text-amber-600">
                  <Award className="w-5 h-5" />
                  <span className="font-medium">{node.badgeCount}</span>
                </div>
              )}
              <BookOpen className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {node.children.length > 0 && (
        <div className="mt-4 space-y-4">
          {node.children.map((child) => renderTreeNode(child, level + 1))}
        </div>
      )}
    </div>
  )

  const renderListItem = (node: ExpertiseNode) => (
    <div
      key={node.id}
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 cursor-pointer"
      onClick={() => router.push(`/expertise/${node.slug}`)}
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold">{node.title}</h3>
          <Badge className={getProficiencyColor(node.proficiencyLevel)}>
            {node.proficiencyLevel.toLowerCase()}
          </Badge>
        </div>
        {node.description && (
          <p className="text-sm text-slate-600">{node.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          {node.domain && <Badge variant="outline">{node.domain}</Badge>}
          {node.badgeCount > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Award className="w-3 h-3" />
              {node.badgeCount} badge{node.badgeCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>
      <BookOpen className="w-5 h-5 text-slate-400" />
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Training Expertise</h1>
          <p className="text-lg text-slate-600">
            Explore my professional skills and verified credentials
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search expertise areas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedDomain === "all" ? "default" : "outline"}
              onClick={() => setSelectedDomain("all")}
            >
              All
            </Button>
            {domains.map((domain) => (
              <Button
                key={domain}
                variant={selectedDomain === domain ? "default" : "outline"}
                onClick={() => setSelectedDomain(domain)}
              >
                {domain}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "tree" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("tree")}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {filteredNodes.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No expertise areas found</h3>
            <p className="text-slate-500">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Expertise areas will appear here once added"}
            </p>
          </div>
        ) : viewMode === "tree" ? (
          <div className="space-y-6">
            {filteredNodes.map((node) => renderTreeNode(node))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNodes.map((node) => renderListItem(node))}
          </div>
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
    </div>
  )
}

export default function ExpertisePage() {
  return (
    <>
      <HeadMeta
        title="Training Expertise"
        description="Explore professional training expertise areas. From Project Management to Digital Technology - structured programmes for organizational excellence."
        canonical="/expertise"
      />
      <ExpertisePageContent />
    </>
  )
}
