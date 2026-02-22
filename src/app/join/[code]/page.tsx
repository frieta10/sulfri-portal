"use client"

import { use, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registrationSchema, type RegistrationFormData } from "@/lib/validations/registration"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CheckCircle2, Calendar, MapPin, Users, Clock } from "lucide-react"

type ClassInfo = {
  id: string
  title: string
  clientName: string
  topicCategory: string
  mode: string
  location: string | null
  startDatetime: string
  endDatetime: string
  _count: {
    registrations: number
  }
}

export default function JoinClassPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [registrationData, setRegistrationData] = useState<any>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      consentFlag: false,
    },
  })

  useEffect(() => {
    fetchClassInfo()
  }, [code])

  const fetchClassInfo = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/join/${code}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to load class information")
      }

      const data = await response.json()
      setClassInfo(data.class)
    } catch (err: any) {
      console.error("Error fetching class:", err)
      setError(err.message || "Failed to load class information")
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch(`/api/join/${code}`, {
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
      setRegistrationData(result)
      setSuccess(true)
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
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-gray-500">Loading class information...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !classInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Unable to Load Class</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Please check your link and try again. If you continue to have issues, contact the organizer.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success && registrationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-green-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">
              Registration Successful!
            </CardTitle>
            <CardDescription>
              You're all set for the class
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-3">
              <h3 className="font-semibold text-lg">{registrationData.class.title}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(registrationData.class.startDatetime).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4" />
                  <span>
                    {new Date(registrationData.class.startDatetime).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {registrationData.class.location && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4" />
                    <span>{registrationData.class.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-700">
                  <Users className="w-4 h-4" />
                  <span>Mode: {registrationData.class.mode.replace("_", " ")}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">What's Next?</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>A confirmation has been recorded for {registrationData.registration.email}</li>
                <li>You will receive further details from the organizer</li>
                <li>Mark your calendar for the class date</li>
                <li>Prepare any required materials</li>
              </ul>
            </div>

            <div className="text-center text-sm text-gray-600">
              <p>See you at the class! 🎉</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Class Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{classInfo?.title}</CardTitle>
            <CardDescription>
              Organized by {classInfo?.clientName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">
                    {new Date(classInfo?.startDatetime || "").toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">
                    {new Date(classInfo?.startDatetime || "").toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{classInfo?.location || "Online"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Users className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Mode</p>
                  <p className="font-medium">{classInfo?.mode.replace("_", " ")}</p>
                </div>
              </div>
            </div>
            <div className="pt-2">
              <p className="text-sm text-gray-500">Topic</p>
              <p className="font-medium">{classInfo?.topicCategory}</p>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Register for This Class</CardTitle>
            <CardDescription>
              Fill in your details below to complete your registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

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

              <div>
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register("phone")}
                  placeholder="+1 (555) 123-4567"
                  disabled={submitting}
                />
                {errors.phone && (
                  <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="organization">Organization (Optional)</Label>
                <Input
                  id="organization"
                  {...register("organization")}
                  placeholder="Your company or institution"
                  disabled={submitting}
                />
                {errors.organization && (
                  <p className="text-sm text-red-600 mt-1">{errors.organization.message}</p>
                )}
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="consentFlag"
                    {...register("consentFlag")}
                    disabled={submitting}
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="consentFlag" className="cursor-pointer text-sm">
                    I consent to the collection and processing of my personal data for
                    registration purposes. <span className="text-red-500">*</span>
                  </Label>
                </div>
                {errors.consentFlag && (
                  <p className="text-sm text-red-600 mt-1">{errors.consentFlag.message}</p>
                )}
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? "Submitting..." : "Complete Registration"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
