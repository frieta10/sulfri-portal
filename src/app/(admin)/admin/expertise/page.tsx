"use client"

import { useEffect, useState } from "react"
import { Plus, Edit, Trash2, ChevronRight, ChevronDown, Move } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "react-hot-toast"

interface ExpertiseNode {
  id: string
  title: string
  slug: string
  description: string | null
  parentId: string | null
  domain: string | null
  depth: number
  proficiencyLevel: string
  visibility: string
  displayOrder: number
  children?: ExpertiseNode[]
  badgeMappings?: { badge: { id: string; title: string } }[]
}

export default function ExpertisePage() {
  const [nodes, setNodes] = useState<ExpertiseNode[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [selectedNode, setSelectedNode] = useState<ExpertiseNode | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<ExpertiseNode>>({})
  const [domains, setDomains] = useState<string[]>([])

  useEffect(() => {
    fetchNodes()
  }, [])

  const fetchNodes = async () => {
    try {
      const response = await fetch("/api/admin/expertise")
      if (!response.ok) throw new Error("Failed to fetch expertise nodes")
      const data = await response.json()
      setNodes(data)
      
      // Extract unique domains
      const uniqueDomains = [...new Set(data.map((n: ExpertiseNode) => n.domain).filter(Boolean))]
      setDomains(uniqueDomains as string[])
    } catch (error) {
      toast.error("Failed to load expertise nodes")
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const handleCreate = async () => {
    try {
      const response = await fetch("/api/admin/expertise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!response.ok) throw new Error("Failed to create node")
      toast.success("Expertise node created")
      fetchNodes()
      setSelectedNode(null)
      setFormData({})
    } catch (error) {
      toast.error("Failed to create expertise node")
    }
  }

  const handleUpdate = async () => {
    if (!selectedNode) return
    try {
      const response = await fetch(`/api/admin/expertise/${selectedNode.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!response.ok) throw new Error("Failed to update node")
      toast.success("Expertise node updated")
      fetchNodes()
      setSelectedNode(null)
      setIsEditing(false)
    } catch (error) {
      toast.error("Failed to update expertise node")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this node? This will also delete all child nodes.")) return
    try {
      const response = await fetch(`/api/admin/expertise/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete node")
      toast.success("Expertise node deleted")
      fetchNodes()
    } catch (error) {
      toast.error("Failed to delete expertise node")
    }
  }

  const openCreateDialog = (parentId?: string) => {
    setFormData({
      parentId: parentId || null,
      proficiencyLevel: "FOUNDATION",
      visibility: "PUBLIC",
      displayOrder: 0,
    })
    setIsEditing(false)
    setSelectedNode({} as ExpertiseNode)
  }

  const openEditDialog = (node: ExpertiseNode) => {
    setFormData({ ...node })
    setSelectedNode(node)
    setIsEditing(true)
  }

  const renderNode = (node: ExpertiseNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node.id)
    const badgeCount = node.badgeMappings?.length || 0

    return (
      <div key={node.id} className="select-none">
        <div
          className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-slate-50 cursor-pointer group"
          style={{ paddingLeft: `${level * 24 + 12}px` }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleExpand(node.id)
            }}
            className={`w-6 h-6 flex items-center justify-center rounded ${
              hasChildren ? "hover:bg-slate-200" : ""
            }`}
          >
            {hasChildren && (
              isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            )}
          </button>
          
          <div className="flex-1 flex items-center gap-2">
            <span className="font-medium">{node.title}</span>
            {badgeCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {badgeCount} badge{badgeCount > 1 ? "s" : ""}
              </Badge>
            )}
            {node.visibility === "HIDDEN" && (
              <Badge variant="outline" className="text-xs">Hidden</Badge>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                openCreateDialog(node.id)
              }}
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                openEditDialog(node)
              }}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(node.id)
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  // Build tree structure
  const buildTree = (nodes: ExpertiseNode[]): ExpertiseNode[] => {
    const nodeMap = new Map<string, ExpertiseNode & { children: ExpertiseNode[] }>(
      nodes.map((n) => [n.id, { ...n, children: [] }])
    )
    const roots: (ExpertiseNode & { children: ExpertiseNode[] })[] = []

    nodes.forEach((node) => {
      const fullNode = nodeMap.get(node.id)!
      if (node.parentId && nodeMap.has(node.parentId)) {
        const parent = nodeMap.get(node.parentId)!
        parent.children.push(fullNode)
      } else {
        roots.push(fullNode)
      }
    })

    return roots
  }

  const treeNodes = buildTree(nodes)

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Expertise Management</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={() => openCreateDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Root Node
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Edit Expertise Node" : "Create Expertise Node"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Data Analytics"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug (optional)</Label>
                <Input
                  id="slug"
                  value={formData.slug || ""}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="auto-generated-from-title"
                />
              </div>
              <div>
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={formData.domain || ""}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="e.g., Technology"
                  list="domains"
                />
                <datalist id="domains">
                  {domains.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this expertise area"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="proficiencyLevel">Proficiency Level</Label>
                  <Select
                    value={formData.proficiencyLevel || "FOUNDATION"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, proficiencyLevel: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FOUNDATION">Foundation</SelectItem>
                      <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                      <SelectItem value="ADVANCED">Advanced</SelectItem>
                      <SelectItem value="SPECIALIST">Specialist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select
                    value={formData.visibility || "PUBLIC"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, visibility: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="HIDDEN">Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder || 0}
                  onChange={(e) =>
                    setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedNode(null)}>
                  Cancel
                </Button>
                <Button onClick={isEditing ? handleUpdate : handleCreate}>
                  {isEditing ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expertise Tree</CardTitle>
        </CardHeader>
        <CardContent>
          {treeNodes.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No expertise nodes yet. Click "Add Root Node" to create one.
            </div>
          ) : (
            <div className="space-y-1">
              {treeNodes.map((node) => renderNode(node))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
