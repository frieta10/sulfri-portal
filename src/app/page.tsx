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
import {
  CredlyBadges,
  CredlySetupGuide,
} from "@/components/credly-badges"
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
  Clock,
  Target,
  Sparkles,
  FileText,
  ChevronDown,
  BadgeCheck,
  Building2,
  Briefcase,
  GraduationCap,
  Landmark,
} from "lucide-react"

// Animation hook for intersection observer
function useCountUp(end: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    if (!start) return
    
    let startTime: number
    let animationFrame: number
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      // Easing function for smooth animation
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

// Fade in animation component
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
    
    if (ref.current) {
      observer.observe(ref.current)
    }
    
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

type Profile = {
  displayName: string
  headline: string | null
  bio: string | null
  email: string | null
  phone: string | null
  linkedinUrl: string | null
  locationBase: string | null
  profilePhotoUrl: string | null
  credlyUsername: string | null
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

export default function PublicProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [classes, setClasses] = useState<ExperienceClass[]>([])
  const [yearFilter, setYearFilter] = useState("all")
  const [topicFilter, setTopicFilter] = useState("all")
  const [years, setYears] = useState<string[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [totalClasses, setTotalClasses] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statsVisible, setStatsVisible] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)
  const [clientFilter, setClientFilter] = useState<string | null>(null)

  // Counter animations
  const classesCount = useCountUp(totalClasses, 2000, statsVisible)
  const topicsCount = useCountUp(topics.length, 2000, statsVisible)
  const yearsCount = useCountUp(years.length, 2000, statsVisible)
  const clientsCount = useCountUp([...new Set(classes.map((c) => c.clientName))].length, 2000, statsVisible)

  useEffect(() => {
    fetchProfile()
    fetchExperience()
  }, [])

  useEffect(() => {
    fetchExperience()
  }, [yearFilter, topicFilter])

  // Intersection observer for stats animation
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
    
    if (statsRef.current) {
      observer.observe(statsRef.current)
    }
    
    return () => observer.disconnect()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile")
      if (response.ok) {
        setProfile(await response.json())
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
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
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="font-bold text-lg text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              {profile?.displayName || "Sulfri Trainer"}
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              <button 
                onClick={() => scrollToSection('credentials')}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
              >
                Credentials
              </button>
              <button 
                onClick={() => scrollToSection('expertise')}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
              >
                Expertise
              </button>
              <button 
                onClick={() => scrollToSection('experience')}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
              >
                Experience
              </button>
              <button 
                onClick={() => scrollToSection('clients')}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
              >
                Clients
              </button>
              <Link 
                href="/downloads-public" 
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
              >
                Downloads
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm" className="ml-2 rounded-full border-slate-300">
                  Admin
                </Button>
              </Link>
            </nav>
            {/* Mobile menu button */}
            <Link href="/login" className="sm:hidden">
              <Button variant="outline" size="sm" className="rounded-full">
                Admin
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-orange-50" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-100/30 to-transparent" />
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Profile Image */}
            <FadeIn className="flex-shrink-0">
              <div className="relative">
                <div className="w-40 h-40 lg:w-48 lg:h-48 rounded-full overflow-hidden ring-4 ring-white shadow-2xl">
                  {profile?.profilePhotoUrl ? (
                    <img 
                      src={profile.profilePhotoUrl} 
                      alt={profile.displayName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <span className="text-5xl lg:text-6xl font-bold text-white">
                        {profile?.displayName?.charAt(0) || "S"}
                      </span>
                    </div>
                  )}
                </div>
                {/* Status badge */}
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center ring-4 ring-white shadow-lg">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                </div>
                {/* HRD Corp Badge */}
                <div className="absolute -top-2 -left-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" />
                  HRD Corp
                </div>
              </div>
            </FadeIn>

            {/* Profile Info */}
            <div className="flex-1 text-center lg:text-left">
              <FadeIn delay={100}>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium mb-6">
                  <Briefcase className="w-4 h-4" />
                  Senior Corporate Trainer & Project Manager
                </div>
              </FadeIn>
              
              <FadeIn delay={200}>
                <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 tracking-tight">
                  {profile?.displayName || "Mohd Sulfri Mohd Harris"}
                </h1>
              </FadeIn>
              
              <FadeIn delay={300}>
                <p className="text-xl lg:text-2xl text-slate-600 mt-4 font-light">
                  {profile?.headline || "Project Management • Digital Transformation • Technology-Enabled Business Improvement"}
                </p>
              </FadeIn>
              
              <FadeIn delay={400}>
                <p className="text-slate-600 mt-6 max-w-2xl leading-relaxed text-lg">
                  {profile?.bio || "Senior Corporate Trainer with strong expertise in project management, digital transformation, and technology-enabled business improvement. Extensive experience delivering high-impact training programmes for government agencies, GLCs, multinational corporations, and higher education institutions."}
                </p>
              </FadeIn>

              {/* Credentials Tags */}
              <FadeIn delay={450}>
                <div className="flex flex-wrap gap-2 mt-6 justify-center lg:justify-start">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                    <Landmark className="w-3.5 h-3.5" />
                    HRD Corp Trainer: 44523
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                    <GraduationCap className="w-3.5 h-3.5" />
                    Azure Certified
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                    <Building2 className="w-3.5 h-3.5" />
                    20+ Clients
                  </span>
                </div>
              </FadeIn>

              {/* Contact Links */}
              <FadeIn delay={500}>
                <div className="flex flex-wrap gap-3 mt-8 justify-center lg:justify-start">
                  {profile?.email && (
                    <a 
                      href={`mailto:${profile.email}`} 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-700 hover:border-amber-400 hover:text-amber-600 transition-all shadow-sm hover:shadow-md"
                    >
                      <Mail className="w-4 h-4" /> 
                      {profile.email}
                    </a>
                  )}
                  {profile?.phone && (
                    <a 
                      href={`tel:${profile.phone}`} 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-700 hover:border-amber-400 hover:text-amber-600 transition-all shadow-sm hover:shadow-md"
                    >
                      <Phone className="w-4 h-4" /> 
                      {profile.phone}
                    </a>
                  )}
                  {profile?.linkedinUrl && (
                    <a 
                      href={profile.linkedinUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-sm text-slate-700 hover:border-amber-400 hover:text-amber-600 transition-all shadow-sm hover:shadow-md"
                    >
                      <Linkedin className="w-4 h-4" /> 
                      LinkedIn
                    </a>
                  )}
                  {profile?.locationBase && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-sm text-slate-600">
                      <MapPin className="w-4 h-4" /> 
                      {profile.locationBase}
                    </span>
                  )}
                </div>
              </FadeIn>

              {/* CTA Buttons */}
              <FadeIn delay={600}>
                <div className="flex flex-wrap gap-4 mt-8 justify-center lg:justify-start">
                  <button 
                    onClick={() => scrollToSection('expertise')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-all hover:shadow-lg hover:-translate-y-0.5"
                  >
                    Explore Training
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <Link 
                    href="/downloads-public"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-300 rounded-full font-medium hover:bg-slate-50 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Resources
                  </Link>
                </div>
              </FadeIn>
            </div>
          </div>

          {/* Scroll indicator */}
          <FadeIn delay={800} className="hidden lg:flex justify-center mt-16">
            <button 
              onClick={() => scrollToSection('credentials')}
              className="flex flex-col items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <span className="text-sm">Scroll to explore</span>
              <ChevronDown className="w-5 h-5 animate-bounce" />
            </button>
          </FadeIn>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-16 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-amber-500/20 rounded-xl">
                <BookOpen className="w-6 h-6 text-amber-400" />
              </div>
              <p className="text-4xl lg:text-5xl font-bold text-white">{classesCount}</p>
              <p className="text-slate-400 mt-1">Classes Completed</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-amber-500/20 rounded-xl">
                <Target className="w-6 h-6 text-amber-400" />
              </div>
              <p className="text-4xl lg:text-5xl font-bold text-white">{topicsCount}</p>
              <p className="text-slate-400 mt-1">Topic Areas</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-amber-500/20 rounded-xl">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
              <p className="text-4xl lg:text-5xl font-bold text-white">{yearsCount}</p>
              <p className="text-slate-400 mt-1">Years Active</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-amber-500/20 rounded-xl">
                <Users className="w-6 h-6 text-amber-400" />
              </div>
              <p className="text-4xl lg:text-5xl font-bold text-white">{clientsCount}</p>
              <p className="text-slate-400 mt-1">Clients Served</p>
            </div>
          </div>
        </div>
      </section>

      {/* Credly Badges Section */}
      <section id="credentials" className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <FadeIn>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium mb-4">
                <Award className="w-4 h-4" />
                Professional Certifications
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">
                Credentials & Badges
              </h2>
              <p className="text-slate-600 mt-3 max-w-2xl mx-auto">
                Industry-recognized certifications from Microsoft, Google, CompTIA, Cisco, and more. 
                Verified digital credentials powered by Credly.
              </p>
            </div>
          </FadeIn>

          {/* Credly Badges */}
          <FadeIn delay={100}>
            {profile?.credlyUsername ? (
              <CredlyBadges 
                username={profile.credlyUsername} 
                displayStyle="grid"
                maxBadges={8}
                showSkills={true}
              />
            ) : (
              <div className="grid lg:grid-cols-2 gap-8">
                <Card className="bg-white border-slate-200">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                      <Award className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Certifications Coming Soon
                    </h3>
                    <p className="text-slate-500 text-sm">
                      Professional certifications will be displayed here once connected to Credly.
                    </p>
                  </CardContent>
                </Card>
                <CredlySetupGuide />
              </div>
            )}
          </FadeIn>
        </div>
      </section>

      {/* Training Expertise Section */}
      <section id="expertise" className="py-20 lg:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <FadeIn>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                Training Portfolio
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">
                Training Expertise & Delivery
              </h2>
              <p className="text-slate-600 mt-3 max-w-2xl mx-auto">
                Comprehensive training programmes across project management, digital transformation, 
                engineering literacy, and workplace culture development.
              </p>
            </div>
          </FadeIn>

          {/* Training Categories */}
          <FadeIn delay={100}>
            <TrainingExpertise defaultExpanded={false} />
          </FadeIn>
        </div>
      </section>

      {/* Clients Carousel Section */}
      <section id="clients" className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <FadeIn>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
                <Building2 className="w-4 h-4" />
                Trusted By Industry Leaders
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">
                Our Clients
              </h2>
              <p className="text-slate-600 mt-3 max-w-2xl mx-auto">
                Delivered training programmes for government agencies, GLCs, multinational corporations, 
                and higher education institutions across Malaysia.
              </p>
            </div>
          </FadeIn>

          {/* Client Carousel */}
          <FadeIn delay={100}>
            <ClientCarousel speed={50} pauseOnHover={true} />
          </FadeIn>

          {/* Client Grid with Filter */}
          <FadeIn delay={200}>
            <div className="mt-12">
              <div className="flex justify-center mb-8">
                <ClientCategoryFilter selected={clientFilter} onSelect={setClientFilter} />
              </div>
              <ClientGrid />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Teaching Experience Section */}
      <section id="experience" className="py-20 lg:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <FadeIn>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium mb-4">
                <BookOpen className="w-4 h-4" />
                Track Record
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">
                Teaching Experience
              </h2>
              <p className="text-slate-600 mt-3 max-w-2xl mx-auto">
                A comprehensive portfolio of training programs and workshops delivered to diverse clients
              </p>
            </div>
          </FadeIn>

          {/* Filters */}
          <FadeIn delay={100}>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-white border-slate-200 rounded-xl">
                  <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Filter by Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={topicFilter} onValueChange={setTopicFilter}>
                <SelectTrigger className="w-full sm:w-52 bg-white border-slate-200 rounded-xl">
                  <Target className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Filter by Topic" />
                </SelectTrigger>
                <SelectContent>
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
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
                <p className="text-slate-500">Loading experience...</p>
              </div>
            </div>
          ) : classes.length === 0 ? (
            <FadeIn>
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardContent className="py-16 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                    <Award className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500 text-lg">
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
                  <Card className="group bg-white border-slate-200 hover:border-amber-300 hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Title Row */}
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-lg text-slate-900 group-hover:text-amber-700 transition-colors">
                              {cls.title}
                            </h3>
                            <p className="text-slate-500 text-sm mt-1">{cls.clientName}</p>
                          </div>
                          <span className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 bg-slate-100 rounded-lg text-slate-600 group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors">
                            <BookOpen className="w-5 h-5" />
                          </span>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            {cls.topicCategory}
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            {cls.mode.replace("_", " ")}
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {cls.clientType}
                          </span>
                        </div>

                        {/* Meta Info */}
                        <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-sm text-slate-500">
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

      {/* Downloads CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 lg:p-12">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl" />
              
              <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-amber-300 rounded-full text-sm mb-4">
                    <FileText className="w-4 h-4" />
                    Free Resources
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-white">
                    Download Training Materials
                  </h3>
                  <p className="text-slate-400 mt-2 max-w-lg">
                    Access presentations, guides, and resources to enhance your learning experience
                  </p>
                </div>
                <Link href="/downloads-public">
                  <Button 
                    size="lg" 
                    className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-full px-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Browse Downloads
                  </Button>
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <p className="font-semibold text-slate-900">
                {profile?.displayName || "Mohd Sulfri Mohd Harris"}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Senior Corporate Trainer & Project Manager
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Landmark className="w-3 h-3" />
                  HRD Corp Reg: 44523
                </span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {profile?.email && (
                <a href={`mailto:${profile.email}`} className="text-slate-500 hover:text-amber-600 transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
              )}
              {profile?.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-amber-600 transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} {profile?.displayName || "Mohd Sulfri Mohd Harris"}. All rights reserved.
            </p>
            {profile?.lastUpdatedAt && (
              <p className="mt-1 text-xs text-slate-400">
                Last updated: {new Date(profile.lastUpdatedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
