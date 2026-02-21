"use client"

import { useEffect, useState } from "react"
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
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Calendar,
  BookOpen,
  Award,
  Download,
} from "lucide-react"

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

export default function PublicProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [classes, setClasses] = useState<ExperienceClass[]>([])
  const [yearFilter, setYearFilter] = useState("all")
  const [topicFilter, setTopicFilter] = useState("all")
  const [years, setYears] = useState<string[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [totalClasses, setTotalClasses] = useState(0)
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <span className="font-bold text-lg text-gray-900">
              {profile?.displayName || "Sulfri Trainer"}
            </span>
            <nav className="flex items-center gap-4">
              <a href="#experience" className="text-sm text-gray-600 hover:text-gray-900">
                Experience
              </a>
              <Link href="/downloads-public" className="text-sm text-gray-600 hover:text-gray-900">
                Downloads
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm">Admin</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero / Profile Section */}
      <section className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
              {profile?.profilePhotoUrl ? (
                <img src={profile.profilePhotoUrl} alt={profile.displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-gray-400">
                  {profile?.displayName?.charAt(0) || "S"}
                </span>
              )}
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-4xl font-bold text-gray-900">
                {profile?.displayName || "Sulfri Trainer"}
              </h1>
              {profile?.headline && (
                <p className="text-xl text-gray-600 mt-2">{profile.headline}</p>
              )}
              {profile?.bio && (
                <p className="text-gray-700 mt-4 max-w-2xl leading-relaxed">{profile.bio}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-6 justify-center md:justify-start">
                {profile?.email && (
                  <a href={`mailto:${profile.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600">
                    <Mail className="w-4 h-4" /> {profile.email}
                  </a>
                )}
                {profile?.phone && (
                  <a href={`tel:${profile.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600">
                    <Phone className="w-4 h-4" /> {profile.phone}
                  </a>
                )}
                {profile?.locationBase && (
                  <span className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" /> {profile.locationBase}
                  </span>
                )}
                {profile?.linkedinUrl && (
                  <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600">
                    <Linkedin className="w-4 h-4" /> LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-gray-900">{totalClasses}</p>
              <p className="text-sm text-gray-600">Classes Completed</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{topics.length}</p>
              <p className="text-sm text-gray-600">Topic Areas</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{years.length}</p>
              <p className="text-sm text-gray-600">Years Active</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {[...new Set(classes.map((c) => c.clientName))].length}
              </p>
              <p className="text-sm text-gray-600">Clients Served</p>
            </div>
          </div>
        </div>
      </section>

      {/* Teaching Experience */}
      <section id="experience" className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-6 h-6" /> Teaching Experience
              </h2>
              <p className="text-gray-600 mt-1">Completed classes and training programs</p>
            </div>
            <div className="flex gap-3">
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={topicFilter} onValueChange={setTopicFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  {topics.map((topic) => (
                    <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading experience...</p>
            </div>
          ) : classes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {yearFilter !== "all" || topicFilter !== "all"
                    ? "No classes match the selected filters."
                    : "No completed classes to display yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.map((cls) => (
                <Card key={cls.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{cls.title}</h3>
                        <p className="text-sm text-gray-600">{cls.clientName}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {cls.topicCategory}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {cls.mode.replace("_", " ")}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {cls.clientType}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(cls.startDatetime).toLocaleDateString()}
                        </span>
                        {cls.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" /> {cls.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} {profile?.displayName || "Sulfri Trainer"}. All rights reserved.</p>
          {profile?.lastUpdatedAt && (
            <p className="mt-1 text-xs text-gray-400">
              Last updated: {new Date(profile.lastUpdatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </footer>
    </div>
  )
}
