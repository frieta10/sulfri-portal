"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase,
  Code,
  Cpu,
  Shield,
  Cloud,
  BarChart3,
  Zap,
  Users,
  Target,
  Lightbulb,
  GraduationCap,
  Wrench,
  Building2,
  HardHat,
  Construction,
  HeartHandshake,
  MessageSquareHeart,
  Scale,
  Megaphone,
  AlertCircle,
  CheckCircle2,
  Globe,
  Palette,
  Database,
  LineChart,
  Lock,
  Mail,
  Share2,
  FileSpreadsheet,
  Brain,
  Bot,
  ChevronRight,
} from "lucide-react"

// Training expertise categories with icons
interface TrainingCategory {
  id: string
  title: string
  icon: React.ReactNode
  color: string
  bgColor: string
  courses: {
    name: string
    icon: React.ReactNode
    level?: "Basic" | "Intermediate" | "Advanced"
  }[]
}

const trainingCategories: TrainingCategory[] = [
  {
    id: "project-management",
    title: "Project Management & Productivity",
    icon: <Briefcase className="w-6 h-6" />,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    courses: [
      { name: "Project Management Fundamentals", icon: <Target className="w-4 h-4" />, level: "Basic" },
      { name: "Project Management Intermediate", icon: <Target className="w-4 h-4" />, level: "Intermediate" },
      { name: "Project Management Advanced", icon: <Target className="w-4 h-4" />, level: "Advanced" },
      { name: "Agile & Scrum Methodologies", icon: <Zap className="w-4 h-4" /> },
      { name: "Project Governance & PMO Awareness", icon: <Building2 className="w-4 h-4" /> },
      { name: "AI in Project Management", icon: <Bot className="w-4 h-4" /> },
    ],
  },
  {
    id: "digital-technology",
    title: "Digital & Technology",
    icon: <Code className="w-6 h-6" />,
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    courses: [
      { name: "Microsoft 365 Awareness", icon: <Mail className="w-4 h-4" /> },
      { name: "SharePoint Productivity", icon: <Share2 className="w-4 h-4" /> },
      { name: "Outlook & Teams Mastery", icon: <Mail className="w-4 h-4" /> },
      { name: "Cyber Security Awareness", icon: <Shield className="w-4 h-4" /> },
      { name: "Cloud Fundamentals (Azure)", icon: <Cloud className="w-4 h-4" /> },
      { name: "Cloud Fundamentals (Google Cloud)", icon: <Cloud className="w-4 h-4" /> },
      { name: "Data Visualization & Storytelling", icon: <BarChart3 className="w-4 h-4" /> },
      { name: "Prompt Engineering & AI Fundamentals", icon: <Brain className="w-4 h-4" /> },
    ],
  },
  {
    id: "data-analytics",
    title: "Data, Analytics & Design",
    icon: <Database className="w-6 h-6" />,
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    courses: [
      { name: "Power BI Data Analyst", icon: <LineChart className="w-4 h-4" /> },
      { name: "Data Science Specialist", icon: <Database className="w-4 h-4" /> },
      { name: "Digital Marketing Specialist", icon: <Globe className="w-4 h-4" /> },
      { name: "Visual Design Professional", icon: <Palette className="w-4 h-4" /> },
    ],
  },
  {
    id: "engineering",
    title: "Engineering Literacy & Applied Engineering",
    icon: <Cpu className="w-6 h-6" />,
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    courses: [
      { name: "Engineering Literacy - Electrical Systems", icon: <Zap className="w-4 h-4" /> },
      { name: "Engineering Literacy - Civil & Construction", icon: <Construction className="w-4 h-4" /> },
      { name: "Applied Engineering - Electrical Systems", icon: <HardHat className="w-4 h-4" /> },
      { name: "Applied Engineering - Civil & Construction", icon: <HardHat className="w-4 h-4" /> },
    ],
  },
  {
    id: "workplace-culture",
    title: "Workplace Conduct & Culture",
    icon: <HeartHandshake className="w-6 h-6" />,
    color: "text-rose-700",
    bgColor: "bg-rose-50",
    courses: [
      { name: "Workplace Anti-Bullying", icon: <Shield className="w-4 h-4" /> },
      { name: "Respectful & Ethical Workplace", icon: <HeartHandshake className="w-4 h-4" /> },
      { name: "Managing Workplace Conflict", icon: <MessageSquareHeart className="w-4 h-4" /> },
      { name: "Leadership Accountability", icon: <Scale className="w-4 h-4" /> },
      { name: "Building Speak-Up Culture", icon: <Megaphone className="w-4 h-4" /> },
      { name: "Workplace Boundaries & Digital Conduct", icon: <Lock className="w-4 h-4" /> },
      { name: "Preventing Toxic Work Environments", icon: <AlertCircle className="w-4 h-4" /> },
      { name: "One Million Dollar Employee Mindset", icon: <CheckCircle2 className="w-4 h-4" /> },
    ],
  },
]

interface TrainingExpertiseProps {
  defaultExpanded?: boolean
}

export function TrainingExpertise({ defaultExpanded = false }: TrainingExpertiseProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    defaultExpanded ? trainingCategories.map((c) => c.id) : []
  )

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-4">
      {trainingCategories.map((category) => {
        const isExpanded = expandedCategories.includes(category.id)
        
        return (
          <Card
            key={category.id}
            className={`overflow-hidden transition-all duration-300 border-0 shadow-sm hover:shadow-md ${category.bgColor}`}
          >
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full"
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-white shadow-sm ${category.color}`}>
                      {category.icon}
                    </div>
                    <div className="text-left">
                      <h3 className={`font-bold text-lg ${category.color}`}>
                        {category.title}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {category.courses.length} courses available
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </div>
              </CardContent>
            </button>

            {/* Expandable Course List */}
            <div
              className={`overflow-hidden transition-all duration-300 ${
                isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <CardContent className="px-5 pb-5 pt-0">
                <div className="pl-[3.25rem]">
                  <div className="flex flex-wrap gap-2">
                    {category.courses.map((course, idx) => (
                      <div
                        key={idx}
                        className="group inline-flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all cursor-default"
                      >
                        <span className={`${category.color}`}>{course.icon}</span>
                        <span className="text-sm font-medium text-slate-700">
                          {course.name}
                        </span>
                        {course.level && (
                          <Badge
                            variant="secondary"
                            className={`text-[10px] ${
                              course.level === "Basic"
                                ? "bg-green-100 text-green-700"
                                : course.level === "Intermediate"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {course.level}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        )
      })}

      {/* Expand All / Collapse All */}
      <div className="flex justify-center pt-4">
        <button
          onClick={() =>
            setExpandedCategories(
              expandedCategories.length === trainingCategories.length
                ? []
                : trainingCategories.map((c) => c.id)
            )
          }
          className="text-sm text-slate-500 hover:text-amber-600 transition-colors"
        >
          {expandedCategories.length === trainingCategories.length
            ? "Collapse all categories"
            : "Expand all categories"}
        </button>
      </div>
    </div>
  )
}

// Compact version for sidebars or smaller spaces
export function TrainingExpertiseCompact() {
  return (
    <div className="flex flex-wrap gap-2">
      {trainingCategories.map((category) => (
        <Badge
          key={category.id}
          variant="secondary"
          className={`px-3 py-1.5 text-sm cursor-default hover:shadow-sm transition-shadow ${category.bgColor} ${category.color} border-0`}
        >
          <span className="mr-1.5">{category.icon}</span>
          {category.title}
        </Badge>
      ))}
    </div>
  )
}

export default TrainingExpertise
