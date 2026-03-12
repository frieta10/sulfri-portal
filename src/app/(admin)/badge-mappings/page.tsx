"use client"

import { useEffect, useState } from "react"
import { Link2, Unlink, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-hot-toast"

interface Badge {
  id: string
  title: string
  slug: string
  fallbackImageUrl: string | null
  issuer: string
}

interface ExpertiseNode {
  id: string
  title: string
  slug: string
  domain: string | null
  depth: number
}

interface Mapping {
  badgeId: string
  expertiseNodeId: string
  badge: Badge
  expertiseNode: ExpertiseNode
}

export default function BadgeMappingsPage() {
  const [badges, setBadges] = useState<Badge[]>([])
  const [expertiseNodes, setExpertiseNodes] = useState<ExpertiseNode[]>([])
  const [mappings, setMappings] = useState<Mapping[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBadge, setSelectedBadge] = useState<string>("")
  const [selectedExpertise, setSelectedExpertise] = useState<string>("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch badges
      const badgesRes = await fetch("/api/admin/badges")
      if (!badgesRes.ok) throw new Error("Failed to fetch badges")
      const badgesData = await badgesRes.json()
      setBadges(badgesData)

      // Fetch expertise nodes
      const expertiseRes = await fetch("/api/admin/expertise")
      if (!expertiseRes.ok) throw new Error("Failed to fetch expertise nodes")
      const expertiseData = await expertiseRes.json()
      setExpertiseNodes(expertiseData)

      // Fetch existing mappings
      const mappingsRes = await fetch("/api/admin/badge-expertise-map")
      if (!mappingsRes.ok) throw new Error("Failed to fetch mappings")
      const mappingsData = await mappingsRes.json()
      setMappings(mappingsData)
    } catch (error) {
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMapping = async () => {
    if (!selectedBadge || !selectedExpertise) {
      toast.error("Please select both a badge and an expertise node")
      return
    }

    try {
      const response = await fetch("/api/admin/badge-expertise-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          badgeId: selectedBadge,
          expertiseNodeId: selectedExpertise,
          mappingSource: "MANUAL",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create mapping")
      }

      toast.success("Mapping created successfully")
      fetchData()
      setSelectedBadge("")
      setSelectedExpertise("")
    } catch (error: any) {
      toast.error(error.message || "Failed to create mapping")
    }
  }

  const handleDeleteMapping = async (badgeId: string, expertiseNodeId: string) => {
    if (!confirm("Are you sure you want to remove this mapping?")) return

    try {
      const response = await fetch(
        `/api/admin/badge-expertise-map?badgeId=${badgeId}&expertiseNodeId=${expertiseNodeId}`,
        { method: "DELETE" }
      )

      if (!response.ok) throw new Error("Failed to delete mapping")

      toast.success("Mapping removed")
      fetchData()
    } catch (error) {
      toast.error("Failed to remove mapping")
    }
  }

  // Group expertise nodes by domain for better organization
  const groupedNodes = expertiseNodes.reduce((acc, node) => {
    const domain = node.domain || "Uncategorized"
    if (!acc[domain]) acc[domain] = []
    acc[domain].push(node)
    return acc
  }, {} as Record<string, ExpertiseNode[]>)

  // Group mappings by badge
  const mappingsByBadge = mappings.reduce((acc, mapping) => {
    if (!acc[mapping.badge.id]) {
      acc[mapping.badge.id] = { badge: mapping.badge, expertiseNodes: [] }
    }
    acc[mapping.badge.id].expertiseNodes.push(mapping.expertiseNode)
    return acc
  }, {} as Record<string, { badge: Badge; expertiseNodes: ExpertiseNode[] }>)

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Badge-Expertise Mappings</h1>

      {/* Create Mapping Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Link Badge to Expertise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Badge</label>
              <Select value={selectedBadge} onValueChange={setSelectedBadge}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a badge..." />
                </SelectTrigger>
                <SelectContent>
                  {badges.map((badge) => (
                    <SelectItem key={badge.id} value={badge.id}>
                      {badge.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Select Expertise Node</label>
              <Select value={selectedExpertise} onValueChange={setSelectedExpertise}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an expertise area..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(groupedNodes).map(([domain, nodes]) => (
                    <div key={domain}>
                      <div className="px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100">
                        {domain}
                      </div>
                      {nodes.map((node) => (
                        <SelectItem key={node.id} value={node.id}>
                          {"  ".repeat(node.depth - 1)}{node.title}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleCreateMapping}
            disabled={!selectedBadge || !selectedExpertise}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Mapping
          </Button>
        </CardContent>
      </Card>

      {/* Existing Mappings */}
      <Card>
        <CardHeader>
          <CardTitle>Current Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(mappingsByBadge).length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No mappings yet. Use the form above to link badges to expertise areas.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.values(mappingsByBadge).map(({ badge, expertiseNodes }) => (
                <div
                  key={badge.id}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  {badge.fallbackImageUrl && (
                    <img
                      src={badge.fallbackImageUrl}
                      alt={badge.title}
                      className="w-16 h-16 object-contain rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{badge.title}</h3>
                    <p className="text-sm text-slate-500 mb-2">{badge.issuer}</p>
                    <div className="flex flex-wrap gap-2">
                      {expertiseNodes.map((node) => (
                        <Badge
                          key={node.id}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {node.title}
                          <button
                            onClick={() => handleDeleteMapping(badge.id, node.id)}
                            className="ml-1 hover:text-red-600"
                          >
                            <Unlink className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
