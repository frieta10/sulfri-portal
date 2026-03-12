"use client"

import { useState } from "react"
import { HeadMeta } from "@/components/seo/head-meta"
import { StickyCtaBar, useStickyCtaSettings } from "@/components/mobile/sticky-cta-bar"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { contactFormSchema, type ContactFormData } from "@/lib/validations/contact"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { CheckCircle2, Loader2, Mail, Phone, MapPin } from "lucide-react"
import Link from "next/link"

function ContactPageContent() {
  const { settings: ctaSettings, loading: ctaLoading } = useStickyCtaSettings()
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      consentFlag: false,
    },
  })

  const onSubmit = async (data: ContactFormData) => {
    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch("/api/contact/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit message")
      }

      setSuccess(true)
      reset()
    } catch (err: any) {
      console.error("Error submitting contact form:", err)
      setError(err.message || "Failed to submit message. Please try again later.")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-green-200">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">
                Message Sent Successfully!
              </CardTitle>
              <CardDescription>
                Thank you for reaching out. We'll get back to you soon.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                We've received your message and will respond to your inquiry as soon as possible.
              </p>
              <div className="flex justify-center gap-4 pt-4">
                <Button asChild variant="outline">
                  <Link href="/">Return to Home</Link>
                </Button>
                <Button onClick={() => setSuccess(false)}>
                  Send Another Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Get in Touch
              </h1>
              <p className="text-lg text-gray-600">
                Have a question about our training programs? Want to discuss a custom solution for your organization? We'd love to hear from you.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Email</h3>
                  <p className="text-gray-600">Send us a message anytime</p>
                  <a 
                    href="mailto:contact@mshtrainer.com" 
                    className="text-amber-600 hover:text-amber-700 font-medium"
                  >
                    contact@mshtrainer.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Phone</h3>
                  <p className="text-gray-600">Mon-Fri from 9am to 6pm</p>
                  <a 
                    href="tel:+60123456789" 
                    className="text-amber-600 hover:text-amber-700 font-medium"
                  >
                    +60 12-345 6789
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Location</h3>
                  <p className="text-gray-600">Based in Kuala Lumpur</p>
                  <p className="text-gray-600">Serving clients across Malaysia and Southeast Asia</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll respond within 24 hours.
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
                  <Label htmlFor="name">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="John Doe"
                    disabled={submitting}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
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
                    placeholder="+60 12-345 6789"
                    disabled={submitting}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="organisation">Organisation (Optional)</Label>
                  <Input
                    id="organisation"
                    {...register("organisation")}
                    placeholder="Your company or institution"
                    disabled={submitting}
                  />
                  {errors.organisation && (
                    <p className="text-sm text-red-600 mt-1">{errors.organisation.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="message">
                    Message <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    {...register("message")}
                    placeholder="How can we help you?"
                    rows={5}
                    disabled={submitting}
                  />
                  {errors.message && (
                    <p className="text-sm text-red-600 mt-1">{errors.message.message}</p>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="consentFlag"
                      {...register("consentFlag")}
                      disabled={submitting}
                    />
                    <Label htmlFor="consentFlag" className="cursor-pointer text-sm leading-relaxed">
                      I consent to the collection and processing of my personal data for the purpose of responding to my inquiry. 
                      <span className="text-red-500">*</span>
                    </Label>
                  </div>
                  {errors.consentFlag && (
                    <p className="text-sm text-red-600 mt-1">{errors.consentFlag.message}</p>
                  )}
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg" 
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Message"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky Mobile CTA */}
      {!ctaLoading && (
        <StickyCtaBar
          whatsappNumber={ctaSettings.whatsappNumber}
          whatsappPrefillMessage={ctaSettings.whatsappPrefillMessage}
          enabled={ctaSettings.enabled}
        />
      )}
    </div>
  )
}

export default function ContactPage() {
  return (
    <>
      <HeadMeta
        title="Contact Us"
        description="Get in touch for training inquiries and corporate solutions. Available for project management, digital transformation, and leadership training across Malaysia."
        canonical="/contact"
      />
      <ContactPageContent />
    </>
  )
}
