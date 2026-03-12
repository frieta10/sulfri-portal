"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2, Mail, Phone, QrCode } from "lucide-react"

interface LeadData {
  id: string
  fullName: string
  email: string
  courses: {
    id: string
    title: string
    deliveryMode: string
  }[]
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const leadId = searchParams.get("leadId")
  
  const [lead, setLead] = useState<LeadData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (leadId) {
      fetchLeadData()
    } else {
      setLoading(false)
    }
  }, [leadId])

  const fetchLeadData = async () => {
    try {
      const response = await fetch(`/api/admin/event/leads/${leadId}`)
      if (!response.ok) throw new Error("Failed to load registration data")
      const data = await response.json()
      setLead(data.lead)
    } catch (err) {
      console.error("Error fetching lead:", err)
      setError("Could not load registration details")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your registration details...</p>
        </div>
      </div>
    )
  }

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
            Thank you for your interest in our programmes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Registration Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-lg text-green-900">Registration Summary</h3>
            
            {lead ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="font-medium">Name:</span>
                  <span>{lead.fullName}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-4 h-4" />
                  <span>{lead.email}</span>
                </div>
                
                <div className="pt-2 border-t border-green-200">
                  <p className="font-medium text-green-900 mb-2">Selected Courses:</p>
                  <ul className="space-y-2">
                    {lead.courses.map((course: any) => (
                      <li key={course.id} className="flex items-center gap-2 text-gray-700">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>{course.title}</span>
                        <span className="text-xs text-gray-500">({course.deliveryMode})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">Your registration has been recorded successfully.</p>
            )}
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">What&apos;s Next?</h4>
            <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
              <li>You will receive a confirmation email shortly</li>
              <li>Our team will contact you with course details and schedules</li>
              <li>Prepare for an exciting learning journey!</li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Questions?</h4>
            <p className="text-sm text-gray-600 mb-3">
              If you have any questions about your registration or the courses, please contact:
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="font-medium">Mohd Sulfri Mohd Harris</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <Mail className="w-4 h-4" />
              <span>sulfri.training@example.com</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <Phone className="w-4 h-4" />
              <span>+60 12-345 6789</span>
            </div>
          </div>

          {/* Register Another */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link href="/event-register" className="flex-1">
              <Button variant="outline" className="w-full">
                <QrCode className="w-4 h-4 mr-2" />
                Register Another Person
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button className="w-full">
                Return to Homepage
              </Button>
            </Link>
          </div>

          {/* Data Deletion Notice */}
          <p className="text-xs text-gray-500 text-center">
            To request deletion of your personal data, please email us at{" "}
            <a href="mailto:privacy@example.com" className="text-blue-600 hover:underline">
              privacy@example.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// Main page component with Suspense
export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
