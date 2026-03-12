"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase,
  MonitorSmartphone,
  Cpu,
  ShieldCheck,
  BookOpen,
  ChevronRight,
  Loader2,
  FolderTree,
  GraduationCap,
  Users,
  Target,
  Lightbulb,
  LineChart,
  Code,
  Building2,
  HardHat,
  Leaf,
} from "lucide-react"

// Domain Knowledge Areas with their training delivery topics
const DOMAIN_STRUCTURE: Record<
  string,
  {
    title: string
    description: string
    icon: React.ReactNode
    colorClass: string
    bgClass: string
    borderClass: string
    topics: string[]
  }
> = {
  "Project Management": {
    title: "Project Management & Productivity",
    description: "Comprehensive project management training from fundamentals to advanced methodologies",
    icon: <Briefcase className="w-6 h-6" />,
    colorClass: "text-blue-700",
    bgClass: "bg-blue-50",
    borderClass: "border-blue-200",
    topics: [
      "Project Management Fundamentals (Basic, Intermediate, Advanced)",
      "Agile & Scrum Methodologies",
      "Project Governance & PMO Awareness",
      "AI in Project Management",
    ],
  },
  "Digital & Technology": {
    title: "Digital & Technology",
    description: "Digital transformation, cloud computing, and productivity tools training",
    icon: <MonitorSmartphone className="w-6 h-6" />,
    colorClass: "text-violet-700",
    bgClass: "bg-violet-50",
    borderClass: "border-violet-200",
    topics: [
      "Microsoft 365 Awareness Programme",
      "SharePoint, Outlook & Teams Productivity",
      "Cyber Security Awareness",
      "Cloud Fundamentals (Azure & Google Cloud)",
      "Data Visualization & Storytelling",
      "Prompt Engineering & AI Fundamentals",
    ],
  },
  "Engineering": {
    title: "Engineering Literacy & Applied Engineering",
    description: "Technical engineering training for project and operations professionals",
    icon: <HardHat className="w-6 h-6" />,
    colorClass: "text-amber-700",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-200",
    topics: [
      "Engineering Literacy for Project & Operations Professionals — Electrical Systems",
      "Engineering Literacy for Project & Operations Professionals — Civil & Construction Works",
      "Applied Engineering Essentials for Project Delivery — Electrical Systems",
      "Applied Engineering Essentials for Project Delivery — Civil & Construction Works",
    ],
  },
  "Workplace Culture": {
    title: "Workplace Conduct & Culture",
    description: "Building respectful, ethical, and productive workplace environments",
    icon: <Users className="w-6 h-6" />,
    colorClass: "text-emerald-700",
    bgClass: "bg-emerald-50",
    borderClass: "border-emerald-200",
    topics: [
      "Workplace Anti-Bullying",
      "Respectful & Ethical Workplace Behaviour",
      "Managing Workplace Conflict, Misconduct & Power Dynamics",
      "Leadership Accountability & Duty of Care",
      "Building a Speak-Up & Reporting Culture",
      "Workplace Boundaries, Professional Behaviour & Digital Conduct",
      "Preventing Toxic Work Environments & Escalation Failures",
      "One Million Dollar Employee Mindset",
    ],
  },
}

// Icon mapping for specific training topics
const getTopicIcon = (topic: string) => {
  const lowerTopic = topic.toLowerCase()
  if (lowerTopic.includes("agile") || lowerTopic.includes("scrum"))
    return <Target className="w-4 h-4" />
  if (lowerTopic.includes("ai") || lowerTopic.includes("prompt"))
    return <Lightbulb className="w-4 h-4" />
  if (lowerTopic.includes("data") || lowerTopic.includes("analytic"))
    return <LineChart className="w-4 h-4" />
  if (lowerTopic.includes("code") || lowerTopic.includes("cloud"))
    return <Code className="w-4 h-4" />
  if (lowerTopic.includes("cyber") || lowerTopic.includes("security"))
    return <ShieldCheck className="w-4 h-4" />
  if (lowerTopic.includes("engineering") || lowerTopic.includes("electrical") || lowerTopic.includes("civil"))
    return <HardHat className="w-4 h-4" />
  if (lowerTopic.includes("microsoft") || lowerTopic.includes("sharepoint") || lowerTopic.includes("teams"))
    return <MonitorSmartphone className="w-4 h-4" />
  if (lowerTopic.includes("leadership") || lowerTopic.includes("management"))
    return <Building2 className="w-4 h-4" />
  if (lowerTopic.includes("fundamental") || lowerTopic.includes("basic"))
    return <BookOpen className="w-4 h-4" />
  return <GraduationCap className="w-4 h-4" />
}

interface ClassData {
  id: string
  title: string
  clientName: string
  topicCategory: string
}

interface DomainCardProps {
  domainKey: string
  domain: (typeof DOMAIN_STRUCTURE)["Project Management"]
  classCount: number
  isExpanded: boolean
  onToggle: () => void
}

function DomainCard({ domainKey, domain, classCount, isExpanded, onToggle }: DomainCardProps) {
  return (
    <div
      className={`overflow-hidden rounded-xl border-2 transition-all duration-300 ${
        isExpanded ? domain.borderClass : "border-gray-200"
      } bg-white hover:shadow-lg`}
    >
      {/* Domain Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-6 py-5 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-5">
          <div
            className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${domain.bgClass} ${domain.colorClass} shadow-sm`}
          >
            {domain.icon}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg leading-tight">{domain.title}</h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-1">{domain.description}</p>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="secondary" className={`text-xs ${domain.bgClass} ${domain.colorClass} border-0`}>
                {domain.topics.length} Training Topics
              </Badge>
              {classCount > 0 && (
                <span className="text-xs text-gray-400">
                  {classCount} classes delivered
                </span>
              )}
            </div>
          </div>
        </div>
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
            isExpanded ? `${domain.bgClass} ${domain.colorClass}` : "bg-gray-100 text-gray-400"
          }`}
        >
          <ChevronRight
            className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`}
          />
        </div>
      </button>

      {/* Expandable Topics Section */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className={`px-6 pb-6 pt-2 border-t ${domain.borderClass}`}>
          <div className="flex items-center gap-2 mb-4 mt-4">
            <FolderTree className={`w-4 h-4 ${domain.colorClass}`} />
            <span className="text-sm font-semibold text-gray-700">Training Delivery Topics</span>
          </div>
          <div className="grid gap-3">
            {domain.topics.map((topic, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-lg ${domain.bgClass} border ${domain.borderClass} hover:shadow-sm transition-shadow`}
              >
                <div className={`shrink-0 mt-0.5 ${domain.colorClass}`}>{getTopicIcon(topic)}</div>
                <span className="text-sm text-gray-700 leading-relaxed">{topic}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function TrainingExpertise({ defaultExpanded = false }: { defaultExpanded?: boolean }) {
  const [expandedDomains, setExpandedDomains] = useState<string[]>(
    defaultExpanded ? Object.keys(DOMAIN_STRUCTURE) : []
  )
  const [classes, setClasses] = useState<ClassData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch("/api/experience")
        if (response.ok) {
          const data = await response.json()
          setClasses(data.classes || [])
        }
      } catch (error) {
        console.error("Error fetching classes:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchClasses()
  }, [])

  // Count classes per domain
  const getClassCountForDomain = (domainKey: string) => {
    return classes.filter((c) => c.topicCategory === domainKey).length
  }

  const toggleDomain = (domainKey: string) => {
    setExpandedDomains((prev) =>
      prev.includes(domainKey) ? prev.filter((d) => d !== domainKey) : [...prev, domainKey]
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Section Overview */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <FolderTree className="w-6 h-6 text-blue-700" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Structured Training Portfolio</h4>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
              Training programmes are organized into four domain knowledge areas, each containing
              specialized delivery topics. Click on any domain to explore the full curriculum.
            </p>
          </div>
        </div>
      </div>

      {/* Domain Cards */}
      <div className="space-y-4">
        {Object.entries(DOMAIN_STRUCTURE).map(([domainKey, domain]) => (
          <DomainCard
            key={domainKey}
            domainKey={domainKey}
            domain={domain}
            classCount={getClassCountForDomain(domainKey)}
            isExpanded={expandedDomains.includes(domainKey)}
            onToggle={() => toggleDomain(domainKey)}
          />
        ))}
      </div>

      {/* Expand / Collapse all */}
      <div className="flex justify-center pt-4 gap-3">
        <button
          type="button"
          onClick={() => setExpandedDomains(Object.keys(DOMAIN_STRUCTURE))}
          className="text-sm text-blue-700 hover:text-blue-800 font-medium transition-colors px-4 py-2 rounded-lg hover:bg-blue-50"
        >
          Expand all domains
        </button>
        <span className="text-gray-300">|</span>
        <button
          type="button"
          onClick={() => setExpandedDomains([])}
          className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors px-4 py-2 rounded-lg hover:bg-gray-50"
        >
          Collapse all
        </button>
      </div>
    </div>
  )
}

export default TrainingExpertise
