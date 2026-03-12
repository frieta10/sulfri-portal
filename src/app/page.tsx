"use client"

import { useEffect, useState, useRef } from "react"
import { HeadMeta } from "@/components/seo/head-meta"
import { StickyCtaBar, useStickyCtaSettings } from "@/components/mobile/sticky-cta-bar"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { TrainingExpertise } from "@/components/training-expertise"
import { ClientCarousel, ClientGrid, ClientCategoryFilter } from "@/components/client-carousel"
import { TestimonialsSection } from "@/components/showcase/testimonials-section"
import { CaseStudiesSection } from "@/components/showcase/case-studies-section"
import { LiveCounters } from "@/components/showcase/live-counters"
import { DownloadProfileCTA } from "@/components/showcase/download-profile-cta"
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
  Target,
  BadgeCheck,
  Shield,
  ChevronDown,
} from "lucide-react"

// Fade-in on scroll
function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Set transition-delay via CSS custom property to avoid inline style prop
    if (ref.current && delay > 0) {
      ref.current.style.setProperty("--fade-delay", `${delay}ms`)
    }
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
  }, [delay])

  return (
    <div
      ref={ref}
      className={`fade-in-item transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"} ${className}`}
    >
      {children}
    </div>
  )
}

// Section heading component
function SectionHeading({
  label,
  title,
  description,
}: {
  label: string
  title: string
  description?: string
}) {
  return (
    <div className="text-center mb-12">
      <p className="text-blue-800 font-semibold text-xs uppercase tracking-widest mb-3">
        {label}
      </p>
      <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">{title}</h2>
      <div className="w-12 h-0.5 bg-blue-800 mx-auto mt-4" />
      {description && (
        <p className="text-gray-500 mt-4 max-w-2xl mx-auto leading-relaxed">
          {description}
        </p>
      )}
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

function PageContent() {
  const { settings: ctaSettings, loading: ctaLoading } = useStickyCtaSettings()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [classes, setClasses] = useState<ExperienceClass[]>([])
  const [yearFilter, setYearFilter] = useState("all")
  const [topicFilter, setTopicFilter] = useState("all")
  const [years, setYears] = useState<string[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [totalClasses, setTotalClasses] = useState(0)
  const [loading, setLoading] = useState(true)
  const [clientFilter, setClientFilter] = useState<string | null>(null)

  useEffect(() => {
    fetchProfile()
    fetchExperience()
  }, [])

  useEffect(() => {
    fetchExperience()
  }, [yearFilter, topicFilter])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile")
      if (response.ok) setProfile(await response.json())
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
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ─── Navigation ─────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <img 
                src="/msh-logo.svg" 
                alt="MSH Corporate Trainer" 
                className="w-10 h-10 object-contain"
              />
              <span className="font-semibold text-gray-900 text-base">
                MSH
              </span>
            </Link>

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-0.5">
              {["Expertise", "Experience", "Clients"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => scrollToSection(item.toLowerCase())}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors font-medium"
                >
                  {item}
                </button>
              ))}
              
              {/* Credentials Dropdown */}
              <div className="relative group">
                <button className="px-4 py-2 text-sm text-gray-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors font-medium flex items-center gap-1">
                  Credentials
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <Link
                    href="/badges"
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-900 first:rounded-t-lg"
                  >
                    <div className="font-medium">Badges</div>
                    <div className="text-xs text-gray-500">Verified certifications</div>
                  </Link>
                  <Link
                    href="/skills"
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-900 last:rounded-b-lg"
                  >
                    <div className="font-medium">Skills Wallet</div>
                    <div className="text-xs text-gray-500">Interactive skill tree & gamification</div>
                  </Link>
                </div>
              </div>
              
              <Link
                href="/downloads-public"
                className="px-4 py-2 text-sm text-gray-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors font-medium"
              >
                Resources
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <DownloadProfileCTA
                variant="outline"
                size="sm"
                label="Profile"
                className="hidden sm:flex border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm"
              />
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm"
                >
                  Admin
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 bg-gradient-to-br from-slate-50 via-blue-50/40 to-white overflow-hidden">
        {/* Subtle background accent */}
        <div className="absolute inset-y-0 right-0 w-1/3 bg-blue-900/[0.03] hidden lg:block" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            {/* Left — text */}
            <div className="order-2 lg:order-1">
              <FadeIn>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 text-sm font-medium rounded-md mb-6">
                  <div className="w-1.5 h-1.5 bg-blue-700 rounded-full" />
                  Available for Training &amp; Consulting
                </div>
              </FadeIn>

              <FadeIn delay={100}>
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                  {profile?.displayName || "Mohd Sulfri Mohd Harris"}
                </h1>
              </FadeIn>

              <FadeIn delay={200}>
                <p className="text-base lg:text-lg text-blue-800 font-semibold mt-3">
                  {profile?.headline ||
                    "Senior Corporate Trainer & Project Management Expert"}
                </p>
              </FadeIn>

              <FadeIn delay={300}>
                <p className="text-gray-600 mt-5 leading-relaxed max-w-xl">
                  {profile?.bio ||
                    "Delivering high-impact training programmes for government agencies, GLCs, and multinational corporations. Transforming organizations through project management excellence and digital innovation."}
                </p>
              </FadeIn>

              <FadeIn delay={400}>
                <div className="flex flex-wrap gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => scrollToSection("expertise")}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-md font-semibold hover:bg-blue-800 transition-colors shadow-sm text-sm"
                  >
                    Explore Training
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  {profile?.linkedinUrl && (
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-md font-semibold hover:bg-gray-50 transition-colors shadow-sm text-sm"
                    >
                      <Linkedin className="w-4 h-4 text-blue-700" />
                      Connect on LinkedIn
                    </a>
                  )}
                </div>
              </FadeIn>

              <FadeIn delay={500}>
                <div className="flex flex-wrap gap-x-6 gap-y-3 mt-8 pt-8 border-t border-gray-200">
                  {profile?.email && (
                    <a
                      href={`mailto:${profile.email}`}
                      className="flex items-center gap-2 text-gray-500 hover:text-blue-800 transition-colors text-sm"
                    >
                      <Mail className="w-4 h-4 shrink-0" />
                      {profile.email}
                    </a>
                  )}
                  {profile?.phone && (
                    <a
                      href={`tel:${profile.phone}`}
                      className="flex items-center gap-2 text-gray-500 hover:text-blue-800 transition-colors text-sm"
                    >
                      <Phone className="w-4 h-4 shrink-0" />
                      {profile.phone}
                    </a>
                  )}
                  {profile?.locationBase && (
                    <span className="flex items-center gap-2 text-gray-500 text-sm">
                      <MapPin className="w-4 h-4 shrink-0" />
                      {profile.locationBase}
                    </span>
                  )}
                </div>
              </FadeIn>
            </div>

            {/* Right — profile photo */}
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <FadeIn className="relative">
                {/* Decorative offset block */}
                <div className="absolute -bottom-4 -right-4 w-full h-full bg-blue-900 rounded-2xl" />

                {/* Portrait image */}
                <div className="relative w-64 lg:w-[300px] aspect-[4/5] rounded-2xl overflow-hidden border border-gray-200 shadow-2xl bg-gray-100">
                  {profile?.profilePhotoUrl ? (
                    <img
                      src={profile.profilePhotoUrl}
                      alt={profile.displayName}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <span className="text-7xl font-bold text-blue-900">
                        {profile?.displayName?.charAt(0) || "S"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Floating credential card */}
                <div className="absolute -bottom-7 -left-7 px-4 py-3 bg-white border border-gray-200 rounded-xl flex items-center gap-3 shadow-lg z-10">
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <BadgeCheck className="w-5 h-5 text-blue-800" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 leading-tight">
                      HRD Corp Certified
                    </p>
                    <p className="text-xs text-gray-500">Trainer #44523</p>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Live Counters (CR-04) ─────────────────────────────────── */}
      <LiveCounters />

      {/* ─── Certifications & Badges ────────────────────────────────── */}
      <section id="credentials" className="py-20 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <SectionHeading
              label="Professional Certifications"
              title="Certifications & Badges"
              description="Industry-recognized certifications and credentials from leading technology providers"
            />
          </FadeIn>
          <BadgeDisplay />
        </div>
      </section>

      {/* ─── Case Studies (CR-04) ───────────────────────────────────── */}
      <CaseStudiesSection />

      {/* ─── Training Expertise ─────────────────────────────────────── */}
      <section
        id="expertise"
        className="py-20 lg:py-24 bg-white border-y border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <SectionHeading
              label="Training Portfolio"
              title="Training Expertise & Delivery"
              description="Structured training programmes organized by domain knowledge areas — from Project Management & Productivity to Digital Technology, Engineering Literacy, and Workplace Culture"
            />
          </FadeIn>
          <FadeIn delay={100}>
            <TrainingExpertise defaultExpanded={false} />
          </FadeIn>
        </div>
      </section>

      {/* ─── Testimonials (CR-04) ───────────────────────────────────── */}
      <TestimonialsSection />

      {/* ─── Clients ────────────────────────────────────────────────── */}
      <section id="clients" className="py-20 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <SectionHeading
              label="Trusted Organizations"
              title="List of Agencies"
              description="Delivered training for government agencies, GLCs, multinational corporations, and higher education institutions across Malaysia"
            />
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
                <ClientCategoryFilter
                  selected={clientFilter}
                  onSelect={setClientFilter}
                />
              </div>
              <ClientGrid
                actualClients={[...new Set(classes.map((c) => c.clientName))]}
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── Teaching Experience ────────────────────────────────────── */}
      <section
        id="experience"
        className="py-20 lg:py-24 bg-white border-y border-gray-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <SectionHeading
              label="Track Record"
              title="Teaching Experience"
              description="Comprehensive portfolio of training programs and workshops"
            />
          </FadeIn>

          {/* Filters */}
          <FadeIn delay={100}>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-white border-gray-300 rounded-md text-gray-700">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={topicFilter} onValueChange={setTopicFilter}>
                <SelectTrigger className="w-full sm:w-52 bg-white border-gray-300 rounded-md text-gray-700">
                  <Target className="w-4 h-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Topic" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="all">All Topics</SelectItem>
                  {topics.map((topic) => (
                    <SelectItem key={topic} value={topic}>
                      {topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FadeIn>

          {/* Class cards */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-800 rounded-full animate-spin" />
            </div>
          ) : classes.length === 0 ? (
            <FadeIn>
              <div className="bg-gray-50 border border-gray-200 rounded-xl py-16 text-center">
                <Award className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  {yearFilter !== "all" || topicFilter !== "all"
                    ? "No classes match the selected filters."
                    : "No completed classes to display yet."}
                </p>
              </div>
            </FadeIn>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.map((cls, index) => (
                <FadeIn key={cls.id} delay={index * 40}>
                  <div className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-base text-gray-900 group-hover:text-blue-800 transition-colors leading-snug">
                            {cls.title}
                          </h3>
                          <p className="text-gray-500 text-sm mt-1">
                            {cls.clientName}
                          </p>
                        </div>
                        <div className="shrink-0 w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                          <BookOpen className="w-4 h-4 text-blue-700" />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
                          {cls.topicCategory}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          {cls.mode.replace("_", " ")}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                          {cls.clientType}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(cls.startDatetime).getFullYear()}
                        </span>
                        {cls.location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {cls.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Download Profile CTA (CR-04) ───────────────────────────── */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DownloadProfileCTA variant="hero" />
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left">
                <h3 className="text-2xl lg:text-3xl font-bold text-white">
                  Ready to Transform Your Team?
                </h3>
                <p className="text-blue-200 mt-2 max-w-lg text-sm leading-relaxed">
                  Get in touch to discuss customized training programmes for
                  your organization
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                <a href={`mailto:${profile?.email || "msulfri@gmail.com"}`}>
                  <Button
                    size="lg"
                    className="bg-white text-blue-900 hover:bg-blue-50 font-semibold px-8 shadow-sm"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Get in Touch
                  </Button>
                </a>
                <Link href="/downloads-public">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-blue-400/50 text-white hover:bg-blue-800 hover:text-white px-8"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Resources
                  </Button>
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Sticky Mobile CTA */}
      {!ctaLoading && (
        <StickyCtaBar
          whatsappNumber={ctaSettings.whatsappNumber}
          whatsappPrefillMessage={ctaSettings.whatsappPrefillMessage}
          enabled={ctaSettings.enabled}
        />
      )}

      {/* ─── Footer ─────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center gap-3 mb-2">
                <img 
                  src="/msh-logo.svg" 
                  alt="MSH Corporate Trainer" 
                  className="w-10 h-10 object-contain"
                />
                <span className="font-semibold text-lg">
                  MSH Corporate Trainer
                </span>
              </div>
              <p className="text-sm text-gray-400">
                {profile?.headline ||
                  "Senior Corporate Trainer & Project Management Expert"}
              </p>
            </div>
            <div className="flex items-center gap-5">
              {profile?.email && (
                <a
                  href={`mailto:${profile.email}`}
                  aria-label="Send email"
                  className="text-gray-500 hover:text-blue-400 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                </a>
              )}
              {profile?.linkedinUrl && (
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit LinkedIn profile"
                  className="text-gray-500 hover:text-blue-400 transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()}{" "}
              {profile?.displayName || "Mohd Sulfri Mohd Harris"}. All rights
              reserved.
            </p>
            {profile?.lastUpdatedAt && (
              <p className="mt-1 text-xs text-gray-700">
                Last updated:{" "}
                {new Date(profile.lastUpdatedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function PublicProfilePage() {
  return (
    <>
      <HeadMeta
        title="MSH Corporate Trainer | Professional Training & Consulting"
        description="Delivering high-impact training programmes for government agencies, GLCs, and multinational corporations. Project Management, Digital Transformation, and Leadership Development."
        canonical="/"
      />
      <PageContent />
    </>
  )
}

// ─── Badge Display ───────────────────────────────────────────────────────────

function BadgeDisplay() {
  const [badges, setBadges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const response = await fetch("/api/badges?limit=8")
        const data = await response.json()
        if (response.ok && data.badges) setBadges(data.badges)
      } catch (error) {
        console.error("Error fetching badges:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchBadges()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-800 rounded-full animate-spin" />
      </div>
    )
  }

  if (badges.length === 0) {
    return (
      <div className="text-center py-12">
        <Award className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No certifications to display yet.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {badges.map((badge, index) => (
          <FadeIn key={badge.id} delay={index * 50}>
            <Link href={`/badges/${badge.slug}`}>
              <div className="group bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 h-full">
                {/* Badge image */}
                <div className="relative aspect-square mb-4 overflow-hidden rounded-lg bg-gray-50 border border-gray-100">
                  {badge.fallbackImageUrl ? (
                    <img
                      src={badge.fallbackImageUrl}
                      alt={badge.title}
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Award className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 w-5 h-5 bg-blue-900 rounded-full flex items-center justify-center">
                    <Shield className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>

                {/* Badge info */}
                <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 group-hover:text-blue-800 transition-colors leading-snug">
                  {badge.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{badge.issuer}</p>
                {badge.issueDate && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(badge.issueDate).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}

                {badge.skills && badge.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {badge.skills.slice(0, 3).map((skill: any) => (
                      <span
                        key={skill.id}
                        className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded"
                      >
                        {skill.name}
                      </span>
                    ))}
                    {badge.skills.length > 3 && (
                      <span className="text-[10px] text-gray-400">
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

      <div className="text-center mt-8">
        <Link href="/badges">
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
          >
            View All Credentials
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
