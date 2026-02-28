"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase,
  Code,
  Cpu,
  Target,
  BookOpen,
  ChevronRight,
  Loader2,
} from "lucide-react"

interface TrainingCategory {
  id: string
  title: string
  icon: React.ReactNode
  color: string
  bgColor: string
  courses: {
    name: string
    completedCount: number
  }[]
}

interface ClassData {
  id: string
  title: string
  clientName: string
  topicCategory: string
}

export function TrainingExpertise({ defaultExpanded = false }: { defaultExpanded?: boolean }) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    defaultExpanded ? ["all"] : []
  )
  const [classes, setClasses] = useState<ClassData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClasses()
  }, [])

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

  // Build training categories from actual classes data
  const getCategoriesFromClasses = (): TrainingCategory[] => {
    // Get unique topic categories from classes
    const topicCategories = Array.from(new Set(classes.map((c) => c.topicCategory)))
    
    // Map topics to categories
    const categoryMap: Record<string, { title: string; icon: React.ReactNode; color: string; bgColor: string }> = {
      "Project Management": {
        title: "Project Management & Productivity",
        icon: <Briefcase className="w-6 h-6" />,
        color: "text-blue-400",
        bgColor: "bg-blue-500/10",
      },
      "Digital & Technology": {
        title: "Digital & Technology",
        icon: <Code className="w-6 h-6" />,
        color: "text-purple-400",
        bgColor: "bg-purple-500/10",
      },
      "Data & Analytics": {
        title: "Data, Analytics & Design",
        icon: <Cpu className="w-6 h-6" />,
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/10",
      },
      "Engineering": {
        title: "Engineering Literacy",
        icon: <Cpu className="w-6 h-6" />,
        color: "text-orange-400",
        bgColor: "bg-orange-500/10",
      },
      "Workplace Culture": {
        title: "Workplace Conduct & Culture",
        icon: <Target className="w-6 h-6" />,
        color: "text-rose-400",
        bgColor: "bg-rose-500/10",
      },
    }

    // Build categories from actual class data
    return topicCategories.map((topic) => {
      const categoryClasses = classes.filter((c) => c.topicCategory === topic)
      const categoryInfo = categoryMap[topic] || {
        title: topic,
        icon: <BookOpen className="w-6 h-6" />,
        color: "text-slate-400",
        bgColor: "bg-slate-500/10",
      }

      return {
        id: topic.toLowerCase().replace(/\s+/g, "-"),
        title: categoryInfo.title,
        icon: categoryInfo.icon,
        color: categoryInfo.color,
        bgColor: categoryInfo.bgColor,
        courses: categoryClasses.map((c) => ({
          name: c.title,
          completedCount: 1,
        })),
      }
    })
  }

  const trainingCategories = getCategoriesFromClasses()

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (trainingCategories.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="py-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No training data available yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {trainingCategories.map((category) => {
        const isExpanded = expandedCategories.includes(category.id)

        return (
          <Card
            key={category.id}
            className="overflow-hidden transition-all duration-300 border border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/50"
          >
            {/* Category Header */}
            <button onClick={() => toggleCategory(category.id)} className="w-full">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-slate-950 shadow-sm ${category.color}`}>
                      {category.icon}
                    </div>
                    <div className="text-left">
                      <h3 className={`font-bold text-lg ${category.color}`}>
                        {category.title}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {category.courses.length} classes completed
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
                        className="group/course inline-flex items-center gap-2 px-3 py-2 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-600 transition-all cursor-default"
                      >
                        <span className={category.color}>
                          <BookOpen className="w-4 h-4" />
                        </span>
                        <span className="text-sm font-medium text-slate-300">
                          {course.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30"
                        >
                          Completed
                        </Badge>
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
          className="text-sm text-slate-500 hover:text-blue-400 transition-colors"
        >
          {expandedCategories.length === trainingCategories.length
            ? "Collapse all categories"
            : "Expand all categories"}
        </button>
      </div>
    </div>
  )
}

export default TrainingExpertise
