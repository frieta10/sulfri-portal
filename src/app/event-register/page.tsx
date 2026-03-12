"use client"

import { useEffect, useState, Suspense, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { eventRegistrationSchema, type EventRegistrationFormData } from "@/lib/validations/event-registration"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { 
  Loader2, 
  MapPin, 
  Calendar, 
  Monitor, 
  Building2, 
  Search, 
  X, 
  ChevronDown, 
  ChevronUp,
  Check,
  GraduationCap
} from "lucide-react"

// Types
interface Course {
  id: string
  title: string
  shortDescription: string | null
  deliveryMode: "ONLINE" | "PHYSICAL" | "HYBRID"
  startDate: string | null
  endDate: string | null
  location: string | null
}

interface EventSettings {
  yayasanNoticeText: string
  registrationPageTitle: string
  registrationPageTagline: string
}

// Delivery mode icons
const deliveryModeIcons = {
  ONLINE: Monitor,
  PHYSICAL: MapPin,
  HYBRID: Building2,
}

const deliveryModeLabels = {
  ONLINE: "Online",
  PHYSICAL: "Physical",
  HYBRID: "Hybrid",
}

function EventRegistrationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const utmSource = searchParams.get("utm_source")

  const [courses, setCourses] = useState<Course[]>([])
  const [settings, setSettings] = useState<EventSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [noCoursesAvailable, setNoCoursesAvailable] = useState(false)
  
  // Search and suggestion states
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showAllCourses, setShowAllCourses] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<EventRegistrationFormData>({
    resolver: zodResolver(eventRegistrationSchema),
    defaultValues: {
      consentFlag: false,
      courseIds: [],
      utmSource: utmSource || null,
    },
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    setValue("courseIds", selectedCourses)
  }, [selectedCourses, setValue])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch courses and settings in parallel
      const [coursesRes, settingsRes] = await Promise.all([
        fetch("/api/event/courses"),
        fetch("/api/event/settings"),
      ])

      if (!coursesRes.ok) throw new Error("Failed to load courses")
      if (!settingsRes.ok) throw new Error("Failed to load settings")

      const coursesData = await coursesRes.json()
      const settingsData = await settingsRes.json()

      setCourses(coursesData.courses)
      setSettings(settingsData)
      setNoCoursesAvailable(coursesData.courses.length === 0)
    } catch (err: any) {
      console.error("Error fetching data:", err)
      setError(err.message || "Failed to load registration data")
    } finally {
      setLoading(false)
    }
  }

  // Filter courses based on search query
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()
    return courses.filter(course => 
      course.title.toLowerCase().includes(query) ||
      (course.shortDescription?.toLowerCase().includes(query)) ||
      (course.location?.toLowerCase().includes(query))
    )
  }, [searchQuery, courses])

  // Get selected course objects
  const selectedCourseObjects = useMemo(() => {
    return courses.filter(course => selectedCourses.includes(course.id))
  }, [selectedCourses, courses])

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    )
  }

  const removeSelectedCourse = (courseId: string) => {
    setSelectedCourses((prev) => prev.filter((id) => id !== courseId))
  }

  const onSubmit = async (data: EventRegistrationFormData) => {
    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch("/api/event/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit registration")
      }

      const result = await response.json()
      
      // Redirect to success page with lead info
      router.push(`/event-register/success?leadId=${result.leadId}`)
    } catch (err: any) {
      console.error("Error submitting registration:", err)
      setError(err.message || "Failed to submit registration")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            {settings?.registrationPageTitle || "Register Your Interest"}
          </h1>
          <p className="text-gray-600">
            {settings?.registrationPageTagline || "Join our upcoming professional development programmes"}
          </p>
        </div>

        {/* YAYASAN PENERAJU Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-900 text-center font-medium">
            {settings?.yayasanNoticeText || "All courses listed are offered under the YAYASAN PENERAJU programme."}
          </p>
        </div>

        {/* Course Selection with Search */}
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Select Courses</CardTitle>
            <CardDescription>
              Search and select the courses you&apos;re interested in attending
            </CardDescription>
          </CardHeader>
          <CardContent>
            {noCoursesAvailable ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">
                  Upcoming courses will be announced soon. Submit your details to be notified.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search courses (e.g., Data Analytics, Cybersecurity...)"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setShowSuggestions(true)
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="pl-10 pr-4 py-3 text-base"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("")
                        setShowSuggestions(false)
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Search Suggestions */}
                {showSuggestions && searchQuery.trim() && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-lg">
                    {filteredCourses.length > 0 ? (
                      <div className="max-h-64 overflow-y-auto">
                        <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 font-medium uppercase tracking-wider">
                          Suggestions ({filteredCourses.length} found)
                        </div>
                        {filteredCourses.map((course) => {
                          const Icon = deliveryModeIcons[course.deliveryMode]
                          const isSelected = selectedCourses.includes(course.id)
                          return (
                            <button
                              key={course.id}
                              onClick={() => {
                                toggleCourseSelection(course.id)
                                setSearchQuery("")
                                setShowSuggestions(false)
                              }}
                              className={`w-full px-4 py-3 flex items-start gap-3 text-left border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${
                                isSelected ? "bg-blue-50 hover:bg-blue-100" : ""
                              }`}
                            >
                              <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                isSelected ? "bg-blue-500 border-blue-500" : "border-gray-300"
                              }`}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-gray-900">{course.title}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    <Icon className="w-3 h-3 mr-1" />
                                    {deliveryModeLabels[course.deliveryMode]}
                                  </Badge>
                                </div>
                                {course.shortDescription && (
                                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{course.shortDescription}</p>
                                )}
                                {(course.startDate || course.location) && (
                                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                    {course.startDate && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(course.startDate).toLocaleDateString()}
                                      </span>
                                    )}
                                    {course.location && (
                                      <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {course.location}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="px-4 py-6 text-center text-gray-500">
                        <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>No courses found matching &quot;{searchQuery}&quot;</p>
                        <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Browse All Courses Toggle */}
                <button
                  onClick={() => setShowAllCourses(!showAllCourses)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {showAllCourses ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Hide all courses
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Browse all {courses.length} courses
                    </>
                  )}
                </button>

                {/* All Courses List (Collapsible) */}
                {showAllCourses && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white max-h-96 overflow-y-auto">
                    <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 font-medium uppercase tracking-wider sticky top-0">
                      All Courses ({courses.length})
                    </div>
                    {courses.map((course) => {
                      const Icon = deliveryModeIcons[course.deliveryMode]
                      const isSelected = selectedCourses.includes(course.id)
                      return (
                        <div
                          key={course.id}
                          onClick={() => toggleCourseSelection(course.id)}
                          className={`px-4 py-3 flex items-start gap-3 border-b border-gray-100 last:border-0 cursor-pointer transition-colors ${
                            isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                          }`}
                        >
                          <Checkbox checked={isSelected} className="mt-1" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-900">{course.title}</span>
                              <Badge variant="secondary" className="text-xs">
                                <Icon className="w-3 h-3 mr-1" />
                                {deliveryModeLabels[course.deliveryMode]}
                              </Badge>
                            </div>
                            {course.shortDescription && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-1">{course.shortDescription}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Selected Courses */}
                {selectedCourseObjects.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Selected Courses ({selectedCourseObjects.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCourseObjects.map((course) => (
                        <div
                          key={course.id}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm"
                        >
                          <span className="font-medium">{course.title}</span>
                          <button
                            onClick={() => removeSelectedCourse(course.id)}
                            className="p-0.5 hover:bg-blue-200 rounded transition-colors"
                            aria-label={`Remove ${course.title}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {errors.courseIds && !noCoursesAvailable && (
                  <p className="text-sm text-red-600">{errors.courseIds.message}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Personal Details Form */}
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Your Details</CardTitle>
            <CardDescription>
              Fill in your information to complete your registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    {...register("fullName")}
                    placeholder="John Doe"
                    disabled={submitting}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-red-600 mt-1">{errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="john.doe@example.com"
                    disabled={submitting}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="phone">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register("phone")}
                  placeholder="+60 12-345 6789"
                  disabled={submitting}
                />
                {errors.phone && (
                  <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="organisation">Organisation (Optional)</Label>
                  <Input
                    id="organisation"
                    {...register("organisation")}
                    placeholder="Your company or institution"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <Label htmlFor="jobTitle">Job Title (Optional)</Label>
                  <Input
                    id="jobTitle"
                    {...register("jobTitle")}
                    placeholder="Your role or designation"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Controller
                  name="consentFlag"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="consentFlag"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={submitting}
                      />
                      <Label htmlFor="consentFlag" className="cursor-pointer text-sm leading-relaxed">
                        I consent to my details being used for course registration and follow-up communications by Mohd Sulfri Mohd Harris.{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                    </div>
                  )}
                />
                {errors.consentFlag && (
                  <p className="text-sm text-red-600 mt-1">{errors.consentFlag.message}</p>
                )}
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg" 
                  disabled={submitting || (!noCoursesAvailable && selectedCourses.length === 0)}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Registration"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          By registering, you agree to our data processing terms in accordance with PDPA Malaysia.
        </p>
      </div>
    </div>
  )
}

// Main page component with Suspense
export default function EventRegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <EventRegistrationForm />
    </Suspense>
  )
}
