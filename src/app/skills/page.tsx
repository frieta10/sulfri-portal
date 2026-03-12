"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"

import { 
  Award, 
  Search, 
  Star, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Target,
  Shield,
  Zap,
  Layers,
  ChevronRight,
  ExternalLink,
  Lock,
  Unlock,
  Trophy,
  Clock,
  Plus,
  Minus,
  RotateCcw,
  MousePointer2
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import "./skills.css"
import Link from "next/link"

// ============================================
// TYPES
// ============================================

interface Badge {
  id: string
  title: string
  slug: string
  issuer: string
  issueDate?: string
  credlyBadgeId: string
  fallbackImageUrl?: string
  verificationUrl?: string
}

interface Skill {
  id: string
  name: string
  slug: string
  description?: string
  _count?: { badgeSkills: number }
  badges?: { badge: Badge }[]
}

interface ClassData {
  id: string
  title: string
  topicCategory: string
  clientName: string
  mode: string
  startDatetime: string
}

interface Domain {
  id: string
  name: string
  icon: string
  color: string
  topics: string[]
}

interface TreeNode {
  id: string
  name: string
  type: "root" | "domain" | "topic"
  level: number
  angle: number
  radius: number
  color: string
  x: number
  y: number
  parentId?: string
  classCount: number
  badgeCount: number
  description?: string
  badges?: Badge[]
  classes?: ClassData[]
}

interface Achievement {
  id: string
  icon: string
  label: string
  description: string
  unlocked: boolean
}

// ============================================
// CONSTANTS
// ============================================

const DOMAINS: Domain[] = [
  {
    id: "management",
    name: "Management & Leadership",
    icon: "👔",
    color: "#f59e0b",
    topics: ["leadership", "Management", "Agile / Scrum", "Project Management", "Process Improvement", "Career Development", "Professional Skills"]
  },
  {
    id: "technology",
    name: "Technology & Engineering",
    icon: "⚙️",
    color: "#3b82f6",
    topics: ["Programming", "Cloud Computing", "Emerging Technology", "Digital Transformation", "Automation / RPA"]
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity",
    icon: "🔒",
    color: "#ef4444",
    topics: ["Cybersecurity"]
  },
  {
    id: "data",
    name: "Data & AI",
    icon: "📊",
    color: "#8b5cf6",
    topics: ["Data Analytics & Visualization", "Data Analytics & AI", "Data Management", "AI / Automation", "AI / Prompt Engineering", "AI Fundamentals"]
  },
  {
    id: "productivity",
    name: "Productivity & Collaboration",
    icon: "🤝",
    color: "#10b981",
    topics: ["Microsoft Office Productivity", "Productivity / Collaboration"]
  }
]

const LEVELS = [
  { level: 1, title: "Trainee", minXP: 0, color: "#6b7280" },
  { level: 2, title: "Practitioner", minXP: 200, color: "#10b981" },
  { level: 3, title: "Specialist", minXP: 500, color: "#3b82f6" },
  { level: 4, title: "Expert", minXP: 1000, color: "#8b5cf6" },
  { level: 5, title: "Master Trainer", minXP: 2000, color: "#f59e0b" }
]

const ACHIEVEMENTS = [
  { id: "first_badge", icon: "🎓", label: "First Badge", description: "Earned your first credential" },
  { id: "triple", icon: "🏆", label: "Triple Threat", description: "Earned 3 or more badges" },
  { id: "decade", icon: "📚", label: "Decade Trainer", description: "Delivered 10 or more classes" },
  { id: "multi_domain", icon: "🌟", label: "Multi-Domain", description: "Active in 3 or more domains" },
  { id: "expert_level", icon: "💎", label: "Expert Level", description: "Delivered 50 or more classes" }
]

// ============================================
// GAMIFICATION HOOK
// ============================================

function useGamification(badges: Badge[], classes: ClassData[]) {
  return useMemo(() => {
    // Ensure arrays
    const safeBadges = Array.isArray(badges) ? badges : []
    const safeClasses = Array.isArray(classes) ? classes : []
    
    const badgeCount = safeBadges.length
    const classCount = safeClasses.length
    const xp = (badgeCount * 100) + (classCount * 10)
    
    const currentLevel = LEVELS.slice().reverse().find(l => xp >= l.minXP) || LEVELS[0]
    const nextLevel = LEVELS.find(l => l.minXP > xp)
    const levelProgress = nextLevel 
      ? ((xp - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100
      : 100
    
    const xpToNext = nextLevel ? nextLevel.minXP - xp : 0
    
    // Calculate active domains
    const domainCounts: Record<string, number> = {}
    safeClasses.forEach(c => {
      if (!c.topicCategory) return
      const domain = DOMAINS.find(d => d.topics.some(t => 
        c.topicCategory.toLowerCase().includes(t.toLowerCase())
      ))
      if (domain) {
        domainCounts[domain.id] = (domainCounts[domain.id] || 0) + 1
      }
    })
    const activeDomains = Object.keys(domainCounts).length
    
    // Check achievements
    const achievements: Achievement[] = ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: 
        (a.id === "first_badge" && badgeCount >= 1) ||
        (a.id === "triple" && badgeCount >= 3) ||
        (a.id === "decade" && classCount >= 10) ||
        (a.id === "multi_domain" && activeDomains >= 3) ||
        (a.id === "expert_level" && classCount >= 50)
    }))
    
    return { xp, currentLevel, nextLevel, levelProgress, xpToNext, achievements, badgeCount, classCount, activeDomains }
  }, [badges, classes])
}

// ============================================
// TREE COMPUTATION
// ============================================

function computeTreeData(classes: ClassData[], badges: Badge[], skills: Skill[]): TreeNode[] {
  const nodes: TreeNode[] = []
  
  // Validate inputs
  if (!Array.isArray(classes) || !Array.isArray(badges) || !Array.isArray(skills)) {
    return nodes
  }
  
  // Root node
  nodes.push({
    id: "root",
    name: "Mohd Sulfri",
    type: "root",
    level: 0,
    angle: 0,
    radius: 0,
    color: "#f59e0b",
    x: 0,
    y: 0,
    classCount: classes.length,
    badgeCount: badges.length
  })
  
  // Domain nodes
  const domainRadius = 140
  DOMAINS.forEach((domain, index) => {
    const angle = (index / DOMAINS.length) * 2 * Math.PI - Math.PI / 2
    const classCount = classes.filter(c => 
      c.topicCategory && domain.topics.some(t => 
        c.topicCategory.toLowerCase().includes(t.toLowerCase())
      )
    ).length
    
    nodes.push({
      id: domain.id,
      name: domain.name,
      type: "domain",
      level: 1,
      angle,
      radius: domainRadius,
      color: domain.color,
      x: Math.cos(angle) * domainRadius,
      y: Math.sin(angle) * domainRadius,
      parentId: "root",
      classCount,
      badgeCount: 0
    })
  })
  
  // Topic nodes
  const topicRadius = 280
  const topicCategories = Array.from(new Set(classes.map(c => c.topicCategory).filter(Boolean)))
  
  topicCategories.forEach((topic, index) => {
    if (!topic) return
    
    const domain = DOMAINS.find(d => 
      d.topics.some(t => topic.toLowerCase().includes(t.toLowerCase()))
    ) || DOMAINS[0]
    
    const parentDomain = nodes.find(n => n.id === domain.id)
    if (!parentDomain) return
    
    const topicClasses = classes.filter(c => c.topicCategory === topic)
    const topicBadges = badges.filter(b => 
      skills.some(s => 
        s.badges?.some(sb => sb.badge?.id === b.id) &&
        s.name?.toLowerCase().includes(topic.toLowerCase())
      )
    )
    
    // Calculate angle based on parent domain with offset
    const siblingTopics = topicCategories.filter(t => {
      const tDomain = DOMAINS.find(d => d.topics.some(top => t?.toLowerCase().includes(top.toLowerCase())))
      return tDomain?.id === domain.id
    })
    const siblingIndex = siblingTopics.indexOf(topic)
    const angleSpread = Math.PI / 3 // 60 degrees spread
    
    // Safe angle calculation - avoid division by zero
    const siblingCount = Math.max(siblingTopics.length, 1)
    const divisor = Math.max(siblingCount - 1, 1)
    const angleOffset = siblingCount === 1 
      ? 0 
      : (siblingIndex - (siblingCount - 1) / 2) * (angleSpread / divisor)
    const angle = parentDomain.angle + angleOffset
    
    nodes.push({
      id: `topic-${index}`,
      name: topic,
      type: "topic",
      level: 2,
      angle,
      radius: topicRadius,
      color: domain.color,
      x: Math.cos(angle) * topicRadius,
      y: Math.sin(angle) * topicRadius,
      parentId: domain.id,
      classCount: topicClasses.length,
      badgeCount: topicBadges.length,
      description: `Training delivered in ${topic}`,
      badges: topicBadges,
      classes: topicClasses
    })
  })
  
  return nodes
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function SkillsPage() {
  // Data states
  const [badges, setBadges] = useState<Badge[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [classes, setClasses] = useState<ClassData[]>([])
  const [expertiseNodes, setExpertiseNodes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // UI states
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("wallet")
  
  // Tree states
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Gamification
  const gamification = useGamification(badges, classes)
  
  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [badgesRes, skillsRes, classesRes, expertiseRes] = await Promise.all([
          fetch("/api/badges?limit=100"),
          fetch("/api/skills?withBadges=true&limit=100"),
          fetch("/api/experience?limit=200"),
          fetch("/api/expertise/tree")
        ])
        
        if (expertiseRes.ok) {
          const data = await expertiseRes.json()
          setExpertiseNodes(data || [])
        }
        
        if (badgesRes.ok) {
          const data = await badgesRes.json()
          setBadges(data.badges || [])
        }
        if (skillsRes.ok) {
          const data = await skillsRes.json()
          setSkills(data.skills || [])
        }
        if (classesRes.ok) {
          const data = await classesRes.json()
          setClasses(data.classes || [])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  // Compute tree
  const treeNodes = useMemo(() => {
    if (classes.length === 0) return []
    return computeTreeData(classes, badges, skills)
  }, [classes, badges, skills])
  
  // Filtered skills
  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      if (!skill.name) return false
      const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesDomain = selectedDomain 
        ? DOMAINS.find(d => d.id === selectedDomain)?.topics.some(t => 
            skill.name.toLowerCase().includes(t.toLowerCase())
          )
        : true
      return matchesSearch && matchesDomain
    })
  }, [skills, searchQuery, selectedDomain])
  
  // Domain class counts
  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    DOMAINS.forEach(domain => {
      counts[domain.id] = classes.filter(c => 
        c.topicCategory && domain.topics.some(t => 
          c.topicCategory.toLowerCase().includes(t.toLowerCase())
        )
      ).length
    })
    return counts
  }, [classes])
  
  // Pan and zoom handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as Element).tagName === "svg") {
      setIsDragging(true)
    }
  }, [])
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }))
    }
  }, [isDragging])
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])
  
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(prev => Math.max(0.4, Math.min(2.0, prev * delta)))
  }, [])
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading Skills Wallet...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">MSH</span>
              </div>
              <span className="font-semibold text-white hidden sm:inline">Mohd Sulfri</span>
            </Link>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {["Expertise", "Experience", "Clients"].map((item) => (
                <Link
                  key={item}
                  href={`/#${item.toLowerCase()}`}
                  className="px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                >
                  {item}
                </Link>
              ))}
              <Link
                href="/badges"
                className="px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
              >
                Credentials
              </Link>
              <Link
                href="/skills"
                className="px-3 py-2 text-sm text-green-400 bg-green-500/10 rounded-md transition-colors"
              >
                Skills
              </Link>
              <Link
                href="/downloads-public"
                className="px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
              >
                Resources
              </Link>
            </nav>
            
            {/* Back button */}
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
          </div>
        </div>
      </header>
      {/* Hero Header with Gamification */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Level & XP Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-4"
                style={{ 
                  backgroundColor: `${gamification.currentLevel.color}20`,
                  borderColor: gamification.currentLevel.color,
                  color: gamification.currentLevel.color
                }}
              >
                {gamification.currentLevel.level}
              </div>
              <div>
                <p className="text-sm text-slate-400">Current Level</p>
                <h2 
                  className="text-2xl font-bold"
                  style={{ color: gamification.currentLevel.color }}
                >
                  {gamification.currentLevel.title}
                </h2>
              </div>
            </div>
            
            <div className="flex-1 max-w-md">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">{gamification.xp.toLocaleString()} XP</span>
                {gamification.nextLevel && (
                  <span className="text-slate-500">{gamification.xpToNext} XP to {gamification.nextLevel.title}</span>
                )}
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${gamification.levelProgress}%`,
                    background: `linear-gradient(90deg, ${gamification.currentLevel.color}, ${gamification.nextLevel?.color || gamification.currentLevel.color})`,
                    boxShadow: `0 0 10px ${gamification.currentLevel.color}50`
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Stats & Achievements */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard icon={Award} value={gamification.badgeCount} label="Badges" color="amber" />
            <StatCard icon={BookOpen} value={skills.length} label="Skills" color="purple" />
            <StatCard icon={Users} value={gamification.classCount} label="Classes" color="blue" />
            <StatCard icon={Layers} value={gamification.activeDomains} label="Domains" color="green" />
          </div>
          
          {/* Achievements */}
          <div className="flex flex-wrap gap-3">
            {gamification.achievements.map(achievement => (
              <div
                key={achievement.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                  achievement.unlocked 
                    ? "bg-amber-500/10 border-amber-500/50 text-amber-400" 
                    : "bg-slate-800/50 border-slate-700 text-slate-600 grayscale opacity-50"
                )}
                title={`${achievement.label}: ${achievement.description}`}
              >
                <span className="text-lg">{achievement.icon}</span>
                <span className="text-sm font-medium hidden sm:inline">{achievement.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-900 border border-green-500/20 mb-6">
            <TabsTrigger 
              value="wallet" 
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
            >
              <Award className="w-4 h-4 mr-2" />
              Skills Wallet
            </TabsTrigger>
            <TabsTrigger 
              value="tree"
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
            >
              <Target className="w-4 h-4 mr-2" />
              Skill Tree
            </TabsTrigger>
            <TabsTrigger 
              value="expertise"
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Expertise Areas
            </TabsTrigger>
          </TabsList>

          {/* Skills Wallet Tab */}
          <TabsContent value="wallet" className="space-y-6">
            {/* Domain Filter Chips */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedDomain(null)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  selectedDomain === null
                    ? "bg-green-500/20 text-green-400 border border-green-500/50"
                    : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"
                )}
              >
                All Domains
              </button>
              {DOMAINS.map(domain => (
                <button
                  key={domain.id}
                  onClick={() => setSelectedDomain(selectedDomain === domain.id ? null : domain.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                    selectedDomain === domain.id
                      ? "text-white border-2"
                      : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600"
                  )}
                  style={{
                    backgroundColor: selectedDomain === domain.id ? `${domain.color}20` : undefined,
                    borderColor: selectedDomain === domain.id ? domain.color : undefined,
                    color: selectedDomain === domain.id ? domain.color : undefined
                  }}
                >
                  <span>{domain.icon}</span>
                  <span className="hidden sm:inline">{domain.name}</span>
                  <span className="text-xs opacity-70">({domainCounts[domain.id] || 0})</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input
                placeholder="Search skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900 border-green-500/20 text-white placeholder:text-slate-500"
              />
            </div>

            {/* Badges Section */}
            {badges.filter(Boolean).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-400" />
                  Verified Badges
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {badges.filter(Boolean).map(badge => (
                    <BadgeCard key={badge.id || Math.random()} badge={badge} />
                  ))}
                </div>
              </div>
            )}

            {/* Skills Section */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-400" />
                Skill Areas
              </h3>
              {filteredSkills.length === 0 ? (
                <div className="text-center py-12 bg-slate-900/50 rounded-lg border border-green-500/10">
                  <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No skills found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSkills.map(skill => {
                    const skillName = skill.name || ""
                    const domain = DOMAINS.find(d => 
                      d.topics.some(t => skillName.toLowerCase().includes(t.toLowerCase()))
                    ) || DOMAINS[0]
                    
                    return (
                      <SkillCard 
                        key={skill.id} 
                        skill={skill} 
                        domain={domain}
                        classCount={classes.filter(c => 
                          c.topicCategory && c.topicCategory.toLowerCase().includes(skillName.toLowerCase())
                        ).length}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Skill Tree Tab */}
          <TabsContent value="tree">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tree Canvas */}
              <div className="lg:col-span-2">
                <div 
                  ref={containerRef}
                  className="relative bg-slate-900 rounded-xl border border-green-500/20 overflow-hidden"
                  style={{ height: "600px" }}
                >
                  {/* Controls */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                    <button
                      onClick={() => setZoom(prev => Math.min(2.0, prev * 1.2))}
                      className="w-10 h-10 bg-slate-800 border border-green-500/20 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors"
                    >
                      <Plus className="w-5 h-5 text-green-400" />
                    </button>
                    <button
                      onClick={() => setZoom(prev => Math.max(0.4, prev / 1.2))}
                      className="w-10 h-10 bg-slate-800 border border-green-500/20 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors"
                    >
                      <Minus className="w-5 h-5 text-green-400" />
                    </button>
                    <button
                      onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
                      className="w-10 h-10 bg-slate-800 border border-green-500/20 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors"
                    >
                      <RotateCcw className="w-5 h-5 text-green-400" />
                    </button>
                  </div>
                  
                  {/* Legend */}
                  <div className="absolute bottom-4 left-4 bg-slate-800/90 backdrop-blur border border-green-500/20 rounded-lg p-3 z-10">
                    <p className="text-xs text-slate-400 mb-2">Domains</p>
                    <div className="space-y-1">
                      {DOMAINS.map(d => (
                        <div key={d.id} className="flex items-center gap-2 text-xs">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-slate-300">{d.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* SVG Tree */}
                  <svg
                    ref={svgRef}
                    className="w-full h-full cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                  >
                    <defs>
                      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    
                    <g transform={`translate(${300 + pan.x}, ${300 + pan.y}) scale(${zoom})`}>
                      {/* Edges */}
                      {treeNodes.map(node => {
                        if (!node.parentId) return null
                        const parent = treeNodes.find(n => n.id === node.parentId)
                        if (!parent) return null
                        
                        return (
                          <line
                            key={`edge-${node.id}`}
                            x1={parent.x}
                            y1={parent.y}
                            x2={node.x}
                            y2={node.y}
                            stroke={node.color}
                            strokeOpacity={selectedNode?.id === node.id || selectedNode?.id === parent.id ? 0.8 : 0.25}
                            strokeWidth={selectedNode?.id === node.id || selectedNode?.id === parent.id ? 2 : 1}
                            strokeDasharray={node.type === "topic" ? "4 4" : undefined}
                          />
                        )
                      })}
                      
                      {/* Nodes */}
                      {treeNodes.map(node => (
                        <g 
                          key={node.id}
                          transform={`translate(${node.x}, ${node.y})`}
                          className="cursor-pointer"
                          onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
                        >
                          {/* Glow effect for selected/hovered */}
                          {selectedNode?.id === node.id && (
                            <circle
                              r={node.type === "root" ? 45 : node.type === "domain" ? 32 : 24}
                              fill={node.color}
                              opacity={0.2}
                              filter="url(#glow)"
                            />
                          )}
                          
                          {/* Node circle */}
                          <circle
                            r={node.type === "root" ? 38 : node.type === "domain" ? 26 : 18}
                            fill={selectedNode?.id === node.id ? `${node.color}40` : `${node.color}20`}
                            stroke={node.color}
                            strokeWidth={selectedNode?.id === node.id ? 3 : 2}
                          />
                          
                          {/* Badge indicator dot */}
                          {node.badgeCount > 0 && (
                            <circle
                              cx={node.type === "root" ? 30 : node.type === "domain" ? 20 : 14}
                              cy={-10}
                              r={4}
                              fill="#f59e0b"
                            />
                          )}
                          
                          {/* Root star */}
                          {node.type === "root" && (
                            <text textAnchor="middle" dy="0.35em" fontSize="20">⭐</text>
                          )}
                          
                          {/* Class count */}
                          {node.type !== "root" && (
                            <text 
                              textAnchor="middle" 
                              dy="0.35em" 
                              fontSize={node.type === "domain" ? "12" : "10"}
                              fill="white"
                              fontWeight="bold"
                            >
                              {node.classCount}
                            </text>
                          )}
                          
                          {/* Label */}
                          <text
                            y={node.type === "root" ? 50 : node.type === "domain" ? 40 : 30}
                            textAnchor="middle"
                            fontSize={node.type === "root" ? "14" : "11"}
                            fill={node.type === "root" ? "#f59e0b" : "#94a3b8"}
                            fontWeight={node.type === "root" ? "bold" : "normal"}
                          >
                            {node.name.length > 20 ? node.name.slice(0, 20) + "..." : node.name}
                          </text>
                        </g>
                      ))}
                    </g>
                  </svg>
                </div>
              </div>
              
              {/* Detail Panel */}
              <div className="bg-slate-900 rounded-xl border border-green-500/20 p-6">
                {selectedNode ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">{selectedNode.name}</h3>
                      <button 
                        onClick={() => setSelectedNode(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <p className="text-sm text-slate-400 mb-4">{selectedNode.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-slate-800 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-green-400">{selectedNode.classCount}</p>
                        <p className="text-xs text-slate-500">Classes</p>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-amber-400">{selectedNode.badgeCount}</p>
                        <p className="text-xs text-slate-500">Badges</p>
                      </div>
                    </div>
                    
                    {selectedNode.badges && selectedNode.badges.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-slate-300 mb-2">Supporting Badges</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedNode.badges.filter(Boolean).slice(0, 5).map((badge, idx) => (
                            <div 
                              key={badge.id || idx}
                              className="w-10 h-10 bg-slate-800 rounded-lg overflow-hidden"
                              title={badge.title || "Badge"}
                            >
                              {badge.fallbackImageUrl ? (
                                <img 
                                  src={badge.fallbackImageUrl} 
                                  alt={badge.title || ""}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Award className="w-full h-full p-2 text-slate-600" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedNode.classes && selectedNode.classes.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-slate-300 mb-2">Training Classes</p>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {selectedNode.classes.slice(0, 10).map(cls => (
                            <div key={cls.id} className="bg-slate-800 rounded-lg p-3 text-sm">
                              <p className="font-medium text-white truncate">{cls.title}</p>
                              <p className="text-slate-500">{cls.clientName}</p>
                              <p className="text-xs text-slate-600">
                                {new Date(cls.startDatetime).getFullYear()}
                              </p>
                            </div>
                          ))}
                          {selectedNode.classes.length > 10 && (
                            <p className="text-center text-xs text-slate-500">
                              +{selectedNode.classes.length - 10} more
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MousePointer2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 mb-2">Click any node to explore</p>
                    <p className="text-sm text-slate-600">Drag to pan • Scroll to zoom</p>
                    
                    <div className="mt-6 pt-6 border-t border-slate-800">
                      <p className="text-sm font-medium text-slate-400 mb-3">Domain Stats</p>
                      <div className="space-y-2">
                        {DOMAINS.map(domain => (
                          <div key={domain.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: domain.color }} />
                              <span className="text-slate-300">{domain.name}</span>
                            </div>
                            <span className="text-slate-500">{domainCounts[domain.id] || 0} classes</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Expertise Areas Tab - Card Grid */}
          <TabsContent value="expertise" className="space-y-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-400" />
                Training Expertise Tree
              </h3>
              <p className="text-slate-400 text-sm">
                Hierarchical view of training domains and specialized topic areas
              </p>
            </div>
            
            {expertiseNodes.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/50 rounded-lg border border-green-500/10">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No expertise areas found</p>
              </div>
            ) : (
              <div className="space-y-8">
                {expertiseNodes.map((node) => (
                  <div key={node.id} className="space-y-4">
                    {/* Domain Header */}
                    <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                        style={{ 
                          backgroundColor: `${DOMAINS.find(d => d.name === node.domain)?.color || '#3b82f6'}20`,
                          color: DOMAINS.find(d => d.name === node.domain)?.color || '#3b82f6'
                        }}
                      >
                        {DOMAINS.find(d => d.name === node.domain)?.icon || '📚'}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white">{node.title}</h4>
                        <p className="text-sm text-slate-500">{node.domain} • {node.children?.length || 0} topics</p>
                      </div>
                      {node.badgeCount > 0 && (
                        <div className="ml-auto flex items-center gap-1 text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full text-sm">
                          <Award className="w-4 h-4" />
                          <span>{node.badgeCount} badges</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Topic Cards Grid */}
                    {node.children && node.children.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {node.children.map((child: any) => {
                          const domainColor = DOMAINS.find(d => d.name === node.domain)?.color || '#3b82f6'
                          return (
                            <Card 
                              key={child.id}
                              className="bg-slate-900 border-slate-800 hover:border-green-500/30 transition-all cursor-pointer group"
                              onClick={() => window.location.href = `/expertise/${child.slug}`}
                            >
                              <div className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div 
                                    className="w-8 h-8 rounded flex items-center justify-center text-sm"
                                    style={{ backgroundColor: `${domainColor}20`, color: domainColor }}
                                  >
                                    {child.title.charAt(0)}
                                  </div>
                                  <span className="text-xs text-slate-600 uppercase tracking-wider">
                                    {child.proficiencyLevel}
                                  </span>
                                </div>
                                
                                <h5 className="font-semibold text-white mb-2 group-hover:text-green-400 transition-colors">
                                  {child.title}
                                </h5>
                                
                                {child.description && (
                                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                                    {child.description}
                                  </p>
                                )}
                                
                                <div className="flex items-center gap-3 text-xs">
                                  {child.badgeCount > 0 && (
                                    <span className="flex items-center gap-1 text-amber-400">
                                      <Award className="w-3 h-3" />
                                      {child.badgeCount}
                                    </span>
                                  )}
                                  <span className="text-slate-600 flex items-center gap-1">
                                    <BookOpen className="w-3 h-3" />
                                    View details →
                                  </span>
                                </div>
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">MSH</span>
              </div>
              <span className="text-slate-400 text-sm">© 2025 Mohd Sulfri. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">
                Home
              </Link>
              <Link href="/badges" className="text-slate-400 hover:text-white text-sm transition-colors">
                Credentials
              </Link>
              <Link href="/downloads-public" className="text-slate-400 hover:text-white text-sm transition-colors">
                Resources
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

function StatCard({ icon: Icon, value, label, color }: { icon: any, value: number, label: string, color: string }) {
  const colorMap: Record<string, string> = {
    amber: "text-amber-400 border-amber-500/20 bg-amber-500/10",
    purple: "text-purple-400 border-purple-500/20 bg-purple-500/10",
    blue: "text-blue-400 border-blue-500/20 bg-blue-500/10",
    green: "text-green-400 border-green-500/20 bg-green-500/10",
  }
  
  return (
    <Card className={`p-4 border ${colorMap[color]}`}>
      <div className="flex items-center gap-3">
        <Icon className="w-8 h-8" />
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm opacity-70">{label}</p>
        </div>
      </div>
    </Card>
  )
}

function BadgeCard({ badge }: { badge: Badge }) {
  if (!badge) return null
  
  return (
    <Card className="p-4 bg-slate-900 border-green-500/20 hover:border-amber-500/50 transition-all group">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
          {badge.fallbackImageUrl ? (
            <img 
              src={badge.fallbackImageUrl} 
              alt={badge.title || "Badge"}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <Award className="w-full h-full p-4 text-slate-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white text-sm line-clamp-2 group-hover:text-amber-400 transition-colors">
            {badge.title || "Untitled Badge"}
          </h4>
          <p className="text-xs text-slate-500 mt-1">{badge.issuer || "Unknown Issuer"}</p>
          {badge.issueDate && (
            <p className="text-xs text-slate-600 mt-1">
              {new Date(badge.issueDate).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
      
      {badge.credlyBadgeId && (
        <a
          href={`https://www.credly.com/badges/${badge.credlyBadgeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ExternalLink className="w-3 h-3" />
          Verify
        </a>
      )}
    </Card>
  )
}

function SkillCard({ skill, domain, classCount }: { skill: Skill, domain: Domain, classCount: number }) {
  return (
    <Card className="p-4 bg-slate-900 border-green-500/20 hover:border-green-500/40 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
          style={{ backgroundColor: `${domain.color}20`, color: domain.color }}
        >
          {domain.icon}
        </div>
        {skill.badges && skill.badges.length > 0 && (
          <div className="flex -space-x-2">
            {skill.badges.slice(0, 3).map((item, idx) => {
              const badge = item?.badge
              if (!badge) return null
              return (
                <div 
                  key={badge.id || idx}
                  className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 overflow-hidden"
                >
                  {badge.fallbackImageUrl ? (
                    <img src={badge.fallbackImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Award className="w-full h-full p-1 text-slate-600" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      <h4 className="font-semibold text-white mb-1">{skill.name || "Unnamed Skill"}</h4>
      {skill.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{skill.description}</p>
      )}
      
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">
          {skill._count?.badgeSkills || 0} badges • {classCount} classes
        </span>
        {skill.name && (
          <Link 
            href={`/?topic=${encodeURIComponent(skill.name)}`}
            className="text-green-400 hover:text-green-300 flex items-center gap-1"
          >
            View classes
            <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </Card>
  )
}
