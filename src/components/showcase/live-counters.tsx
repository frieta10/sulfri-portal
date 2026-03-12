"use client"

import { useEffect, useState, useRef } from "react"
import { BookOpen, Clock, Users, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ShowcaseStat {
  id: string
  statKey: string
  statValue: number
  label: string
}

interface LiveCountersProps {
  className?: string
}

// Count-up animation hook
function useCountUp(end: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!start) return
    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      // Ease out quart
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(easeOutQuart * end))
      if (progress < 1) animationFrame = requestAnimationFrame(animate)
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration, start])

  return count
}

// Stat icon mapping
const statIcons: Record<string, React.ElementType> = {
  classes_completed: BookOpen,
  hours_delivered: Clock,
  participants_trained: Users,
  unique_clients: Building2,
}

// Default stats if API fails
const defaultStats: ShowcaseStat[] = [
  { id: "1", statKey: "classes_completed", statValue: 0, label: "Classes Completed" },
  { id: "2", statKey: "hours_delivered", statValue: 0, label: "Hours Delivered" },
  { id: "3", statKey: "participants_trained", statValue: 0, label: "Participants" },
  { id: "4", statKey: "unique_clients", statValue: 0, label: "Clients" },
]

export function LiveCounters({ className }: LiveCountersProps) {
  const [stats, setStats] = useState<ShowcaseStat[]>(defaultStats)
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/showcase-stats")
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data) && data.length > 0) {
          setStats(data)
        }
      }
    } catch (error) {
      console.error("Error fetching showcase stats:", error)
    } finally {
      setLoading(false)
    }
  }

  // Custom hook for each stat
  const classesCount = useCountUp(
    stats.find(s => s.statKey === "classes_completed")?.statValue || 0,
    2000,
    isVisible
  )
  const hoursCount = useCountUp(
    stats.find(s => s.statKey === "hours_delivered")?.statValue || 0,
    2000,
    isVisible
  )
  const participantsCount = useCountUp(
    stats.find(s => s.statKey === "participants_trained")?.statValue || 0,
    2000,
    isVisible
  )
  const clientsCount = useCountUp(
    stats.find(s => s.statKey === "unique_clients")?.statValue || 0,
    2000,
    isVisible
  )

  const countValues: Record<string, number> = {
    classes_completed: classesCount,
    hours_delivered: hoursCount,
    participants_trained: participantsCount,
    unique_clients: clientsCount,
  }

  if (loading) {
    return (
      <section ref={sectionRef} className={cn("py-14 bg-white", className)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white text-center px-6 py-8">
                <div className="w-10 h-10 bg-gray-100 rounded-lg mx-auto mb-3 animate-pulse" />
                <div className="w-16 h-8 bg-gray-100 rounded mx-auto mb-2 animate-pulse" />
                <div className="w-24 h-4 bg-gray-100 rounded mx-auto animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section ref={sectionRef} className={cn("py-14 border-y border-gray-200 bg-white", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          className={cn(
            "grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200 transition-all duration-700",
            isVisible ? "opacity-100" : "opacity-0"
          )}
        >
          {stats.map((stat, index) => {
            const Icon = statIcons[stat.statKey] || Building2
            const count = countValues[stat.statKey] || 0

            return (
              <div
                key={stat.id}
                className="bg-white text-center px-6 py-8 lg:py-10 group hover:bg-blue-50/50 transition-colors"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-10 h-10 mb-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <Icon className="w-5 h-5 text-blue-800" />
                </div>
                <p className="text-4xl lg:text-5xl font-bold text-gray-900 tabular-nums">
                  {count.toLocaleString()}
                </p>
                <p className="text-gray-500 mt-1.5 text-sm font-medium">
                  {stat.label}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default LiveCounters
