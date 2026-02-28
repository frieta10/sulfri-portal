"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { TrainingExpertise } from "@/components/training-expertise"
import { ClientCarousel, ClientGrid, ClientCategoryFilter } from "@/components/client-carousel"
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Calendar,
  BookOpen,
  Award,
  Download,
  ArrowRight,
  Users,
  Target,
  BadgeCheck,
  Building2,
  Briefcase,
  GraduationCap,
  Landmark,
  Zap,
  Globe,
  Cpu,
  Shield,
  Rocket,
  TrendingUp,
  Clock,
  ChevronRight,
  Play,
  Quote,
  ExternalLink,
} from "lucide-react"

// Animation hook
function useCountUp(end: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    if (!start) return
    let startTime: number
    let animationFrame: number
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(easeOutQuart * end))
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }
    
    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration, start])
  
  return count
}

// Fade in animation
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  
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
    
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  )
}

// Animated background grid
function AnimatedGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[500px] w-[500px] rounded-full bg-blue-500/20 opacity-20 blur-[100px] animate-pulse" />
      <div className="absolute right-0 top-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-cyan-500/20 opacity-20 blur-[100px] animate-pulse delay-1000" />
      <div className="absolute left-1/4 bottom-0 -z-10 h-[300px] w-[300px] rounded-full bg-indigo-500/20 opacity-20 blur-[100px] animate-pulse delay-2000" />
    </div>
  )
}

// Floating particles
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-blue-500/30 rounded-full animate-bounce"
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: '3s',
          }}
        />
      ))}
    </div>
  )
}

type Profile = {
  displayName: string
  headline: string | null
  bio: string | null
  email: string | null
  phone: string | null
  linkedinUrl: string | null
  locationBase: string | null
  profilePhotoUrl: string | null
  lastUpdatedAt: string
}

type ExperienceClass = {
  id: string
  title: string
  clientName: string
  clientType: string
  topicCategory: string
  mode: string
  location: string | null
  startDatetime: string
}

type Badge = {
  id: string
  name: string
  description: string | null
  imageUrl: string
  issuer: string
  issueDate: string
  skills: string[]
  category: string
  credentialUrl: string | null
}

export default function PublicProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [classes, setClasses] = useState<ExperienceClass[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [yearFilter, setYearFilter] = useState("all")
  const [topicFilter, setTopicFilter] = useState("all")
  const [years, setYears] = useState<string[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [totalClasses, setTotalClasses] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statsVisible, setStatsVisible] = useState(false)
  const [clientFilter, setClientFilter] = useState<string | null>(null)
  const statsRef = useRef<HTMLDivElement>(null)

  const classesCount = useCountUp(totalClasses, 2000, statsVisible)
  const topicsCount = useCountUp(topics.length, 2000, statsVisible)
  const yearsCount = useCountUp(years.length, 2000, statsVisible)
  const clientsCount = useCountUp([...new Set(classes.map((c) => c.clientName))].length, 2000, statsVisible)

  useEffect(() => {
    fetchProfile()
    fetchExperience()
    fetchBadges()
  }, [])

  useEffect(() => {
    fetchExperience()
  }, [yearFilter, topicFilter])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    
    if (statsRef.current) observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile")
      if (response.ok) setProfile(await response.json())
    } catch (error) {
      console.error("Error fetching profile:", error)
    }
  }

  const fetchBadges = async () => {
    try {
      const response = await fetch("/api/badges")
      if (response.ok) setBadges(await response.json())
    } catch (error) {
      console.error("Error fetching badges:", error)
    }
  }

  const fetchExperience = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (yearFilter !== "all") params.append("year", yearFilter)
      if (topicFilter !== "all") params.append("topic", topicFilter)

      const response = await fetch(`/api/experience?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes)
        setTotalClasses(data.total)
        setYears(data.filters.years)
        setTopics(data.filters.topics)
      }
    } catch (error) {
      console.error("Error fetching experience:", error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="font-bold text-lg flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                {profile?.displayName?.split(' ')[0] || "Sulfri"}
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              {['Expertise', 'Experience', 'Clients'].map((item) => (
                <button 
                  key={item}
                  onClick={() => scrollToSection(item.toLowerCase())}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-full transition-all"
                >
                  {item}
                </button>
              ))}
              <Link 
                href="/badges" 
                className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-full transition-all"
              >
                Credentials
              </Link>
              <Link 
                href="/skills" 
                className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-full transition-all"
              >
                Skills
              </Link>
              <Link 
                href="/downloads-public" 
                className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-full transition-all"
              >
                Resources
              </Link>
            </nav>
            
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="outline" size="sm" className="rounded-full border-slate-700 bg-slate-900/50 hover:bg-slate-800">
                  Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <AnimatedGrid />
        <FloatingParticles />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="order-2 lg:order-1">
              <FadeIn>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium mb-6">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  Available for Training & Consulting
                </div>
              </FadeIn>
              
              <FadeIn delay={100}>
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                    {profile?.displayName || "Mohd Sulfri Mohd Harris"}
                  </span>
                </h1>
              </FadeIn>
              
              <FadeIn delay={200}>
                <p className="text-xl lg:text-2xl text-slate-400 mt-4 font-light">
                  {profile?.headline || "Senior Corporate Trainer & Project Management Expert"}
                </p>
              </FadeIn>
              
              <FadeIn delay={300}>
                <p className="text-slate-400 mt-6 leading-relaxed text-lg max-w-xl">
                  {profile?.bio || "Delivering high-impact training programmes for government agencies, GLCs, and multinational corporations. Transforming organizations through project management excellence and digital innovation."}
                </p>
              </FadeIn>

              <FadeIn delay={400}>
                <div className="flex flex-wrap gap-3 mt-8">
                  <button 
                    onClick={() => scrollToSection('expertise')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:-translate-y-0.5"
                  >
                    Explore Training
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <a 
                    href={profile?.linkedinUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800/50 text-slate-300 border border-slate-700 rounded-full font-medium hover:bg-slate-800 transition-all"
                  >
                    <Linkedin className="w-4 h-4" />
                    Connect on LinkedIn
                  </a>
                </div>
              </FadeIn>

              {/* Contact Info */}
              <FadeIn delay={500}>
                <div className="flex flex-wrap gap-6 mt-8 pt-8 border-t border-slate-800">
                  {profile?.email && (
                    <a href={`mailto:${profile.email}`} className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{profile.email}</span>
                    </a>
                  )}
                  {profile?.phone && (
                    <a href={`tel:${profile.phone}`} className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{profile.phone}</span>
                    </a>
                  )}
                  {profile?.locationBase && (
                    <span className="flex items-center gap-2 text-slate-400">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{profile.locationBase}</span>
                    </span>
                  )}
                </div>
              </FadeIn>
            </div>

            {/* Right Content - Profile Image & Stats */}
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <FadeIn className="relative">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-full blur-3xl scale-110" />
                
                {/* Profile Image Container */}
                <div className="relative">
                  <div className="w-72 h-72 lg:w-96 lg:h-96 rounded-full overflow-hidden ring-4 ring-slate-800/50 shadow-2xl shadow-blue-500/20">
                    {profile?.profilePhotoUrl ? (
                      <img 
                        src={profile.profilePhotoUrl} 
                        alt={profile.displayName} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                        <span className="text-7xl lg:text-8xl font-bold bg-gradient-to-br from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                          {profile?.displayName?.charAt(0) || "S"}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Floating Badges */}
                  <div className="absolute -top-4 -right-4 px-4 py-2 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-full flex items-center gap-2 shadow-xl">
                    <BadgeCheck className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium">HRD Corp 44523</span>
                  </div>
                  
                  <div className="absolute -bottom-4 -left-4 px-4 py-2 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-full flex items-center gap-2 shadow-xl">
                    <Shield className="w-5 h-5 text-cyan-500" />
                    <span className="text-sm font-medium">Azure Certified</span>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-16 border-y border-slate-800/50 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: BookOpen, value: classesCount, label: "Classes Completed", color: "blue" },
              { icon: Target, value: topicsCount, label: "Topic Areas", color: "cyan" },
              { icon: Clock, value: yearsCount, label: "Years Active", color: "indigo" },
              { icon: Users, value: clientsCount, label: "Clients Served", color: "violet" },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 mb-4 bg-${stat.color}-500/10 rounded-xl border border-${stat.color}-500/20`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                </div>
                <p className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-slate-500 mt-1 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications & Badges Section */}
      <section id="credentials" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-medium mb-4">
                <Award className="w-4 h-4" />
                Professional Certifications
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Certifications & Badges
              </h2>
              <p className="text-slate-400 mt-3 max-w-2xl mx-auto">
                Industry-recognized certifications and credentials from leading technology providers
              </p>
            </div>
          </FadeIn>

          <BadgeDisplay />
        </div>
      </section>

      {/* Training Expertise Section */}
      <section id="expertise" className="py-20 lg:py-28 bg-slate-900/30 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm font-medium mb-4">
                <Cpu className="w-4 h-4" />
                Training Portfolio
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Training Expertise
              </h2>
              <p className="text-slate-400 mt-3 max-w-2xl mx-auto">
                Comprehensive training programmes across project management, digital transformation, 
                engineering literacy, and workplace culture
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <TrainingExpertise defaultExpanded={false} />
          </FadeIn>
        </div>
      </section>

      {/* Clients Section */}
      <section id="clients" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-4">
                <Building2 className="w-4 h-4" />
                Trusted Organizations
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                List of Agencies
              </h2>
              <p className="text-slate-400 mt-3 max-w-2xl mx-auto">
                Delivered training for government agencies, GLCs, multinational corporations,
                and higher education institutions across Malaysia
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <ClientCarousel 
              speed={50} 
              pauseOnHover={true} 
              actualClients={[...new Set(classes.map((c) => c.clientName))]}
            />
          </FadeIn>

          <FadeIn delay={200}>
            <div className="mt-12">
              <div className="flex justify-center mb-8">
                <ClientCategoryFilter selected={clientFilter} onSelect={setClientFilter} />
              </div>
              <ClientGrid 
                actualClients={[...new Set(classes.map((c) => c.clientName))]}
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="py-20 lg:py-28 bg-slate-900/30 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium mb-4">
                <Briefcase className="w-4 h-4" />
                Track Record
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Teaching Experience
              </h2>
              <p className="text-slate-400 mt-3 max-w-2xl mx-auto">
                Comprehensive portfolio of training programs and workshops
              </p>
            </div>
          </FadeIn>

          {/* Filters */}
          <FadeIn delay={100}>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-slate-900/50 border-slate-700 rounded-xl text-slate-300">
                  <Calendar className="w-4 h-4 mr-2 text-slate-500" />
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={topicFilter} onValueChange={setTopicFilter}>
                <SelectTrigger className="w-full sm:w-52 bg-slate-900/50 border-slate-700 rounded-xl text-slate-300">
                  <Target className="w-4 h-4 mr-2 text-slate-500" />
                  <SelectValue placeholder="Topic" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all">All Topics</SelectItem>
                  {topics.map((topic) => (
                    <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FadeIn>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : classes.length === 0 ? (
            <FadeIn>
              <Card className="bg-slate-900/50 border-slate-800">
                <CardContent className="py-16 text-center">
                  <Award className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">
                    {yearFilter !== "all" || topicFilter !== "all"
                      ? "No classes match the selected filters."
                      : "No completed classes to display yet."}
                  </p>
                </CardContent>
              </Card>
            </FadeIn>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {classes.map((cls, index) => (
                <FadeIn key={cls.id} delay={index * 50}>
                  <Card className="group bg-slate-900/50 border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all duration-300 overflow-hidden">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-lg text-slate-100 group-hover:text-blue-400 transition-colors">
                              {cls.title}
                            </h3>
                            <p className="text-slate-500 text-sm mt-1">{cls.clientName}</p>
                          </div>
                          <span className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 bg-slate-800 rounded-lg text-slate-400 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                            <BookOpen className="w-5 h-5" />
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {cls.topicCategory}
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            {cls.mode.replace("_", " ")}
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            {cls.clientType}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 pt-3 border-t border-slate-800 text-sm text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {new Date(cls.startDatetime).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </span>
                          {cls.location && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4" /> 
                              {cls.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl p-8 lg:p-12">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
              
              <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="text-center lg:text-left">
                  <h3 className="text-2xl lg:text-3xl font-bold text-white">
                    Ready to Transform Your Team?
                  </h3>
                  <p className="text-blue-100 mt-2 max-w-lg">
                    Get in touch to discuss customized training programmes for your organization
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a href={`mailto:${profile?.email || "msulfri@gmail.com"}`}>
                    <Button 
                      size="lg" 
                      className="bg-white text-blue-600 hover:bg-blue-50 font-semibold rounded-full px-8 shadow-xl"
                    >
                      <Mail className="w-5 h-5 mr-2" />
                      Get in Touch
                    </Button>
                  </a>
                  <Link href="/downloads-public">
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10 rounded-full px-8"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Resources
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg">{profile?.displayName || "Mohd Sulfri"}</span>
              </div>
              <p className="text-sm text-slate-500">
                Senior Corporate Trainer & Project Management Expert
              </p>
            </div>
            <div className="flex items-center gap-6">
              {profile?.email && (
                <a href={`mailto:${profile.email}`} className="text-slate-500 hover:text-blue-400 transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
              )}
              {profile?.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-400 transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800/50 text-center">
            <p className="text-sm text-slate-600">
              © {new Date().getFullYear()} {profile?.displayName || "Mohd Sulfri Mohd Harris"}. All rights reserved.
            </p>
            {profile?.lastUpdatedAt && (
              <p className="mt-1 text-xs text-slate-700">
                Last updated: {new Date(profile.lastUpdatedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}

// Badge Display Component
function BadgeDisplay() {
  const [badges, setBadges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBadges()
  }, [])

  const fetchBadges = async () => {
    try {
      const response = await fetch("/api/badges?limit=8")
      const data = await response.json()
      if (response.ok && data.badges) {
        setBadges(data.badges)
      }
    } catch (error) {
      console.error("Error fetching badges:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-10 h-10 border-4 border-slate-800 border-t-orange-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (badges.length === 0) {
    return (
      <div className="text-center py-12">
        <Award className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">No certifications to display yet.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Badges Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {badges.map((badge, index) => (
          <FadeIn key={badge.id} delay={index * 50}>
            <Link href={`/badges/${badge.slug}`}>
              <div className="group bg-slate-900/50 rounded-2xl border border-slate-800 p-4 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300">
                {/* Badge Image */}
                <div className="relative aspect-square mb-4 overflow-hidden rounded-xl bg-slate-800">
                  {badge.fallbackImageUrl ? (
                    <img
                      src={badge.fallbackImageUrl}
                      alt={badge.title}
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Award className="w-12 h-12 text-slate-600" />
                    </div>
                  )}
                  {/* Verified Badge */}
                  <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <Shield className="w-3 h-3 text-slate-900" />
                  </div>
                </div>

                {/* Badge Info */}
                <h3 className="font-semibold text-sm text-slate-100 line-clamp-2 group-hover:text-orange-400 transition-colors">
                  {badge.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{badge.issuer}</p>

                {/* Issue Date */}
                {badge.issueDate && (
                  <p className="text-xs text-slate-600 mt-1">
                    {new Date(badge.issueDate).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}

                {/* Skills */}
                {badge.skills && badge.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {badge.skills.slice(0, 3).map((skill: any) => (
                      <span
                        key={skill.id}
                        className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full"
                      >
                        {skill.name}
                      </span>
                    ))}
                    {badge.skills.length > 3 && (
                      <span className="text-[10px] text-slate-500">
                        +{badge.skills.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          </FadeIn>
        ))}
      </div>

      {/* View All Link */}
      <div className="text-center mt-8">
        <Link href="/badges">
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            View All Credentials
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
