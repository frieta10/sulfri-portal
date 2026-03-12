"use client"

import { useEffect, useState, useRef } from "react"
import { Building2, Users, Clock, Target, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface CaseStudy {
  id: string
  clientLabel: string
  trainingTopic: string
  participantCount: number | null
  durationText: string | null
  outcomeSummary: string | null
  studyDate: string | null
}

interface CaseStudiesSectionProps {
  className?: string
}

export function CaseStudiesSection({ className }: CaseStudiesSectionProps) {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([])
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCaseStudies()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const fetchCaseStudies = async () => {
    try {
      const response = await fetch("/api/case-studies")
      if (response.ok) {
        const data = await response.json()
        setCaseStudies(data)
      }
    } catch (error) {
      console.error("Error fetching case studies:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={cn("py-16", className)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-800 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  if (caseStudies.length === 0) {
    return null
  }

  return (
    <section 
      ref={sectionRef}
      id="case-studies" 
      className={cn("py-20 lg:py-24 bg-white", className)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div 
          className={cn(
            "text-center mb-12 transition-all duration-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
          )}
        >
          <p className="text-blue-800 font-semibold text-xs uppercase tracking-widest mb-3">
            Success Stories
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
            Case Studies
          </h2>
          <div className="w-12 h-0.5 bg-blue-800 mx-auto mt-4" />
          <p className="text-gray-500 mt-4 max-w-2xl mx-auto leading-relaxed">
            Real results from training programs delivered across various industries
          </p>
        </div>

        {/* Case Studies Grid */}
        <div 
          className={cn(
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-700 delay-100",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
          )}
        >
          {caseStudies.map((study, index) => (
            <div
              key={study.id}
              className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all duration-300"
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              {/* Card Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                    <Building2 className="w-6 h-6 text-blue-800" />
                  </div>
                  {study.studyDate && (
                    <span className="text-xs text-gray-400">
                      {new Date(study.studyDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                      })}
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-800 transition-colors mb-1">
                  {study.clientLabel}
                </h3>
                <p className="text-sm text-blue-600 font-medium">
                  {study.trainingTopic}
                </p>
              </div>

              {/* Stats Row */}
              <div className="px-6 py-4 bg-gray-50 border-y border-gray-100">
                <div className="flex items-center gap-6">
                  {study.participantCount && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {study.participantCount.toLocaleString()} participants
                      </span>
                    </div>
                  )}
                  {study.durationText && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {study.durationText}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Outcome */}
              {study.outcomeSummary && (
                <div className="p-6 pt-4">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {study.outcomeSummary}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* View All Link */}
        <div 
          className={cn(
            "text-center mt-10 transition-all duration-700 delay-200",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
          )}
        >
          <Link
            href="/experience"
            className="inline-flex items-center gap-2 text-blue-800 font-medium hover:text-blue-900 transition-colors"
          >
            View all training programs
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default CaseStudiesSection
